// routes/validate.js
// 아이디 및 비밀번호 유효성 검사-아이디 4자 이상, 비번 8자 이상, 숫자 문자 포함 여부

import express from "express";
import pool from "../db.js";

const router = express.Router();

// 명세서: POST /api/validate/fields
router.post("/fields", (req, res) => {
    try {
        const { username, password } = req.body;

        let usernameValid = true;
        let passwordStrength = "weak";
        const errors = [];

        // 1. 아이디(username) 유효성 검사 (예: 4자 이상)
        if (!username || username.length < 4) {
            usernameValid = false;
            errors.push("아이디는 4자 이상이어야 합니다.");
        }

        // 2. 비밀번호(password) 유효성 검사 (예: 8자 이상)
        if (!password || password.length < 8) {
            passwordStrength = "too_short";
            errors.push("비밀번호는 8자 이상이어야 합니다.");
        } else {
            // 간단한 정규식으로 숫자, 문자 포함 여부 확인
            const hasLetter = /[a-zA-Z]/.test(password);
            const hasNumber = /[0-9]/.test(password);

            if (hasLetter && hasNumber && password.length >= 10) {
                passwordStrength = "strong";
            } else if (hasLetter || hasNumber) {
                passwordStrength = "medium";
            }
        }
        
        res.json({
            usernameValid: usernameValid,
            passwordStrength: passwordStrength,
            errors: errors
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// 이메일 유효성 검사도 이쪽으로 옮겨와도 좋습니다.
// ★★★ 실시간 이메일 중복 확인 API - 이 부분을 추가합니다 ★★★
router.post("/email", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "이메일을 입력해주세요." });
        }

        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (user.rows.length > 0) {
            // 이미 사용자가 존재함 (중복)
            res.json({ isDuplicate: true });
        } else {
            // 사용 가능
            res.json({ isDuplicate: false });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

export default router;