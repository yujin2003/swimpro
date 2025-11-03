// db.js

// 이전 방식 대신, 'pg' 패키지에서 'Pool' 클래스만
// "이름으로" 직접 가져옵니다. (Named Import)
import { Pool } from "pg";

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "postgres", // (본인 DB 이름 확인)
    password: "123456", // (본인 DB 비밀번호 확인)
    port: 5432,
    client_encoding: 'UTF8',
});

export default pool;