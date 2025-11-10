import { motion } from "framer-motion";
// 1. TopNav 컴포넌트를 import 합니다.
import TopNav from "./components/TopNav";

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

      {/* 2. 기존 <nav>...</nav> 블록 전체를 <TopNav />로 교체합니다. */}
      <TopNav />

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
          <button
            onClick={(e) => e.preventDefault()}
            className="rounded-full bg-indigo-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-indigo-700 active:translate-y-px cursor-default"
            style={{ pointerEvents: 'auto' }}
          >
            Get Started
          </button>
          <button
            onClick={(e) => e.preventDefault()}
            className="rounded-full border-2 border-white px-8 py-3 font-semibold text-white transition hover:bg-white hover:text-indigo-600 cursor-default"
            style={{ pointerEvents: 'auto' }}
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}