// routes/logs.js 
// 캘린더 기록 

import express from "express";
import authMiddleware from "../middleware/auth.js";
import pool from "../db.js";

const router = express.Router();

// 1. (신규) 월별 기록 조회 API (캘린더 녹색 점 표시용)
// GET /api/logs/calendar?year=2025&month=11
router.get("/calendar", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({ message: "year와 month 쿼리 파라미터가 필요합니다." });
        }

        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const nextMonth = new Date(year, month, 1);
        const endDate = nextMonth.toISOString().split('T')[0];

        // 해당 월에 기록이 있는 '날짜'만 배열로 반환
        const logs = await pool.query(
            "SELECT log_date FROM logs WHERE user_id = $1 AND log_date >= $2 AND log_date < $3",
            [userId, startDate, endDate]
        );
        
        // 프론트가 hasRecord()에서 쓰기 편하게 날짜 문자열 배열로 변환
        const dateStrings = logs.rows.map(row => new Date(row.log_date).toDateString());
        res.json(dateStrings); // 예: ["Mon Nov 03 2025", "Wed Nov 05 2025"]

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// 2. (신규) 특정 날짜의 기록 조회 API (폼 채우기용)
// GET /api/logs/date/2025-11-03
router.get("/date/:date", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { date } = req.params; // YYYY-MM-DD 형식

        const log = await pool.query(
            "SELECT time, distance, best, note FROM logs WHERE user_id = $1 AND log_date = $2",
            [userId, date]
        );

        if (log.rows.length > 0) {
            res.json(log.rows[0]);
        } else {
            // 기록이 없으면 빈 객체를 보내 폼을 비움
            res.json({ time: "", distance: "", best: "", note: "" });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});


// 3. (수정) 기록 저장 API (UPSERT: 생성 또는 업데이트)
// POST /api/logs
router.post("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        // 프론트 폼에서 보낸 4가지 데이터 + 날짜
        const { date, time, distance, best, note } = req.body; 

        // 1단계에서 만든 UNIQUE 제약조건을 활용한 UPSERT
        const newLog = await pool.query(
            `INSERT INTO logs (user_id, log_date, time, distance, best, note) 
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (user_id, log_date) 
             DO UPDATE SET 
                time = $3, 
                distance = $4, 
                best = $5, 
                note = $6
             RETURNING *`,
            [userId, date, time, distance, best, note]
        );

        res.status(201).json(newLog.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// 4. (신규) 특정 날짜의 기록 삭제 API
// DELETE /api/logs/date/2025-11-03
router.delete("/date/:date", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { date } = req.params; // YYYY-MM-DD 형식

        await pool.query(
            "DELETE FROM logs WHERE user_id = $1 AND log_date = $2",
            [userId, date]
        );

        res.json({ message: "기록이 삭제되었습니다." });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});


export default router;