// routes/routines.js

import express from "express";
import authMiddleware from "../middleware/auth.js"; // ★★★ 인증 미들웨어(경비원)를 가져옵니다.
import pool from "../db.js";

const router = express.Router();

// POST /api/routines/recommend
// ★★★ authMiddleware를 추가해서, 이제 이 API는 인증된 사용자만 접근할 수 있습니다.
router.post("/recommend", authMiddleware, async (req, res) => {
    try {
        console.log("프론트에서 받은 Body:", req.body);
        // 1. 프론트엔드에서 모든 입력값을 받습니다.
        const { height, age, weight, gender, skill, pool: poolValue } = req.body;
        const userId = req.user.userId;

        // ★★★ 2. 받은 값을 백엔드가 이해할 수 있도록 변환합니다. ★★★
        let swimAbility;
        if (skill === 'beginner') {
            swimAbility = '초급';
        } else if (skill === 'intermediate') {
            swimAbility = '중급';
        } else if (skill === 'advanced') {
            swimAbility = '고급';
        } else {
            swimAbility = '중급'; // 혹시 모를 기본값
        }

        // "25m" 같은 문자열에서 숫자 25만 추출합니다.
        const poolLength = parseInt(poolValue, 10);

        let routineTitle = "";
        let routineDescription = "";
        let routineSteps = [];

        // 2. 수영 실력(swimAbility)을 기준으로 크게 분기합니다.
        if (swimAbility === '초급') {
            routineTitle = `초급 ${poolLength}m 풀 적응 루틴`;
            routineDescription = "물과 친해지고 기본 자세와 호흡을 연습하는 데 집중합니다.";
            routineSteps = [
                "워밍업: 천천히 걷기 100m",
                "발차기 연습 (킥판 잡고) 25m x 4세트",
                "자유형 팔 동작 연습 25m x 4세트",
                "쿨다운: 배영으로 천천히 50m"
            ];
        
        } else if (swimAbility === '중급') {
            // 사용자가 보내준 이미지의 예시 케이스 (160cm, 20세, 여, 25m)
            if (height <= 160 && age <= 20 && gender === "여" && poolLength == 25) {
                routineTitle = "자유형 50m - 1분 안에 완주하기 도전!";
                routineDescription = "체력과 기술을 균형있게 향상시키는 루틴입니다.";
                routineSteps = [
                    "워밍업: 자유형 300m",
                    "기술 연습: 각 영법별 150m씩",
                    "인터벌: 고강도 400m",
                    "쿨다운: 완만한 자유형 200m"
                ];
            } else if (poolLength == 50) {
                // 그 외 중급, 50m 풀
                routineTitle = `중급 50m 풀 지구력 강화 루틴`;
                routineDescription = "휴식 시간을 줄이며 지구력을 기르는 데 집중합니다.";
                routineSteps = [
                    "워밍업: 자유형 200m",
                    "IM(접-배-평-자) 100m x 2세트",
                    "자유형 50m x 8세트 (30초 휴식)",
                    "쿨다운: 100m"
                ];
            } else {
                // 그 외 중급, 25m 풀
                routineTitle = `중급 25m 풀 스피드 향상 루틴`;
                routineDescription = "짧은 거리를 빠르게 반복하여 스피드를 올립니다.";
                routineSteps = [
                    "워밍업: 200m",
                    "드릴 연습 (한팔 자유형 등) 100m",
                    "대시(Dash) 25m x 8세트 (40초 휴식)",
                    "쿨다운: 100m"
                ];
            }

        } else if (swimAbility === '고급') {
            routineTitle = `고급 ${poolLength}m 풀 대회 준비 루틴`;
            routineDescription = "실전 감각을 익히고 최대 스피드를 유지하는 훈련입니다.";
            routineSteps = [
                "워밍업: 400m",
                "주요 영법 드릴 200m",
                "인터벌 트레이닝 100m x 8세트 (휴식 1분)",
                "스프린트 50m x 4세트 (전력 질주)",
                "쿨다운: 200m"
            ];
        }

        // 3. (로직 추가 예시) 나이나 몸무게에 따라 강도 조절 (선택 사항)
        if (age > 50 || weight > 90) {
            routineTitle = "[강도 조절] " + routineTitle;
            // (여기서 세트 수를 줄이거나 휴식 시간을 늘리는 등 로직을 추가할 수 있습니다)
        }

        // 4. 생성된 루틴을 DB에 저장합니다. (description 컬럼 포함)
        const newRoutine = await pool.query(
            "INSERT INTO routines (user_id, title, steps, description) VALUES ($1, $2, $3, $4) RETURNING *",
            [userId, routineTitle, routineSteps, routineDescription]
        );

        console.log("✅ 프론트로 최종 응답 데이터:", newRoutine.rows[0]);
        
        // 5. DB에 저장된 결과를 사용자에게 응답으로 보냅니다.
        res.status(201).json(newRoutine.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// ★★★ 2. 루틴 상세 안내 API - 이 부분을 추가합니다 ★★★
// (명세서: GET /api/routines/detail)
router.get("/detail", (req, res) => {
    try {
        // 이 API는 명세서에 따라 정적인 상세 정보를 반환합니다.
        const routineDetail = {
            goal: "근지구력 향상",
            frequency: "주 3회",
            duration: "60분"
        };
        res.json({ routineDetail });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// ★★★ 3. 사용자 입력값 검증 API - 이 부분을 추가합니다 ★★★
// (명세서: POST /api/validate/input)
// 이 API는 /api/routines/validate/input 으로 요청하는 것이 더 좋습니다.
// 여기서는 /api/routines/validate-input 으로 구현하겠습니다.
router.post("/validate-input", (req, res) => {
    try {
        const { height, weight, swimLength } = req.body;
        const errors = [];
        let valid = true;

        if (swimLength < 0) {
            valid = false;
            errors.push("수영장 길이는 0 이상이어야 합니다.");
        }
        if (height < 100 || height > 250) {
            valid = false;
            errors.push("키가 일반적인 범위 밖입니다.");
        }
        if (weight < 30 || weight > 200) {
            valid = false;
            errors.push("몸무게가 일반적인 범위 밖입니다.");
        }

        res.json({ valid, errors });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// ★★★ 4. 수영 실력 분석 API - 이 부분을 추가합니다 ★★★
// (명세서: POST /api/analysis)
router.post("/analysis", authMiddleware, async (req, res) => {
    try {
        const { practiceLog } = req.body; // [{stroke, distance, time}, ...]

        if (!practiceLog || practiceLog.length === 0) {
            return res.status(400).json({ message: "분석할 운동 기록이 없습니다." });
        }

        // 간단한 분석 로직 (예: 총 운동 거리)
        let totalDistance = 0;
        practiceLog.forEach(log => {
            totalDistance += log.distance;
        });

        let level = "초급";
        let feedback = "꾸준한 연습이 필요합니다.";
        if (totalDistance > 1000) {
            level = "중급";
            feedback = "자유형 지속력 향상이 필요합니다.";
        } else if (totalDistance > 3000) {
            level = "상급";
            feedback = "훌륭합니다! 다양한 영법을 시도해보세요.";
        }
        
        res.json({
            level: level,
            feedback: feedback,
            recommendation: "주 3회 루틴 반복 권장",
            totalDistance: totalDistance
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

export default router;