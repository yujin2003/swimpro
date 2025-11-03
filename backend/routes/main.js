// routes/main.js

import express from "express";
const router = express.Router();

// 1. 메인 페이지 정보 API
// GET /api/main
router.get("/main", (req, res) => {
    try {
        const mainData = {
            title: "수영 플랫폼 메인",
            description: "수영 콘텐츠 소개",
            sections: ["측정", "루틴", "매칭", "수영복 추천", "상식 퀴즈"]
        };
        res.json(mainData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// 2. 폼/필터 옵션 제공 API (예: 게시판 카테고리, 지역)
// GET /api/options/category  또는 /api/options/region
router.get("/options/:type", (req, res) => {
    try {
        const { type } = req.params;
        let optionsData = {};

        if (type === 'category') {
            optionsData = {
                type: "category",
                values: ["자유형", "배영", "평영", "접영"]
            };
        } else if (type === 'region') {
            optionsData = {
                type: "region",
                values: ["서울", "부산", "대구", "인천", "광주", "대전", "울산"]
            };
        } else {
            return res.status(404).json({ message: "옵션 타입을 찾을 수 없습니다." });
        }

        res.json(optionsData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// ★★★ 3. 메인 소개 문구 및 배경 이미지 API - 이 부분을 추가합니다 ★★★
// (명세서: GET /api/main/image)
router.get("/main/image", (req, res) => {
    try {
        const imageData = {
            backgroundImageUrl: "https://example.com/images/main_bg.jpg",
            introText: "수영 실력을 높이세요!"
        };
        res.json(imageData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

export default router;