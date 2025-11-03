// routes/auth.js

import express from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";
import jwt from "jsonwebtoken"; // ★★★ jsonwebtoken 라이브러리 가져오기 ★★★

const router = express.Router();

// 기존 회원가입(Signup) 라우트
router.post("/signup", async (req, res) => {
    try {
        const { email, password, username } = req.body; 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            "INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING *",
            [email, hashedPassword, username]
        );

        res.status(201).json(newUser.rows[0]);

    } catch (err) {
        console.error("DB 저장 중 에러 발생:", err.message);
        res.status(500).send("서버 에러가 발생했습니다.");
    }
});


// ★★★ 새로 추가된 로그인(Login) 라우트 ★★★
router.post("/login", async (req, res) => {
    try {
        // 1. 사용자가 보낸 이메일과 비밀번호를 가져옵니다.
        const { email, password } = req.body;

        // 2. DB에서 해당 이메일을 가진 사용자를 찾습니다.
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        // 3. 사용자가 존재하지 않으면 에러를 보냅니다.
        if (user.rows.length === 0) {
            return res.status(401).send("사용자 정보가 올바르지 않습니다.");
        }

        // 4. 사용자가 보낸 비밀번호와 DB의 암호화된 비밀번호를 비교합니다.
        const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);
        
        // 5. 비밀번호가 일치하지 않으면 에러를 보냅니다.
        if (!isPasswordValid) {
            return res.status(401).send("사용자 정보가 올바르지 않습니다.");
        }

        // 6. 비밀번호가 일치하면, JWT 토큰을 생성합니다.
        const token = jwt.sign(
            { userId: user.rows[0].user_id }, // 토큰에 담을 정보 (보통 user_id)
            process.env.JWT_SECRET,            // .env 파일에서 가져온 비밀키
            { expiresIn: "1h" }               // 토큰 유효기간 (예: 1시간)
        );

        // 7. 생성된 토큰을 사용자에게 보냅니다.
        res.json({ token });

    } catch (err) {
        console.error("로그인 중 에러 발생:", err.message);
        res.status(500).send("서버 에러가 발생했습니다.");
    }
});

export default router;