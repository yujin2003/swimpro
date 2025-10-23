// routes/chat.js
// 채팅 내역 조회 (저장)

import express from "express";
import authMiddleware from "../middleware/auth.js";
import pool from "../db.js";

const router = express.Router();

// 특정 채팅방의 이전 메시지 목록 조회
// GET /api/chat/:postId/messages
router.get("/:postId/messages", authMiddleware, async (req, res) => {
    try {
        const { postId } = req.params;

        const messages = await pool.query(
            "SELECT m.message_id, m.content, m.created_at, u.username as sender FROM messages m JOIN users u ON m.sender_id = u.user_id WHERE m.post_id = $1 ORDER BY m.created_at ASC",
            [postId]
        );

        res.json(messages.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

export default router;