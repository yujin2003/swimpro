// src/SignIn.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usersAPI, handleAPIError } from "./services/api.js";
import { useUser } from "./store/user.jsx";

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useUser();
  const [form, setForm] = useState({ id: "", pw: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    // 입력 시 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    if (!form.id.trim()) newErrors.id = "이메일을 입력해주세요";
    if (form.id.trim() && !form.id.includes('@')) newErrors.id = "올바른 이메일 형식을 입력해주세요";
    if (!form.pw.trim()) newErrors.pw = "비밀번호를 입력해주세요";
    if (form.pw.length < 6) newErrors.pw = "비밀번호는 6자 이상이어야 합니다";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await usersAPI.login({
        email: form.id,
        password: form.pw
      });
      
      console.log('로그인 응답:', response); // 디버깅용
      
      // 응답 유효성 검사
      if (!response || !response.token) {
        throw new Error('로그인 응답이 올바르지 않습니다.');
      }
      
      // 로그인 성공 시 사용자 컨텍스트에 저장
      const userData = response.user || {
        id: '1',
        username: form.id.split('@')[0], // 이메일에서 사용자명 추출
        email: form.id,
        name: `${form.id.split('@')[0]}(사용자)`,
        avatar: '🧑🏻‍🎨'
      };
      
      // 백엔드 응답에서 userId 추출 (response.userId 또는 response.user.id)
      const userId = response.userId || response.user?.id || response.user?.userId || userData.id;
      if (userId) {
        console.log('✅ 로그인 응답에서 userId 추출:', userId);
      }
      
      // userData에 userId 명시적으로 포함
      const userDataWithUserId = {
        ...userData,
        id: userId || userData.id,
        userId: userId || userData.id
      };
      
      login(userDataWithUserId, response.token);
      
      const userName = userData.name || userData.username || '사용자';
      alert(`로그인 성공!\n환영합니다, ${userName}님!`);
      navigate('/'); // 메인 페이지로 이동
    } catch (error) {
      console.error('로그인 실패:', error);
      const errorMessage = handleAPIError(error);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* 배경 */}
      <img
        src="/see.png"
        alt="ocean"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-indigo-900/30 mix-blend-multiply" />

      {/* 카드 */}
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white/90 p-8 shadow-xl backdrop-blur">
          <h1 className="mb-8 text-center text-3xl font-extrabold text-indigo-900">
            Sign In
          </h1>

          <form onSubmit={onSubmit} className="space-y-4">
            {errors.general && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {errors.general}
              </div>
            )}
            <div>
              <input
                name="id"
                value={form.id}
                onChange={onChange}
                placeholder="Your Email"
                disabled={loading}
                className={`w-full rounded-full border px-5 py-3 outline-none transition focus:ring ${
                  errors.id 
                    ? "border-red-300 bg-red-50 ring-red-200" 
                    : "border-gray-200 bg-white ring-indigo-200"
                } ${loading ? "opacity-50" : ""}`}
              />
              {errors.id && <p className="mt-1 text-sm text-red-500">{errors.id}</p>}
            </div>
            <div>
              <input
                name="pw"
                type="password"
                value={form.pw}
                onChange={onChange}
                placeholder="Your password"
                disabled={loading}
                className={`w-full rounded-full border px-5 py-3 outline-none transition focus:ring ${
                  errors.pw 
                    ? "border-red-300 bg-red-50 ring-red-200" 
                    : "border-gray-200 bg-white ring-indigo-200"
                } ${loading ? "opacity-50" : ""}`}
              />
              {errors.pw && <p className="mt-1 text-sm text-red-500">{errors.pw}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`mt-2 w-full rounded-full px-6 py-3 font-semibold text-white shadow-lg transition hover:brightness-95 active:translate-y-px ${
                loading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-teal-400"
              }`}
            >
              {loading ? "로그인 중..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 border-t pt-6 text-center text-sm text-gray-500">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-indigo-500 underline-offset-4 hover:underline"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
