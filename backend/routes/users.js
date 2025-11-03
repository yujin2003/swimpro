// routes/users.js

import express from "express";
import authMiddleware from "../middleware/auth.js"; // ★★★ 방금 만든 경비원(미들웨어)을 가져옵니다. ★★★
import pool from "../db.js";

const router = express.Router();

// '/profile' 경로는 authMiddleware라는 경비원이 먼저 검사합니다.
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        // 경비원(미들웨어)이 검증 후 req.user에 저장해준 정보로 DB에서 사용자 정보를 찾습니다.
        const user = await pool.query("SELECT user_id, email, username, created_at FROM users WHERE user_id = $1", [
            req.user.userId
        ]);

        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

export default router;