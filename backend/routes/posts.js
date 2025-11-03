// routes/posts.js

import express from "express";
import authMiddleware from "../middleware/auth.js";
import pool from "../db.js";
import OpenAI from "openai";

const router = express.Router();

// ★★★ 게시글 작성 API (GPT 연동 포함) ★★★
router.post("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { title, content, event_date, event_start_time, event_end_time } = req.body;

        // ★★★ OpenAI 클라이언트를 이 함수 안에서 생성합니다. ★★★
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
        }); // ★★★ GPT API 호출 확인 ★★★

        const gptResponse = completion.choices[0].message.content;
        const metadata = JSON.parse(gptResponse); // GPT 응답 파싱 확인
        // --- GPT 분류 완료 ---

        let eventDatetime = null;
        let eventEndDatetime = null; // 종료 시간 변수 추가
        if (event_date && event_start_time) {
            eventDatetime = new Date(`${event_date}T${event_start_time}:00`);
            if (isNaN(eventDatetime.getTime())) eventDatetime = null;
        }
        if (event_date && event_end_time) {
            eventEndDatetime = new Date(`${event_date}T${event_end_time}:00`);
            if (isNaN(eventEndDatetime.getTime())) eventEndDatetime = null;
        }

        // ★★★ DB 저장 시 metadata 포함 확인 ★★★
        const newPost = await pool.query(
            `INSERT INTO posts 
             (user_id, title, content, category, location, metadata, event_datetime, event_end_datetime) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                userId, title, content,
                metadata.event, // GPT 분류 event
                metadata.location, // GPT 분류 location
                metadata, // GPT 분류 metadata 객체 전체
                eventDatetime,
                eventEndDatetime
            ]
        );

        res.status(201).json(newPost.rows[0]);

    } catch (err) {
        console.error("GPT API 오류 또는 DB 오류:", err.message); // 에러 로그 강화
        res.status(500).send("서버 에러가 발생했습니다.");
    }
});

// 2. 전체 게시글 목록 조회 API (Read)
// GET /api/posts
router.get("/", async (req, res) => {
    try {
        const { category, location, search } = req.query;

        // 2. (★ 수정된 부분) SELECT 목록에 event_datetime과 event_end_datetime을 추가합니다.
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

        // (이하 필터링 로직은 동일)
        if (category) {
            whereClauses.push(`category = $${paramIndex++}`);
            queryParams.push(category);
        }
        if (location) {
            whereClauses.push(`location = $${paramIndex++}`);
            queryParams.push(location);
        }
        if (search) {
            whereClauses.push(`title LIKE $${paramIndex++}`);
            queryParams.push(`%${search}%`);
        }

        if (whereClauses.length > 0) {
            baseQuery += " WHERE " + whereClauses.join(" AND ");
        }

        baseQuery += " ORDER BY posts.created_at DESC";

        const filteredPosts = await pool.query(baseQuery, queryParams);
        res.json(filteredPosts.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// ★★★ 3. 특정 게시글 상세 조회 API (Read by ID) - 이 부분을 추가합니다 ★★★
router.get("/:id", async (req, res) => {
    try {
        // 1. URL 경로에서 게시글 ID를 가져옵니다 (예: /posts/1 이면 id는 '1')
        const { id } = req.params;

        // 2. DB에서 해당 ID를 가진 게시글을 찾습니다. (작성자 username 포함)
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

        // 3. 게시글이 존재하지 않으면 '404 Not Found' 에러를 보냅니다.
        if (post.rows.length === 0) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        // 4. 찾은 게시글 정보를 응답으로 보냅니다.
        res.json(post.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// ★★★ 4. 게시글 수정 API (Update) - GPT 재분류 기능 추가 ★★★
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // 1. 프론트에서 수정된 '모든' 값을 받습니다.
        const { 
            title, content, 
            event_date, event_start_time, event_end_time 
            // category, location은 이제 GPT가 만드므로 req.body에서 무시합니다.
        } = req.body;

        // 2. (기존 로직) 수정 권한 확인
        const post = await pool.query("SELECT * FROM posts WHERE post_id = $1", [id]);
        if (post.rows.length === 0) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }
        if (post.rows[0].user_id !== userId) {
            return res.status(403).json({ message: "게시글을 수정할 권한이 없습니다." });
        }

        // ★★★ 3. (추가) 수정된 내용으로 GPT 재분류 ★★★
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
        // ★★★ GPT 재분류 완료 ★★★

        // 4. (기존 로직) '일시' 데이터 변환
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
        
        // 5. (★ 수정된 부분) DB 업데이트 쿼리에 GPT가 분류한 값들을 추가합니다.
        const updatedPost = await pool.query(
            `UPDATE posts 
             SET title = $1, content = $2, event_datetime = $3, event_end_datetime = $4, 
                 category = $5, location = $6, metadata = $7, updated_at = CURRENT_TIMESTAMP 
             WHERE post_id = $8 RETURNING *`,
            [
                title, content, 
                eventDatetime, eventEndDatetime, 
                metadata.event, // GPT가 새로 분류한 종목
                metadata.location, // GPT가 새로 분류한 지역
                metadata, // GPT가 새로 분류한 metadata
                id
            ]
        );

        res.json(updatedPost.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// ★★★ 5. 게시글 삭제 API (Delete) - 이 부분을 추가합니다 ★★★
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        // 1. 삭제할 게시글의 ID를 가져옵니다.
        const { id } = req.params;
        
        // 2. 현재 로그인한 사용자의 ID를 가져옵니다.
        const userId = req.user.userId;

        // 3. (권한 확인) DB에서 해당 게시글의 작성자가 현재 사용자와 일치하는지 확인합니다.
        const post = await pool.query("SELECT * FROM posts WHERE post_id = $1", [id]);

        if (post.rows.length === 0) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        if (post.rows[0].user_id !== userId) {
            return res.status(403).json({ message: "게시글을 삭제할 권한이 없습니다." });
        }

        // 4. 권한이 있다면, 게시글을 DB에서 삭제합니다.
        await pool.query("DELETE FROM posts WHERE post_id = $1", [id]);

        res.json({ message: "게시글이 성공적으로 삭제되었습니다." });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// ★★★ 6. 추천 게시글 조회 API (로직 강화 버전)
router.get("/:id/recommend", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params; // 기준이 되는 게시글 ID

        // 1. 기준 게시글의 metadata를 가져옵니다.
        const basePost = await pool.query("SELECT metadata FROM posts WHERE post_id = $1", [id]);
        if (basePost.rows.length === 0) {
            return res.status(404).json({ message: "기준 게시글을 찾을 수 없습니다." });
        }
        
        const metadata = basePost.rows[0].metadata;
        const baseRole = metadata.role;         // 예: "멘티"
        const baseUserType = metadata.user_type; // 예: "C형(초보 입문형)"
        const baseEvent = metadata.event;       // 예: "자유형"

        // 2. (★ 핵심 로직) 매칭할 '상대 역할'을 결정합니다.
        let targetRole;
        if (baseRole === '멘토') {
            targetRole = '멘티'; // 멘토 -> 멘티 찾기
        } else if (baseRole === '멘티') {
            targetRole = '멘토'; // 멘티 -> 멘토 찾기
        } else {
            targetRole = '기타'; // 기타 -> 기타 찾기
        }

        // 3. (★ 핵심 쿼리)
        // (같은 성격) user_type이 일치하고,
        // (같은 종목) event가 일치하고,
        // (역할 매칭) role이 targetRole인 글을 찾습니다.
        const query = `
            SELECT 
                post_id, title, metadata, event_datetime, created_at,
                (SELECT username FROM users u WHERE u.user_id = p.user_id) as username 
            FROM posts p
            WHERE metadata->>'user_type' = $1  
              AND metadata->>'event' = $2
              AND metadata->>'role' = $3
              AND post_id != $4
            ORDER BY created_at DESC
            LIMIT 5
        `;
        
        const recommendedPosts = await pool.query(query, [baseUserType, baseEvent, targetRole, id]);
        res.json(recommendedPosts.rows);

    } catch (err) {
        console.error("추천 API 오류:", err.message);
        res.status(500).send("서버 에러");
    }
});

export default router;