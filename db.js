// db.js

import pg from "pg";

const pool = new pg.Pool({
    user: "postgres", // 보통 기본값은 postgres 입니다.
    host: "localhost",
    database: "postgres", // DBeaver에서 접속하려는 데이터베이스 이름
    password: "123456", // ★★★ 중요! ★★★
    port: 5432,
});

export default pool;