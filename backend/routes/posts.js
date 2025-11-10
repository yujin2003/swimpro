// routes/posts.js

import express from "express";
import authMiddleware from "../middleware/auth.js";
import pool from "../db.js";
import OpenAI from "openai";

const router = express.Router();

// 게시글 작성(+GPT)
router.post("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { title, content, event_date, event_start_time, event_end_time } = req.body;

        // OpenAI 클라이언트 생성
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // --- GPT 분류 시작 ---
        const prompt = `
            당신은 수영 커뮤니티의 게시글을 분류하는 AI입니다.
            다음 게시글 텍스트(제목과 내용)를 분석하여, 아래 6가지 항목에 대해 JSON 형식으로 분류해 주세요.

            [분류 기준]
            1. role: '멘티' 또는 '멘토'
               - '멘티': 도움을 *요청*하거나, 질문하거나, 찾거나, 구하는 글. (예: "알려주실 분 구해요", "자세 교정 받고 싶어요", "질문입니다")
               - '멘토': 도움을 *제공*하거나, 가르쳐주거나, 지식을 공유하는 글. (예: "알려드릴게요", "팁 공유합니다", "자세 봐드립니다")

            2. event: '자유형', '배영', '평영', '접영' 중 가장 관련 있는 수영 종목. 언급이 없으면 '기타'
            
            3. location: '서울', '부산', '경기' 등 구체적인 지역명. 언급이 없으면 '전국'

            4. user_type: 글쓴이의 성향. 'A형(실력 중심)', 'B형(친목/가벼운 학습형)', 'C형(초보 입문형)' 중 하나.
               - A형 예시: "대회 준비", "고급 기술", "기록 단축"
               - B형 예시: "수영 친구", "같이 배워요", "편하게"
               - C형 예시: "완전 처음", "물 무서워요", "기초부터"
            
            5. intent: 글의 주요 의도. '루틴 요청', '팁 요청', '정보 공유', '질문', '조언자', '친구 찾기' 중 하나.

            [게시글 텍스트]
            제목: ${title}
            내용: ${content}

            [출력 형식]
            {"role": "...", "event": "...", "location": "...", "user_type": "...", "intent": "..."}
            
            JSON 객체만 응답해 주세요.
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }, // JSON 응답 요청 확인
        }); //GPT API 호출 확인

        const gptResponse = completion.choices[0].message.content;
        const metadata = JSON.parse(gptResponse); // GPT 응답 파싱 확인
        // --- GPT 분류 완료 ---

        let eventDatetime = null;
        let eventEndDatetime = null;
        if (event_date && event_start_time) {
            eventDatetime = new Date(`${event_date}T${event_start_time}:00`);
            if (isNaN(eventDatetime.getTime())) eventDatetime = null;
        }
        if (event_date && event_end_time) {
            eventEndDatetime = new Date(`${event_date}T${event_end_time}:00`);
            if (isNaN(eventEndDatetime.getTime())) eventEndDatetime = null;
        }

        // DB 저장
        const newPost = await pool.query(
            `INSERT INTO posts 
             (user_id, title, content, category, location, metadata, event_datetime, event_end_datetime) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                userId, title, content,
                metadata.event, 
                metadata.location,
                metadata, 
                eventDatetime,
                eventEndDatetime
            ]
        );

        res.status(201).json(newPost.rows[0]);

    } catch (err) {
        console.error("GPT API 오류 또는 DB 오류:", err.message);
        res.status(500).send("서버 에러가 발생했습니다.");
    }
});

