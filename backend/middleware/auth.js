// middleware/auth.js

import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    // 1. 요청 헤더에서 'Authorization' 값을 찾습니다.
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    
    console.log('🔐 authMiddleware - 요청 경로:', req.path);
    console.log('🔐 authMiddleware - Authorization 헤더:', authHeader ? authHeader.substring(0, 20) + '...' : '없음');

    // 2. 헤더가 없으면 에러를 보냅니다.
    if (!authHeader) {
        console.error('❌ authMiddleware - 인증 토큰이 없습니다.');
        return res.status(403).json({ error: "인증 토큰이 필요합니다." });
    }

    // 3. 토큰은 보통 'Bearer <토큰값>' 형태로 오므로, 'Bearer ' 부분을 잘라내고 실제 토큰 값만 추출합니다.
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    // 4. 토큰이 없으면 에러를 보냅니다.
    if (!token) {
        console.error('❌ authMiddleware - 토큰 형식이 올바르지 않습니다.');
        return res.status(403).json({ error: "토큰 형식이 올바르지 않습니다." });
    }

    try {
        // 5. .env 파일의 비밀키로 토큰이 유효한지 검사합니다.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // 검증된 사용자 정보를 요청 객체(req)에 저장합니다.
        console.log('✅ authMiddleware - 토큰 검증 성공, userId:', decoded.userId || decoded.id);
    } catch (err) {
        console.error('❌ authMiddleware - 토큰 검증 실패:', err.message);
        return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
    }

    // 6. 모든 검사를 통과했으면, 다음 단계(실제 API 로직)로 넘어갑니다.
    return next();
};

export default authMiddleware;