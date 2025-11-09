import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="relative h-screen w-full text-white">
      {/* 배경 이미지 */}
      <img
        src="/swimming.jpg"
        alt="swimming"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* 네비게이션 */}
      <nav className="absolute top-0 w-full flex justify-end gap-6 p-6 text-lg font-medium">
        <Link to="/about" className="hover:text-blue-300 transition">About</Link>
        <a href="#routine">Routine</a>
        <a href="#mentoring">Mentoring</a>
        <a href="#record">Record</a>
        <a href="#etc">etc</a>
        <button className="rounded-xl bg-black px-4 py-2">Sign Up</button>
        <button className="rounded-xl bg-indigo-500 px-4 py-2">Sign In</button>
      </nav>

      {/* 메인 텍스트 */}
      <div className="relative flex h-screen items-center justify-start px-12">
        <div>
          <h1 className="text-5xl font-bold mb-4">
            Dive Deeper into <br /> Your Swimming Journey
          </h1>
          <p className="text-lg mb-6">
            수영 종합정보시스템은 모든 수영인을 위한 통합 플랫폼입니다.
            <br />
            사용자 맞춤 루틴 추천, 멘토-멘티 매칭, 수영 기록 관리 기능 등 다양한
            서비스를 제공합니다.
          </p>
          <div className="flex gap-4">
            <button className="rounded-xl bg-indigo-600 px-6 py-3 text-white">
              Get Started
            </button>
            <button className="rounded-xl border px-6 py-3 text-white">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
