// routes/posts.js

import express from "express";
import authMiddleware from "../middleware/auth.js";
import pool from "../db.js";

const router = express.Router();

// 1. 게시글 작성 API (Create)
// POST /api/posts
router.post("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { title, content, category, location } = req.body;

        const newPost = await pool.query(
            "INSERT INTO posts (user_id, title, content, category, location) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [userId, title, content, category, location]
        );

        res.status(201).json(newPost.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// 2. 전체 게시글 목록 조회 API (Read)
// GET /api/posts
router.get("/", async (req, res) => {
    try {
        // 1. URL 쿼리에서 필터링 및 검색 조건을 가져옵니다.
        // 예: /api/posts?category=자유형&location=서울&search=자세
        const { category, location, search } = req.query;

        // 2. 기본 SQL 쿼리문
        let baseQuery = "SELECT post_id, title, category, location, posts.created_at, username FROM posts JOIN users ON posts.user_id = users.user_id";
        
        const whereClauses = [];
        const queryParams = [];
        let paramIndex = 1;

        // 3. 조건에 따라 WHERE 절과 파라미터를 동적으로 추가합니다.
        if (category) {
            whereClauses.push(`category = $${paramIndex++}`);
            queryParams.push(category);
        }
        if (location) {
            whereClauses.push(`location = $${paramIndex++}`);
            queryParams.push(location);
        }
        if (search) {
            // 'LIKE'를 사용해 제목에 검색어가 포함된 게시글을 찾습니다.
            whereClauses.push(`title LIKE $${paramIndex++}`);
            queryParams.push(`%${search}%`);
        }

        // 4. WHERE 절이 하나라도 있으면, 쿼리문에 추가합니다.
        if (whereClauses.length > 0) {
            baseQuery += " WHERE " + whereClauses.join(" AND ");
        }

        // 5. 항상 최신순으로 정렬합니다.
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
            "SELECT post_id, title, content, category, location, posts.created_at, username FROM posts JOIN users ON posts.user_id = users.user_id WHERE post_id = $1",
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

// ★★★ 4. 게시글 수정 API (Update) - 이 부분을 추가합니다 ★★★
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        // 1. 수정할 게시글의 ID와, 수정할 내용을 Body에서 가져옵니다.
        const { id } = req.params;
        const { title, content, category, location } = req.body;
        
        // 2. 현재 로그인한 사용자의 ID를 가져옵니다.
        const userId = req.user.userId;

        // 3. (권한 확인) DB에서 해당 게시글을 조회하여, 작성자가 현재 로그인한 사용자와 일치하는지 확인합니다.
        const post = await pool.query("SELECT * FROM posts WHERE post_id = $1", [id]);

        if (post.rows.length === 0) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        if (post.rows[0].user_id !== userId) {
            return res.status(403).json({ message: "게시글을 수정할 권한이 없습니다." });
        }

        // 4. 권한이 있다면, 게시글 내용을 업데이트합니다.
        const updatedPost = await pool.query(
            "UPDATE posts SET title = $1, content = $2, category = $3, location = $4, updated_at = CURRENT_TIMESTAMP WHERE post_id = $5 RETURNING *",
            [title, content, category, location, id]
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

export default router;