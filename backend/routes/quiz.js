// routes/quizzes.js

import express from "express";
import pool from "../db.js";

const router = express.Router();

// 1. 퀴즈 세트 시작 API (프론트가 문제지를 받아가는 API)
//    (GET /api/quiz/start)
//    ("새로운 퀴즈 생성" 버튼도 이 API를 호출하면 됩니다)
router.get("/start", async (req, res) => {
    try {
        // 이미지처럼 6문제를 랜덤으로 가져옵니다
        // (보안을 위해 정답은 제외하고 보냅니다)
        const quizSet = await pool.query(
            "SELECT quiz_id, question, options FROM quizzes ORDER BY RANDOM() LIMIT 5"
        );
        res.json({ quizzes: quizSet.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});


// 2. 퀴즈 결과 제출 API (마지막에 채점하는 API)
//    (POST /api/quiz/submit)
router.post("/submit", async (req, res) => {
    try {
        // 1. 프론트엔드로부터 사용자의 답안지 배열을 받습니다.
        const { answers } = req.body; // 예: [{ quizId: 1, selectedOption: "44초" }, ...]

        if (!answers || answers.length === 0) {
            return res.status(400).json({ message: "제출된 답안지가 없습니다." });
        }

        // 2. 답안지에 있는 모든 quizId를 추출합니다.
        const quizIds = answers.map(a => a.quizId);

        // 3. DB에서 해당 퀴즈들의 "정답"과 "해설"만 가져옵니다.
        const solutions = await pool.query(
            "SELECT quiz_id, correct_answer, explanation FROM quizzes WHERE quiz_id = ANY($1)",
            [quizIds]
        );

        // 4. 정답을 빠르게 찾기 위한 '정답 맵'을 만듭니다.
        const solutionMap = new Map();
        solutions.rows.forEach(sol => {
            solutionMap.set(sol.quiz_id, {
                correctAnswer: sol.correct_answer,
                explanation: sol.explanation
            });
        });

        // 5. 사용자의 답안지를 채점합니다.
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
        // ★★★ 6. 최종 채점 결과를 이미지 형식에 맞게 수정합니다. ★★★

        // 6-1. 정답률 계산 (소수점 첫째 자리까지)
        const correctRate = parseFloat(((correctCount / answers.length) * 100).toFixed(1));

        // 6-2. 등급 메시지 설정
        let rank = "";
        if (correctCount >= 4) { // 5문제 기준, 4개 이상 '상'
            rank = "상 (Excellent!)";
        } else if (correctCount >= 3) { // 3개 '중'
            rank = "중 (Good Job!)"; // 이미지처럼 "Job!" 추가
        } else { // 그 외 '하'
            rank = "하 (Try Again!)";
        }

        // 6-3. 최종 응답 JSON 구성
        res.json({
            title: "퀴즈 완료!", // 이미지 참고 제목
            totalQuestions: answers.length,
            correctCount: correctCount,
            scoreMessage: `점수: ${correctCount} / ${answers.length}`, // 이미지 형식
            correctRate: correctRate, // 정답률 추가
            rank: rank, // 등급 메시지
            results: results // 개별 채점 결과 (이전과 동일)
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

export default router;