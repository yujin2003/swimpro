import { Routes, Route, Navigate } from "react-router-dom";
import SwimmingLandingPage from "./SwimmingLandingPage";
import AboutPage from "./About";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import MySwimRoutine from "./MySwimRoutine";
import MentoringPage from "./MentoringPage";
import MentoringHome from "./pages/MentoringHome";
import PostForm from "./pages/PostForm";
import PostEdit from "./pages/PostEdit";
import PostDetail from "./pages/PostDetail";
import RecordCalendar from "./pages/RecordCalendar";
import SwimmingSuppliesPage from "./pages/SwimmingSuppliesPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SwimmingLandingPage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/routine" element={<MySwimRoutine />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/mentoring" element={<MentoringPage />} />
      <Route path="/mentoring-home" element={<MentoringHome />} />
      <Route path="/postform" element={<PostForm />} />
      <Route path="/postedit" element={<PostEdit />} />
      <Route path="/mentoring/:id" element={<PostDetail />} />
      <Route path="/record" element={<RecordCalendar />} />
      <Route path="/shopping" element={<SwimmingSuppliesPage />} />
      {/* 404 처리 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
