// routes/messages.js
// 1:1 쪽지 dm 기능

import express from "express";
import authMiddleware from "../middleware/auth.js";
import pool from "../db.js";

const router = express.Router();

// 1. 내가 받은 쪽지함 조회 (GET /api/messages/inbox)
router.get("/inbox", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const inbox = await pool.query(
            "SELECT dm.dm_id, dm.content, dm.read, dm.created_at, u.username AS sender FROM direct_messages dm JOIN users u ON dm.sender_id = u.user_id WHERE dm.receiver_id = $1 ORDER BY dm.created_at DESC",
            [userId]
        );
        res.json(inbox.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// 2. 특정 사용자와의 1:1 대화 내역 조회
router.get("/with/:otherUserId", authMiddleware, async (req, res) => {
    try {
        const myUserId = req.user.userId;
        const { otherUserId } = req.params;

        const conversation = await pool.query(
            `SELECT * FROM direct_messages 
             WHERE (sender_id = $1 AND receiver_id = $2) 
                OR (sender_id = $2 AND receiver_id = $1) 
             ORDER BY created_at ASC`,
            [myUserId, otherUserId]
        );


        res.json(conversation.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// 3. 나와 대화한 모든 사용자 목록 조회
router.get("/conversations", authMiddleware, async (req, res) => {
    try {
        const myUserId = req.user.userId;

        // 내가 쪽지를 보냈거나 나에게 쪽지를 보낸 모든 상대방의 ID와 이름을 중복 없이 가져옴.
        const conversations = await pool.query(
            `SELECT DISTINCT u.user_id, u.username
             FROM users u
             JOIN direct_messages dm ON u.user_id = dm.sender_id OR u.user_id = dm.receiver_id
             WHERE (dm.sender_id = $1 OR dm.receiver_id = $1) AND u.user_id != $1`,
            [myUserId]
        );

        res.json(conversations.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});
export default router;