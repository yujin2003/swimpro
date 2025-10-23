// routes/quizzes.js

import express from "express";
import pool from "../db.js";

const router = express.Router();

// 1. 퀴즈 문제 가져오기 API
router.get("/", async (req, res) => {
    try {
        // DB에서 랜덤으로 퀴즈 1개를 가져옵니다. 정답(correct_answer)은 제외하고 보냅니다.
        const quiz = await pool.query(
            "SELECT quiz_id, question, options, explanation FROM quizzes ORDER BY RANDOM() LIMIT 1"
        );
        res.json(quiz.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// 2. 퀴즈 정답 제출 API
router.post("/answer", async (req, res) => {
    try {
        const { quizId, selectedOption } = req.body;

        // DB에서 해당 퀴즈의 정답을 찾아옵니다.
        const solution = await pool.query("SELECT correct_answer FROM quizzes WHERE quiz_id = $1", [quizId]);

        if (solution.rows.length === 0) {
            return res.status(404).json({ message: "퀴즈를 찾을 수 없습니다." });
        }

        const correctAnswer = solution.rows[0].correct_answer;
        const isCorrect = (selectedOption === correctAnswer);

        res.json({
            isCorrect: isCorrect,
            correctAnswer: correctAnswer
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

export default router;