import React from "react";
import TopNav from "./components/TopNav";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">About Us</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            수영 종합정보시스템은 모든 수영인을 위한 통합 플랫폼입니다. 
            사용자 맞춤 루틴 추천, 멘토-멘티 매칭, 수영 기록 관리 기능 등 
            다양한 서비스를 제공합니다.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">주요 기능</h2>
          <ul className="list-disc list-inside text-gray-600 mb-6">
            <li>개인 맞춤 수영 루틴 추천</li>
            <li>멘토-멘티 매칭 서비스</li>
            <li>수영 기록 관리 및 분석</li>
            <li>수영용품 쇼핑</li>
          </ul>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">연락처</h2>
          <p className="text-gray-600">
            문의사항이 있으시면 언제든지 연락주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
