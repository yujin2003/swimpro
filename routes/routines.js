// routes/routines.js

import express from "express";
import authMiddleware from "../middleware/auth.js"; // ★★★ 인증 미들웨어(경비원)를 가져옵니다.
import pool from "../db.js";

const router = express.Router();

// POST /api/routines/recommend
// ★★★ authMiddleware를 추가해서, 이제 이 API는 인증된 사용자만 접근할 수 있습니다.
router.post("/recommend", authMiddleware, async (req, res) => {
    try {
        // Postman의 Body를 통해 사용자 정보를 받습니다.
        const { swimAbility, preferredStroke } = req.body;
        // authMiddleware가 req.user에 넣어준 사용자 ID를 가져옵니다.
        const userId = req.user.userId;

        // 이전과 동일한 추천 로직
        let routineTitle = "";
        let routineSteps = [];

        if (swimAbility === "초급" || req.body.age < 15) { // age는 req.body에서 직접 접근
            routineTitle = `초급 ${preferredStroke} 익숙해지기 루틴`;
            routineSteps = [
                "준비 운동 (스트레칭) 10분",
                `${preferredStroke} 발차기 연습 50m * 4세트`,
                `${preferredStroke} 팔 동작 연습 50m * 4세트`,
                "정리 운동 5분"
            ];
        } else if (swimAbility === "중급" && preferredStroke === "자유형") {
            routineTitle = "중급 자유형 지구력 향상 루틴";
            routineSteps = [
                "준비 운동 10분",
                "자유형 50m × 10세트",
                "풀 부이(pull buoy) 잡고 팔 동작만 100m",
                "정리 운동 5분"
            ];
        } else {
            routineTitle = `상급 ${preferredStroke} 종합 훈련 루틴`;
            routineSteps = [
                "웜업 (모든 영법) 200m",
                `${preferredStroke} 인터벌 트레이닝 100m * 5세트`,
                "대시(Dash) 50m * 2세트",
                "쿨다운 100m"
            ];
        }

        // ★★★ 생성된 루틴을 DB에 저장합니다. ★★★
        const newRoutine = await pool.query(
            "INSERT INTO routines (user_id, title, steps) VALUES ($1, $2, $3) RETURNING *",
            [userId, routineTitle, routineSteps]
        );
        
        // DB에 저장된 결과를 사용자에게 응답으로 보냅니다.
        res.status(201).json(newRoutine.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

export default router;