import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PostsProvider } from "./store/posts.jsx";
import { UserProvider } from "./store/user.jsx";
import { API_CONFIG, checkAPIConnection } from "./config/environment.js";
import SwimmingLandingPage from "./SwimmingLandingPage";
import MentoringHome from "./pages/MentoringHome";
import PostDetail from "./pages/PostDetail";
import PostForm from "./pages/PostForm";
import PostEdit from "./pages/PostEdit";
import ChatPage from "./pages/ChatPage";
import SwimmingStrokeInfo from "./SwimmingStrokeInfo";
import MySwimRoutine from "./MySwimRoutine";
import RecordCalendar from "./pages/RecordCalendar";
import SwimmingSuppliesPage from "./pages/SwimmingSuppliesPage";
import SwimmingQuiz from "./pages/SwimmingQuiz";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import "./index.css"; // Tailwind 연결

// API 연결 상태 확인 컴포넌트
function APIStatusChecker() {
  useEffect(() => {
    const checkConnection = async () => {
      console.log('🔍 앱 시작 시 API 연결 확인:', API_CONFIG.BASE_URL);
      const isConnected = await checkAPIConnection();
      if (isConnected) {
        console.log('✅ API 서버 연결 성공:', API_CONFIG.BASE_URL);
      } else {
        console.error('❌ API 서버 연결 실패:', API_CONFIG.BASE_URL);
        console.error('⚠️ 다음을 확인하세요:');
        console.error('   1. ngrok 터널이 실행 중인가요? (ngrok http 3001)');
        console.error('   2. ngrok URL이 올바른가요?');
        console.error('   3. 백엔드 서버가 localhost:3001에서 실행 중인가요?');
      }
    };
    
    checkConnection();
  }, []);
  
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  // StrictMode 제거 - 여러 창에서 독립적 작동을 위해
  <BrowserRouter>
    <UserProvider>
      <PostsProvider>
        <APIStatusChecker />
        <Routes>
          <Route path="/" element={<SwimmingLandingPage />} />
          <Route path="/about" element={<SwimmingStrokeInfo />} />
          <Route path="/routine" element={<MySwimRoutine />} />
          <Route path="/record" element={<RecordCalendar />} />
          <Route path="/mentoring" element={<MentoringHome />} />
          <Route path="/mentoring/:id" element={<PostDetail />} />
          <Route path="/postform" element={<PostForm />} />
          <Route path="/postedit/:id" element={<PostEdit />} />
          <Route path="/postedit" element={<PostEdit />} />
          <Route path="/shopping" element={<SwimmingSuppliesPage />} />
          <Route path="/quiz" element={<SwimmingQuiz />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          {/* 404 처리 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PostsProvider>
    </UserProvider>
  </BrowserRouter>
);