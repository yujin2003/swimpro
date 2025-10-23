// middleware/auth.js

import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    // 1. 요청 헤더에서 'Authorization' 값을 찾습니다.
    const authHeader = req.headers['authorization'];

    // 2. 헤더가 없으면 에러를 보냅니다.
    if (!authHeader) {
        return res.status(403).send("인증 토큰이 필요합니다.");
    }

    // 3. 토큰은 보통 'Bearer <토큰값>' 형태로 오므로, 'Bearer ' 부분을 잘라내고 실제 토큰 값만 추출합니다.
    const token = authHeader.split(' ')[1];

    // 4. 토큰이 없으면 에러를 보냅니다.
    if (!token) {
        return res.status(403).send("토큰 형식이 올바르지 않습니다.");
    }

    try {
        // 5. .env 파일의 비밀키로 토큰이 유효한지 검사합니다.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // 검증된 사용자 정보를 요청 객체(req)에 저장합니다.
    } catch (err) {
        return res.status(401).send("유효하지 않은 토큰입니다.");
    }

    // 6. 모든 검사를 통과했으면, 다음 단계(실제 API 로직)로 넘어갑니다.
    return next();
};

export default authMiddleware;