// 2. 전체 게시글 목록 조회 API (Read) - 페이지네이션 지원
// GET /api/posts?page=1&limit=10&search=...
router.get("/", async (req, res) => {
    try {
        const { category, location, search, page = '1', limit = '10' } = req.query;

        // 페이지네이션 파라미터 파싱
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const offset = (pageNum - 1) * limitNum;

        let baseQuery = 
            `SELECT 
                post_id, title, category, location, 
                event_datetime, event_end_datetime, 
                posts.created_at,
                users.username, users.user_id 
             FROM posts 
             JOIN users ON posts.user_id = users.user_id`;
        
        const whereClauses = [];
        const queryParams = [];
        let paramIndex = 1;

        if (category) {
            whereClauses.push(`category = $${paramIndex++}`);
            queryParams.push(category);
        }
        if (location) {
            whereClauses.push(`location = $${paramIndex++}`);
            queryParams.push(location);
        }
        if (search) {
            // 제목과 내용 모두에서 검색
            whereClauses.push(`(title LIKE $${paramIndex} OR content LIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (whereClauses.length > 0) {
            baseQuery += " WHERE " + whereClauses.join(" AND ");
        }

        // 전체 게시글 수 조회 (페이지네이션을 위해) - COUNT 쿼리는 별도로 작성
        let countQuery = 
            `SELECT COUNT(*) as total 
             FROM posts 
             JOIN users ON posts.user_id = users.user_id`;
        
        if (whereClauses.length > 0) {
            countQuery += " WHERE " + whereClauses.join(" AND ");
        }
        
        const countResult = await pool.query(countQuery, queryParams);
        const totalPosts = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.ceil(totalPosts / limitNum);

        // 정렬 및 페이지네이션 적용
        baseQuery += " ORDER BY posts.created_at DESC";
        baseQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        queryParams.push(limitNum, offset);

        const filteredPosts = await pool.query(baseQuery, queryParams);
        
        // 페이지네이션 정보와 함께 응답
        res.json({
            posts: filteredPosts.rows,
            pagination: {
                currentPage: pageNum,
                totalPages: totalPages,
                totalPosts: totalPosts,
                limit: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

//3. 특정 게시글 상세 조회
router.get("/:id", async (req, res) => {
    try {
        // 1. URL 경로에서 게시글 ID
        const { id } = req.params;

        // 2. 해당 id 게시글 찾기
        const post = await pool.query(
            `SELECT 
                post_id, title, content, category, location, 
                event_datetime, event_end_datetime, 
                posts.created_at, posts.updated_at,
                users.username, users.user_id 
             FROM posts 
             JOIN users ON posts.user_id = users.user_id 
             WHERE post_id = $1`,
            [id]
        );

        if (post.rows.length === 0) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        //찾은 게시글 정보 응답으로 보냄
        res.json(post.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// 4. 게시글 수정(+GPT 재분류)
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // 1. 수정된 값 받기
       const { 
            title, content, 
            event_date, event_start_time, event_end_time 
            // category, location gpt가 만들어서 req.body에서 무시
        } = req.body;

        // 2. 수정 권한 확인
        const post = await pool.query("SELECT * FROM posts WHERE post_id = $1", [id]);
        if (post.rows.length === 0) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }
        if (post.rows[0].user_id !== userId) {
            return res.status(403).json({ message: "게시글을 수정할 권한이 없습니다." });
        }

        // 3. 수정된 내용으로 GPT 재분류
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const prompt = `
            당신은 수영 커뮤니티의 게시글을 분류하는 AI입니다.
            다음 게시글 텍스트(제목과 내용)를 분석하여, 아래 5가지 항목에 대해 JSON 형식으로 분류해 주세요.

            [분류 기준]
            1. role: '멘티', '멘토', 또는 '기타'
               - '멘티': 도움을 *요청*하거나, 질문하거나, 찾거나, 구하는 글. (예: "알려주실 분 구해요", "자세 교정 받고 싶어요")
               - '멘토': 도움을 *제공*하거나, 가르쳐주거나, 지식을 공유하는 글. (예: "알려드릴게요", "팁 공유합니다")
               - '기타': 멘토/멘티와 상관없는 일반적인 글. (예: "오늘 수영 다녀왔어요", "새 수영복 샀어요")

            2. event: '자유형', '배영', '평영', '접영' 중 가장 관련 있는 수영 종목. 언급이 없으면 '기타'
            
            3. location: '서울', '부산', '경기' 등 구체적인 지역명. 언급이 없으면 '전국'

            4. user_type: 글쓴이의 성향. 'A형(실력 중심)', 'B형(친목/가벼운 학습형)', 'C형(초보 입문형)' 중 하나.
               - A형 예시: "대회 준비", "고급 기술", "기록 단축"
               - B형 예시: "수영 친구", "같이 배워요", "편하게"
               - C형 예시: "완전 처음", "물 무서워요", "기초부터"
            
            5. intent: 글의 주요 의도. '루틴 요청', '팁 요청', '정보 공유', '질문', '조언자', '친구 찾기', '일상 공유' 중 하나.

            [게시글 텍스트]
            제목: ${title}
            내용: ${content}

            [출력 형식]
            {"role": "...", "event": "...", "location": "...", "user_type": "...", "intent": "..."}
            
            JSON 객체만 응답해 주세요.
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });
        const gptResponse = completion.choices[0].message.content;
        const metadata = JSON.parse(gptResponse);
        // 재분류 완료

        // 4. 일시 데이터 변환
        let eventDatetime = null;
        let eventEndDatetime = null;
        if (event_date && event_start_time) {
            eventDatetime = new Date(`${event_date}T${event_start_time}:00`);
            if (isNaN(eventDatetime.getTime())) eventDatetime = null;
        }
        if (event_date && event_end_time) {
            eventEndDatetime = new Date(`${event_date}T${event_end_time}:00`);
            if (isNaN(eventEndDatetime.getTime())) eventEndDatetime = null;
        }
        
        // 5. 업데이트 쿼리에 GPT가 분류한 값들을 추가
        const updatedPost = await pool.query(
            `UPDATE posts 
             SET title = $1, content = $2, event_datetime = $3, event_end_datetime = $4, 
                 category = $5, location = $6, metadata = $7, updated_at = CURRENT_TIMESTAMP 
             WHERE post_id = $8 RETURNING *`,
            [
                title, content, 
                eventDatetime, eventEndDatetime, 
                metadata.event,
                metadata.location,
                metadata, 
                id
            ]
        );

        res.json(updatedPost.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

//5. 게시글 삭제
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        // 1. 삭제할 게시글 ID
        const { id } = req.params;
        
        // 2. 현재 로그인한 사용자 ID
        const userId = req.user.userId;

        // 3. 권한 확인
        const post = await pool.query("SELECT * FROM posts WHERE post_id = $1", [id]);

        if (post.rows.length === 0) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        if (post.rows[0].user_id !== userId) {
            return res.status(403).json({ message: "게시글을 삭제할 권한이 없습니다." });
        }

        await pool.query("DELETE FROM posts WHERE post_id = $1", [id]);

        res.json({ message: "게시글이 성공적으로 삭제되었습니다." });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// 추천 게시글 조회 (인증 필요)
router.get("/:id/recommend", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params; // 기준이 되는 게시글 ID

        // 1. 기준 게시글 metadata 가져오기
        const basePost = await pool.query("SELECT metadata FROM posts WHERE post_id = $1", [id]);
        if (basePost.rows.length === 0) {
            return res.status(404).json({ message: "기준 게시글을 찾을 수 없습니다." });
        }
        
        const metadata = basePost.rows[0].metadata;
        if (!metadata) {
            // metadata가 없는 경우 최신 게시글 3개 반환
            const fallbackQuery = `
                SELECT 
                    post_id, title, metadata, event_datetime, event_end_datetime, created_at, user_id,
                    metadata->>'event' as category,
                    metadata->>'location' as location,
                    (SELECT username FROM users u WHERE u.user_id = p.user_id) as username 
                FROM posts p
                WHERE post_id != $1
                ORDER BY created_at DESC
                LIMIT 3
            `;
            const fallbackPosts = await pool.query(fallbackQuery, [id]);
            return res.json(fallbackPosts.rows);
        }
        
        const baseRole = metadata.role;         // ex 멘티
        const baseUserType = metadata.user_type; // ex C형(초보 입문형)
        const baseEvent = metadata.event;       // ex 자유형

        // 2.매칭할 상대 역할 결정
        let targetRole;
        if (baseRole === '멘토') {
            targetRole = '멘티';
        } else if (baseRole === '멘티') {
            targetRole = '멘토';
        } else {
            targetRole = '기타';
        }

        // 글 찾기
        const query = `
            SELECT 
                post_id, title, metadata, event_datetime, event_end_datetime, created_at, user_id,
                metadata->>'event' as category,
                metadata->>'location' as location,
                (SELECT username FROM users u WHERE u.user_id = p.user_id) as username 
            FROM posts p
            WHERE metadata->>'user_type' = $1  
              AND metadata->>'event' = $2
              AND metadata->>'role' = $3
              AND post_id != $4
            ORDER BY created_at DESC
            LIMIT 3
        `;
        
        const recommendedPosts = await pool.query(query, [baseUserType, baseEvent, targetRole, id]);
        
        // 디버깅: 추천 게시글 데이터 확인
        console.log('🔍 추천 게시글 쿼리 결과:', {
            count: recommendedPosts.rows.length,
            firstPost: recommendedPosts.rows[0] || null,
            firstPostId: recommendedPosts.rows[0]?.post_id || null
        });
        
        // 추천 게시글이 없으면 최신 게시글 3개 반환
        if (recommendedPosts.rows.length === 0) {
            const fallbackQuery = `
                SELECT 
                    post_id, title, metadata, event_datetime, event_end_datetime, created_at, user_id,
                    metadata->>'event' as category,
                    metadata->>'location' as location,
                    (SELECT username FROM users u WHERE u.user_id = p.user_id) as username 
                FROM posts p
                WHERE post_id != $1
                ORDER BY created_at DESC
                LIMIT 3
            `;
            const fallbackPosts = await pool.query(fallbackQuery, [id]);
            console.log('🔍 Fallback 추천 게시글:', {
                count: fallbackPosts.rows.length,
                firstPost: fallbackPosts.rows[0] || null,
                firstPostId: fallbackPosts.rows[0]?.post_id || null
            });
            
            // Fallback 데이터도 정규화
            const validatedFallback = fallbackPosts.rows.map(row => ({
                post_id: row.post_id,
                id: row.post_id,
                title: row.title,
                metadata: row.metadata,
                event_datetime: row.event_datetime,
                event_end_datetime: row.event_end_datetime,
                created_at: row.created_at,
                user_id: row.user_id,
                username: row.username,
                category: row.category || (row.metadata?.event ? row.metadata.event : null),
                location: row.location || (row.metadata?.location ? row.metadata.location : null)
            }));
            
            return res.json(validatedFallback);
        }
        
        // 응답 데이터 검증 및 정규화
        const validatedPosts = recommendedPosts.rows.map((row, idx) => {
            // post_id가 없으면 에러 로그
            if (!row.post_id) {
                console.error(`❌ 추천 게시글 ${idx}에 post_id가 없습니다:`, {
                    row,
                    '전체 키': Object.keys(row),
                    'row.post_id': row.post_id,
                    'row.id': row.id
                });
            }
            
            // 응답 데이터 정규화 (명시적으로 post_id 포함)
            return {
                post_id: row.post_id, // 반드시 포함
                id: row.post_id, // 호환성을 위해 id도 추가
                title: row.title,
                metadata: row.metadata,
                event_datetime: row.event_datetime,
                event_end_datetime: row.event_end_datetime,
                created_at: row.created_at,
                user_id: row.user_id,
                username: row.username,
                category: row.category || (row.metadata?.event ? row.metadata.event : null),
                location: row.location || (row.metadata?.location ? row.metadata.location : null)
            };
        });
        
        console.log('✅ 추천 게시글 최종 응답:', {
            count: validatedPosts.length,
            posts: validatedPosts.map(p => ({ 
                post_id: p.post_id, 
                id: p.id,
                title: p.title,
                'post_id 타입': typeof p.post_id
            }))
        });
        
        res.json(validatedPosts);

    } catch (err) {
        console.error("추천 API 오류:", err.message);
        res.status(500).send("서버 에러");
    }
});

export default router;