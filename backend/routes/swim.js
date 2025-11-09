// routes/swim.js

import express from "express";
import pool from "../db.js";

const router = express.Router();

//수영 종목 정보 조회
// GET /api/swim-types
router.get("/", async (req, res) => {
    try {
        const dbResult = await pool.query("SELECT * FROM swim_info");
    
        const swimData = {};
        dbResult.rows.forEach(row => {
            // "freestyle"을 키(key)로 사용
            swimData[row.stroke_name] = row;
        });

        res.json(swimData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// 2. 특정 종목 정보만 반환
// GET /api/swim-types/freestyle 예시..
router.get("/:strokeName", async (req, res) => {
    try {
        const { strokeName } = req.params; // 예: "freestyle"
        const dbResult = await pool.query(
            "SELECT * FROM swim_info WHERE stroke_name = $1",
            [strokeName]
        );
        
        if (dbResult.rows.length > 0) {
            res.json(dbResult.rows[0]);
        } else {
            res.status(404).json({ message: "해당 수영 종목을 찾을 수 없습니다." });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

export default router;