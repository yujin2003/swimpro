// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import pool from "./db.js";
import http from "http";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

// --- 라우트 파일 import ---
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import swimRoutes from "./routes/swim.js";
import routineRoutes from "./routes/routines.js";
import postRoutes from "./routes/posts.js";
import quizRoutes from "./routes/quiz.js";
import logRoutes from "./routes/logs.js";
import productRoutes from "./routes/products.js";
import validateRoutes from "./routes/validate.js";
import messageRoutes from "./routes/messages.js";
import mainRoutes from "./routes/main.js";

//dotenv.config(); 최상단으로 올려둠 gpt api 떄문에..
const app = express();

app.use(cors());
app.use(express.json());

// --- 라우트 연결 ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/swim-types", swimRoutes);
app.use("/api/routines", routineRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/logs", logRoutes);
app.use("/api", productRoutes);
app.use("/api/validate", validateRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api", mainRoutes);

const PORT = process.env.PORT || 5000;

//HTTP 서버, WebSocket 서버 연결
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const userConnections = new Map();

wss.on("connection", (ws) => {
    console.log("✅ 새로운 클라이언트가 접속했습니다.");

    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message);

            // 1. [인증] 클라이언트가 처음 접속 시 토큰
            if (data.type === 'auth') {
                jwt.verify(data.token, process.env.JWT_SECRET, (err, decoded) => {
                    if (err) return ws.send(JSON.stringify({ error: "유효하지 않은 토큰입니다." }));
                    
                    ws.userId = decoded.userId; // 웹소켓 연결에 user_id 저장
                    userConnections.set(ws.userId, ws); // Map에 (user_id, ws) 저장
                    
                    console.log(`🔒 클라이언트 인증 완료 (UserID: ${ws.userId})`);
                    ws.send(JSON.stringify({ message: "인증에 성공했습니다." }));
                });

            // 2. [1:1 DM 전송] 클라이언트가 1:1 메시지를 보냄
            } else if (data.type === 'dm') {
                console.log("DM 요청 수신:", data); // 요청 데이터 확인
                if (!ws.userId) {
                    console.error("인증되지 않은 사용자가 DM 시도");
                    return ws.send(JSON.stringify({ error: "인증이 필요합니다." }));
                }

                const senderId = ws.userId;
                const { receiverId, content } = data;

                // DB로 보낼 값 확인
                console.log(`DB 저장 시도: senderId=${senderId}, receiverId=${receiverId}, content=${content}`);

                // 2-1 메시지 DB에 저장 (히스토리용)
                const newDM = await pool.query(
                    "INSERT INTO direct_messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *",
                    [senderId, receiverId, content]
                );
                
                console.log("DB 저장 성공:", newDM.rows[0]);

                const messageToSend = newDM.rows[0];

                // 2-2. (실시간) 받는 사람이 현재 접속 중인지
                if (userConnections.has(receiverId)) {
                    const receiverWs = userConnections.get(receiverId);
                    // 받는 사람에게 새 메시지 실시간 전송
                    receiverWs.send(JSON.stringify({ type: "new_dm", message: messageToSend }));
                }

                // 2-3. (확인용) 보낸 사람(sender)에게도 메시지 전송 (내가 보낸 메시지 화면에 띄우기용)
                ws.send(JSON.stringify({ type: "dm_sent", message: messageToSend }));
            }
        } catch (error) {
            console.error('메시지 처리 중 에러:', error);
        }
    });

    ws.on("close", () => {
        // 접속이 끊기면 Map에서 해당 사용자 제거
        if (ws.userId) {
            userConnections.delete(ws.userId);
        }
        console.log(`❌ 클라이언트 접속이 끊겼습니다 (UserID: ${ws.userId || '인증 안됨'})`);
    });
});

// ★ 5. app.listen 대신 server.listen으로 변경
server.listen(PORT, () => console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다. (WebSocket 1:1 DM 포함)`));