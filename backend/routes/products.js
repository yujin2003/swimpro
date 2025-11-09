// routes/products.js
//제품 추천(카테고리/프러덕스-제품)

import express from "express";
import pool from "../db.js";

const router = express.Router();

// 1. 전체 카테고리 목록 조회
// GET /api/categories

// 1. 전체 카테고리 목록 조회 API (기존과 동일)
router.get("/categories", async (req, res) => {
    try {
        const allCategories = await pool.query("SELECT * FROM categories ORDER BY category_id ASC");
        res.json(allCategories.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// ★★★ 2. 제품 목록 조회 API (image 필드 다시 추가) ★★★
router.get("/products", async (req, res) => {
    try {
        const { categoryId } = req.query;
        
        // (★ 수정된 부분) image 컬럼 SELECT에 다시 추가
        let query = `
            SELECT 
                product_id AS id, 
                name, description, purchase_url AS link, 
                shortDescription, pros, cons, category_id,
                image 
            FROM products
        `;
        const params = [];

        if (categoryId) {
            query += " WHERE category_id = $1";
            params.push(categoryId);
        }

        query += " ORDER BY product_id ASC";

        const allProducts = await pool.query(query, params);
        res.json(allProducts.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

// ★★★ 3. 특정 제품 상세 정보 조회 API (image 필드 다시 추가) ★★★
router.get("/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        // (★ 수정된 부분) image 컬럼 SELECT에 다시 추가
        const product = await pool.query(
            `SELECT 
                product_id AS id, 
                name, description, purchase_url AS link, 
                shortDescription, pros, cons, category_id,
                image
             FROM products 
             WHERE product_id = $1`,
            [id]
        );

        if (product.rows.length === 0) {
            return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
        }
        
        res.json(product.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("서버 에러");
    }
});

export default router;