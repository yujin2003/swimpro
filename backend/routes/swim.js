// routes/swim.js

import express from "express";
import pool from "../db.js";

const router = express.Router();

// 1. 전체 수영 종목 목록 조회 API
// GET /api/swim-types
router.get("/", async (req, res) => {
    try {
        const allSwimTypes = await pool.query("SELECT name, muscle_groups, cautions, animation_url FROM swim_types");
        res.json({ types: allSwimTypes.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// 2. 특정 종목 상세 정보 조회 API
// GET /api/swim-types/:name
router.get("/:name", async (req, res) => {
    try {
        const { name } = req.params; // URL 경로에서 :name 값을 가져옴
        const swimType = await pool.query("SELECT * FROM swim_types WHERE name = $1", [name]);

        if (swimType.rows.length === 0) {
            return res.status(404).json({ message: "해당 종목을 찾을 수 없습니다." });
        }

        res.json(swimType.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

export default router;