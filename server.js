// server.js
import express from "express";
import dotenv from "dotenv";

import http from "http";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import swimRoutes from "./routes/swim.js";
import routineRoutes from "./routes/routines.js";
import postRoutes from "./routes/posts.js";
import quizRoutes from "./routes/quiz.js";
import logRoutes from "./routes/logs.js";
import productRoutes from "./routes/products.js";
import pool from "./db.js";
import chatRoutes from "./routes/chat.js";
import validateRoutes from "./routes/validate.js";

dotenv.config();
const app = express();
const chatRooms = new Map(); //채팅방 관리를 위한 Map 객체 생성

app.use(express.json());
app.use(cors());

// 라우트 연결
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/swim-types", swimRoutes);
app.use("/api/routines", routineRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/logs", logRoutes);
app.use("/api", productRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/validate", validateRoutes)

const PORT = process.env.PORT || 5000;

// ★★★ 2. Express 앱으로 HTTP 서버 생성
const server = http.createServer(app);

// ★★★ 3. HTTP 서버에 WebSocket 서버 연결
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
    console.log("✅ 새로운 클라이언트가 접속했습니다.");

    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message);

            // 1. 처음 받는 메시지가 인증 토큰일 경우
            if (data.type === 'auth') {
                const token = data.token;
                if (!token) {
                    ws.send(JSON.stringify({ error: "인증 토큰이 필요합니다." }));
                    return;
                }
                
                // 토큰 검증
                jwt.verify(data.token, process.env.JWT_SECRET, (err, decoded) => {
                    if (err) return ws.send(JSON.stringify({ error: "유효하지 않은 토큰입니다." }));
                    // ★★★ 검증 성공 시, 웹소켓 연결 객체에 사용자 ID를 저장합니다.
                    ws.userId = decoded.userId; 
                    console.log(`🔒 클라이언트 인증 완료 (UserID: ${ws.userId})`);
                    ws.send(JSON.stringify({ message: "인증에 성공했습니다." }));
                });

             // ★★★ 2. 채팅방 참가 로직 추가 ★★★
            } else if (data.type === 'join') {
                if (!ws.userId) return ws.send(JSON.stringify({ error: "인증이 필요합니다." }));

                const roomId = `post-${data.postId}`; // 채팅방 ID (예: "post-123")
                ws.roomId = roomId; // 웹소켓 객체에 현재 방 ID 저장

                // 해당 채팅방이 없으면 새로 생성
                if (!chatRooms.has(roomId)) {
                    chatRooms.set(roomId, new Set());
                }
                // 해당 채팅방에 현재 클라이언트 추가
                chatRooms.get(roomId).add(ws);
                console.log(`🚪 UserID ${ws.userId}가 ${roomId} 방에 참가했습니다.`);
                ws.send(JSON.stringify({ message: `${roomId} 방에 참가했습니다.` }));

            // ★★★ 3. 채팅 메시지 로직 수정 ★★★
            } else if (data.type === 'chat') {
                if (!ws.userId || !ws.roomId) {
                    return ws.send(JSON.stringify({ error: "인증 및 채팅방 참가가 필요합니다." }));
                }

                const postId = ws.roomId.split('-')[1]; // "post-123"에서 "123"을 추출
                const senderId = ws.userId;
                const content = data.text;

                // 1. 받은 메시지를 DB에 저장합니다.
                pool.query(
                    "INSERT INTO messages (post_id, sender_id, content) VALUES ($1, $2, $3)",
                    [postId, senderId, content]
                );
                
                const messageToSend = {
                    senderId: senderId,
                    text: content,
                    // username, createdAt 등 추가 정보를 보내주면 프론트에서 더 유용합니다.
                };

                // 같은 방에 있는 클라이언트들에게만 메시지 전송
                const room = chatRooms.get(ws.roomId);
                if (room) {
                    room.forEach((client) => {
                        if (client.readyState === ws.OPEN) {
                            client.send(JSON.stringify(messageToSend));
                        }
                    });
                }
            }
        } catch (error) {
            console.error('메시지 처리 중 에러:', error);
        }
    });

    ws.on("close", () => {
        // ★★★ 4. 접속 종료 시, 해당 클라이언트를 채팅방에서 제거 ★★★
        if (ws.roomId && chatRooms.has(ws.roomId)) {
            chatRooms.get(ws.roomId).delete(ws);
            console.log(`🚪 UserID ${ws.userId}가 ${ws.roomId} 방에서 나갔습니다.`);
        }
        console.log(`❌ 클라이언트 접속이 끊겼습니다 (UserID: ${ws.userId || '인증 안됨'})`);
    });
});

server.listen(PORT, () => console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다. (WebSocket 포함)`));