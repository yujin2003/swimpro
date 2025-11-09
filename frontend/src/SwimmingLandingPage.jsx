import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function SwimmingLandingPage() {
  return (
    <div className="relative h-screen w-svw text-white">
      {/* 배경 */}
      <div className="absolute inset-0">
        <img
          src="/swimming.jpg"
          alt="swimming"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* 네비게이션 */}
      <nav className="absolute top-0 w-full flex justify-end items-center gap-6 p-6 text-lg font-medium">
        <Link to="/about" className="hover:opacity-80">About</Link>
        <Link to="/routine" className="hover:opacity-80">Routine</Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            console.log('🔘🔘🔘 멘토링 버튼 클릭 (SwimmingLandingPage):', {
              href: '/mentoring',
              timestamp: new Date().toISOString()
            });
            // navigate를 사용하기 위해 useNavigate 추가 필요
            window.location.href = '/mentoring';
          }}
          className="hover:opacity-80 bg-transparent border-none cursor-pointer text-lg font-medium text-white"
          style={{ 
            pointerEvents: 'auto',
            cursor: 'pointer',
            padding: 0,
            margin: 0
          }}
        >
          Mentoring
        </button>
        <Link to="/record" className="hover:opacity-80">Record</Link>
        <Link to="/shopping" className="hover:opacity-80">etc</Link>


        <Link
          to="/signup"
          className="rounded-xl px-5 py-2 bg-black/70 text-white"
        >
          Sign Up
        </Link>
        <Link
          to="/signin"
          className="rounded-xl px-5 py-2 bg-indigo-500 text-white"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <div className="relative flex h-full max-w-2xl flex-col justify-center px-12">
        <motion.h1
          className="mb-6 text-5xl leading-tight font-bold md:text-6xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Dive Deeper into <br /> Your Swimming Journey
        </motion.h1>

        <motion.p
          className="mb-8 text-base text-gray-200 md:text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          수영 종합정보시스템은 모든 수영인을 위한 통합 플랫폼입니다.
          <br />
          사용자 맞춤 루틴 추천, 멘토-멘티 매칭, 수영 기록 관리 기능 등 다양한
          서비스를 제공합니다.
        </motion.p>

        <div className="flex gap-4">
          <Link
            to="/routine"
            className="rounded-full bg-indigo-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-indigo-700 active:translate-y-px"
          >
            Get Started
          </Link>
          <Link
            to="/signup"
            className="rounded-full border-2 border-white px-8 py-3 font-semibold text-white transition hover:bg-white hover:text-indigo-600"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
}

