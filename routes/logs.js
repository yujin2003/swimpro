// routes/logs.js
//캘린더 운동 기록

import express from "express";
import authMiddleware from "../middleware/auth.js";
import pool from "../db.js";

const router = express.Router();

// 1. 특정 날짜의 기록 생성하기 (Create)
// POST /api/logs
router.post("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { date, mood, thoughts } = req.body;

        const newLog = await pool.query(
            "INSERT INTO logs (user_id, log_date, mood, thoughts) VALUES ($1, $2, $3, $4) RETURNING *",
            [userId, date, mood, thoughts]
        );

        res.status(201).json(newLog.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// 2. 나의 모든 기록 조회하기 (Read)
// GET /api/logs
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userLogs = await pool.query(
            "SELECT * FROM logs WHERE user_id = $1 ORDER BY log_date DESC",
            [userId]
        );
        res.json(userLogs.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// ★★★ 3. 특정 기록 수정하기 (Update) - 이 부분을 추가합니다 ★★★
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params; // 수정할 기록의 ID
        const userId = req.user.userId; // 현재 로그인한 사용자 ID
        const { mood, thoughts } = req.body; // 수정할 내용

        // 권한 확인: 해당 기록이 현재 로그인한 사용자의 것인지 확인
        const log = await pool.query("SELECT * FROM logs WHERE log_id = $1", [id]);
        if (log.rows.length === 0) {
            return res.status(404).json({ message: "기록을 찾을 수 없습니다." });
        }
        if (log.rows[0].user_id !== userId) {
            return res.status(403).json({ message: "기록을 수정할 권한이 없습니다." });
        }

        // 기록 업데이트
        const updatedLog = await pool.query(
            "UPDATE logs SET mood = $1, thoughts = $2 WHERE log_id = $3 RETURNING *",
            [mood, thoughts, id]
        );

        res.json(updatedLog.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// ★★★ 4. 특정 기록 삭제하기 (Delete) - 이 부분을 추가합니다 ★★★
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params; // 삭제할 기록의 ID
        const userId = req.user.userId; // 현재 로그인한 사용자 ID

        // 권한 확인: 해당 기록이 현재 로그인한 사용자의 것인지 확인
        const log = await pool.query("SELECT * FROM logs WHERE log_id = $1", [id]);
        if (log.rows.length === 0) {
            return res.status(404).json({ message: "기록을 찾을 수 없습니다." });
        }
        if (log.rows[0].user_id !== userId) {
            return res.status(403).json({ message: "기록을 삭제할 권한이 없습니다." });
        }

        // 기록 삭제
        await pool.query("DELETE FROM logs WHERE log_id = $1", [id]);

        res.json({ message: "기록이 성공적으로 삭제되었습니다." });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

export default router;