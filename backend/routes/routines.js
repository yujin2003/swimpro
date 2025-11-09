// routes/routines.js

import express from "express";
import authMiddleware from "../middleware/auth.js";
import pool from "../db.js";

const router = express.Router();

// POST /api/routines/recommend
// authMiddleware 추가, 인증된 사용자만 접근
router.post("/recommend", authMiddleware, async (req, res) => {
    try {
        // 1. 프론트에서 모든 입력값을 받습니다.
        const { height, age, weight, gender, skill, pool: poolValue } = req.body;
        const userId = req.user.userId;

        // 2. 받은 값을 DB에서 검색할 수 있도록 변환합니다.
        let swimAbility;
        if (skill === 'beginner') swimAbility = '초급';
        else if (skill === 'intermediate') swimAbility = '중급';
        else if (skill === 'advanced') swimAbility = '고급';
        else swimAbility = '중급';

        const poolLength = parseInt(poolValue, 10);
        const userAge = parseInt(age, 10);
        const userGender = gender || '모두';
        const userHeight = parseInt(height, 10);
        const userWeight = parseInt(weight, 10);

        // 3. (★ 핵심 변경) 사용자의 모든 신체 조건을 반영하여 DB에서 루틴을 검색합니다.
        const routineTemplateResult = await pool.query(
            `SELECT title, description, steps 
             FROM routine_templates 
             WHERE swim_ability = $1 
               AND pool_length = $2
               AND $3 >= min_age AND $3 <= max_age
               AND (gender = $4 OR gender = '모두')
               AND $5 >= min_height AND $5 <= max_height
               AND $6 >= min_weight AND $6 <= max_weight
             ORDER BY RANDOM() 
             LIMIT 1`,
            [swimAbility, poolLength, userAge, userGender, userHeight, userWeight]
        );

        let routineTitle, routineDescription, routineSteps;

        if (routineTemplateResult.rows.length > 0) {
            // 4-A. DB에서 조건에 100% 맞는 템플릿을 찾은 경우
            const template = routineTemplateResult.rows[0];
            routineTitle = template.title;
            routineDescription = template.description;
            routineSteps = template.steps;
        } else {
            // 4-B. (1차 폴백) 조건에 100% 맞는 템플릿이 없는 경우 (예: 키/몸무게 제외)
            //      -> '능력'과 '풀 길이'만으로 다시 검색
            const fallbackResult = await pool.query(
                `SELECT title, description, steps 
                 FROM routine_templates 
                 WHERE swim_ability = $1 AND pool_length = $2 
                 ORDER BY RANDOM() LIMIT 1`,
                 [swimAbility, poolLength]
            );
            
            if (fallbackResult.rows.length > 0) {
                const template = fallbackResult.rows[0];
                routineTitle = template.title;
                routineDescription = template.description;
                routineSteps = template.steps;
            } else {
                // 4-C. (최종 폴백) 정말 아무것도 없을 때
                routineTitle = "기본 루틴";
                routineDescription = "기본 루틴입니다.";
                routineSteps = ["자유형 100m"];
            }
        }
        
        // 5. (기존 로직) 찾은 루틴을 'routines' 테이블에 저장
        const newRoutine = await pool.query(
            "INSERT INTO routines (user_id, title, steps, description) VALUES ($1, $2, $3, $4) RETURNING *",
            [userId, routineTitle, routineSteps, routineDescription]
        );
        
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