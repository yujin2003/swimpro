// backend/db.js

import { Pool } from "pg";
import dotenv from "dotenv";

// .env 파일 로딩 (server.js가 아니라 여기서도 해주는 게 안전함)
dotenv.config();

let pool;

if (process.env.DATABASE_URL) {
  // --- 1. 배포 환경 (Render) ---
  // Render가 제공하는 DATABASE_URL을 사용합니다.
  console.log("Connecting to Render DB via DATABASE_URL...");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Render DB는 SSL(보안 연결)이 필요할 수 있습니다.
    ssl: {
      rejectUnauthorized: false 
    }
  });
} else {
  // --- 2. 로컬 개발 환경 ---
  // 로컬 .env 파일의 개별 변수를 사용합니다.
  console.log("Connecting to Local DB...");
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    port: process.env.DB_PORT || 5432,
    client_encoding: 'UTF8'
  });
}

export default pool;