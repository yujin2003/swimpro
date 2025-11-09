// routes/quizzes.js

import express from "express";
import pool from "../db.js";

const router = express.Router();

// 1. 퀴즈 시작 (프론트가 문제지를 받아가는 API)
// (GET /api/quiz/start)
router.get("/start", async (req, res) => {
    try {
        const quizSet = await pool.query(
            "SELECT quiz_id, question, options FROM quizzes ORDER BY RANDOM() LIMIT 5"
        );
        res.json({ quizzes: quizSet.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});


// 2. 퀴즈 결과 제출
// (POST /api/quiz/submit)
router.post("/submit", async (req, res) => {
    try {
        // 1. 프론트엔드로부터 사용자의 답안지 배열 받음
        const { answers } = req.body;

        if (!answers || answers.length === 0) {
            return res.status(400).json({ message: "제출된 답안지가 없습니다." });
        }

        // 2. 답안지에 있는 quizId 추출
        const quizIds = answers.map(a => a.quizId);

        // 3. DB에서 정답, 해설 가져옴
        const solutions = await pool.query(
            "SELECT quiz_id, correct_answer, explanation FROM quizzes WHERE quiz_id = ANY($1)",
            [quizIds]
        );

        // 4. 정답맵
        const solutionMap = new Map();
        solutions.rows.forEach(sol => {
            solutionMap.set(sol.quiz_id, {
                correctAnswer: sol.correct_answer,
                explanation: sol.explanation
            });
        });

        // 5. 답안지 채점
        let correctCount = 0;
        const results = answers.map(userAnswer => {
            const solution = solutionMap.get(userAnswer.quizId);
            let isCorrect = false;

            if (solution && solution.correctAnswer === userAnswer.selectedOption) {
                correctCount++;
                isCorrect = true;
            }

            return {
                quizId: userAnswer.quizId,
                selectedOption: userAnswer.selectedOption,
                isCorrect: isCorrect,
                correctAnswer: solution ? solution.correctAnswer : "N/A",
                explanation: solution ? solution.explanation : "N/A"
            };
        });

        // 정답률 계산
        const correctRate = parseFloat(((correctCount / answers.length) * 100).toFixed(1));

        // 6. 등급 메시지 설정
        let rank = "";
        if (correctCount >= 4) {
            rank = "상 (Excellent!)";
        } else if (correctCount >= 3) {
            rank = "중 (Good Job!)";
        } else {
            rank = "하 (Try Again!)";
        }

        res.json({
            title: "퀴즈 완료!",
            totalQuestions: answers.length,
            correctCount: correctCount,
            scoreMessage: `점수: ${correctCount} / ${answers.length}`,
            correctRate: correctRate,
            rank: rank,
            results: results
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

export default router;