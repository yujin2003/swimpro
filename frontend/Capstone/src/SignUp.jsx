// src/SignUp.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usersAPI, handleAPIError } from "./services/api.js";

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", id: "", pw: "" });
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
    if (!form.name.trim()) newErrors.name = "이름을 입력해주세요";
    if (!form.email.trim()) newErrors.email = "이메일을 입력해주세요";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "올바른 이메일 형식이 아닙니다";
    if (!form.id.trim()) newErrors.id = "아이디를 입력해주세요";
    else if (form.id.length < 3) newErrors.id = "아이디는 3자 이상이어야 합니다";
    if (!form.pw.trim()) newErrors.pw = "비밀번호를 입력해주세요";
    else if (form.pw.length < 6) newErrors.pw = "비밀번호는 6자 이상이어야 합니다";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await usersAPI.register({
        name: form.name,
        email: form.email,
        username: form.id,
        password: form.pw
      });
      
      alert(`가입 완료!\n환영합니다, ${form.name}님!`);
      navigate('/signin'); // 로그인 페이지로 이동
    } catch (error) {
      console.error('회원가입 실패:', error);
      const errorMessage = handleAPIError(error);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* 배경 - 동일 이미지 사용 */}
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
            Sign Up
          </h1>

          <form onSubmit={onSubmit} className="space-y-4">
            {errors.general && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {errors.general}
              </div>
            )}
            <div>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Name"
                disabled={loading}
                className={`w-full rounded-full border px-5 py-3 outline-none transition focus:ring ${
                  errors.name 
                    ? "border-red-300 bg-red-50 ring-red-200" 
                    : "border-gray-200 bg-white ring-indigo-200"
                } ${loading ? "opacity-50" : ""}`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>
            <div>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="Email"
                className={`w-full rounded-full border px-5 py-3 outline-none transition focus:ring ${
                  errors.email 
                    ? "border-red-300 bg-red-50 ring-red-200" 
                    : "border-gray-200 bg-white ring-indigo-200"
                }`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>
            <div>
              <input
                name="id"
                value={form.id}
                onChange={onChange}
                placeholder="ID"
                className={`w-full rounded-full border px-5 py-3 outline-none transition focus:ring ${
                  errors.id 
                    ? "border-red-300 bg-red-50 ring-red-200" 
                    : "border-gray-200 bg-white ring-indigo-200"
                }`}
              />
              {errors.id && <p className="mt-1 text-sm text-red-500">{errors.id}</p>}
            </div>
            <div>
              <input
                name="pw"
                type="password"
                value={form.pw}
                onChange={onChange}
                placeholder="Password"
                className={`w-full rounded-full border px-5 py-3 outline-none transition focus:ring ${
                  errors.pw 
                    ? "border-red-300 bg-red-50 ring-red-200" 
                    : "border-gray-200 bg-white ring-indigo-200"
                }`}
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
              {loading ? "가입 중..." : "Sign Up"}
            </button>
          </form>

          <div className="mt-8 border-t pt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="font-semibold text-indigo-500 underline-offset-4 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
