// src/MentoringPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

const mentoringData = [
  {
    id: 1,
    title: "배영 알려주실 분 구해요",
    date: "2025년 3월27일",
    location: "기흥역",
    time: "5m",
    avatar: "https://placehold.co/64x58",
    isSelected: false,
    hasNewIndicator: true
  },
  {
    id: 2,
    title: "배영 알려주실 분 구해요",
    date: "2025년 3월27일",
    location: "기흥역",
    time: "5m",
    avatar: "https://placehold.co/59x59",
    isSelected: true,
    hasNewIndicator: false
  },
  {
    id: 3,
    title: "배영 알려주실 분 구해요",
    date: "2025년 3월27일",
    location: "기흥역",
    time: "5m",
    avatar: "https://placehold.co/60x60",
    isSelected: false,
    hasNewIndicator: false
  },
  {
    id: 4,
    title: "배영 알려주실 분 구해요",
    date: "2025년 3월27일",
    location: "기흥역",
    time: "5m",
    avatar: "https://placehold.co/64x62",
    isSelected: false,
    hasNewIndicator: false
  },
  {
    id: 5,
    title: "배영 알려주실 분 구해요",
    date: "2025년 3월27일",
    location: "기흥역",
    time: "5m",
    avatar: "https://placehold.co/64x58",
    isSelected: false,
    hasNewIndicator: true
  },
  {
    id: 6,
    title: "배영 알려주실 분 구해요",
    date: "2025년 3월27일",
    location: "기흥역",
    time: "5m",
    avatar: "https://placehold.co/59x59",
    isSelected: true,
    hasNewIndicator: false
  },
  {
    id: 7,
    title: "배영 알려주실 분 구해요",
    date: "2025년 3월27일",
    location: "기흥역",
    time: "5m",
    avatar: "https://placehold.co/60x60",
    isSelected: false,
    hasNewIndicator: false
  },
  {
    id: 8,
    title: "배영 알려주실 분 구해요",
    date: "2025년 3월27일",
    location: "기흥역",
    time: "5m",
    avatar: "https://placehold.co/68x62",
    isSelected: false,
    hasNewIndicator: false
  },
  {
    id: 9,
    title: "배영 알려주실 분 구해요",
    date: "2025년 3월27일",
    location: "기흥역",
    time: "5m",
    avatar: "https://placehold.co/64x58",
    isSelected: false,
    hasNewIndicator: true
  }
];

export default function MentoringPage() {
  const [selectedItems, setSelectedItems] = useState([2, 6]);

  const toggleSelection = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-purple-900 bg-opacity-90 flex">
      {/* 사이드바 */}
      <Sidebar />
      
      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col">
        {/* 헤더 */}
        <Header />
        
        {/* 멘토링 리스트 */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg overflow-hidden max-w-4xl">
            {mentoringData.map((item, index) => (
              <MentoringItem
                key={item.id}
                item={item}
                isSelected={selectedItems.includes(item.id)}
                onToggle={() => toggleSelection(item.id)}
                hasBorder={index < mentoringData.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between p-6">
      {/* 상단 프로필 */}
      <div className="space-y-11">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="text-black text-base font-bold font-['Open_Sans']">
              Duck UI
            </div>
            <div className="text-gray-800 text-sm font-normal font-['Open_Sans']">
              Duckui@demo.com
            </div>
          </div>
        </div>
        
        {/* 메뉴 아이템들 */}
        <div className="space-y-6">
          <SidebarItem icon="🏠" label="local" />
          <SidebarItem icon="📊" label="event" />
          <SidebarItem icon="🔔" label="alarm" />
        </div>
      </div>
      
      {/* 하단 로그아웃 */}
      <div>
        <SidebarItem icon="🚪" label="Logout" />
      </div>
    </div>
  );
}

function SidebarItem({ icon, label }) {
  return (
    <div className="p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-6 h-6 flex items-center justify-center text-lg">
          {icon}
        </div>
        <div className="text-black text-base font-normal font-['Open_Sans']">
          {label}
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="bg-transparent p-6 relative">
      {/* 검색바 */}
      <div className="absolute left-6 top-6">
        <div className="bg-white rounded-full px-5 py-2.5 flex items-center gap-2.5 w-80">
          <SearchIcon />
          <span className="text-gray-400 text-sm font-normal font-['Amazon_Ember']">
            Search...
          </span>
        </div>
      </div>
      
      {/* 네비게이션 */}
      <div className="flex justify-center gap-8 mt-4">
        <NavLink text="About" />
        <NavLink text="Routine" />
        <NavLink text="Mentoring" />
        <NavLink text="Record" />
        <NavLink text="etc" />
      </div>
      
      {/* 프로필 */}
      <div className="absolute right-6 top-6 flex items-center gap-4">
        <img 
          src="https://placehold.co/40x40" 
          alt="Profile" 
          className="w-10 h-10 rounded-full"
        />
        <span className="text-white text-sm font-medium font-['Amazon_Ember']">
          Leslie Alexander
        </span>
      </div>
    </div>
  );
}

function NavLink({ text }) {
  return (
    <Link 
      to={text === "About" ? "/about" : text === "Routine" ? "/routine" : text === "Record" ? "/record" : text === "etc" ? "/shopping" : "#"}
      className="text-white text-lg font-medium font-['DM_Sans'] transform -rotate-1 hover:rotate-0 transition-transform"
    >
      {text}
    </Link>
  );
}

function SearchIcon() {
  return (
    <div className="w-8 h-7 relative">
      <div className="w-5 h-5 absolute left-1 top-1 border border-gray-400 rounded-sm" />
      <div className="w-1.5 h-1.5 absolute right-1 bottom-1 border border-gray-400 rounded-sm" />
    </div>
  );
}

function MentoringItem({ item, isSelected, onToggle, hasBorder }) {
  const baseClasses = "px-5 py-4 flex items-center gap-4 relative cursor-pointer transition-all";
  const selectedClasses = "bg-gradient-to-r from-blue-600 to-blue-700 text-white";
  const normalClasses = "bg-white text-black hover:bg-gray-50";
  const borderClasses = hasBorder ? "border-b border-blue-100" : "";

  return (
    <div 
      className={`${baseClasses} ${isSelected ? selectedClasses : normalClasses} ${borderClasses}`}
      onClick={onToggle}
    >
      {/* 새 알림 인디케이터 */}
      {item.hasNewIndicator && (
        <div className="absolute left-1.5 top-8 w-1 h-1 bg-blue-600 rounded-full" />
      )}
      
      {/* 아바타 */}
      <img 
        src={item.avatar} 
        alt="Avatar" 
        className="w-16 h-16 rounded-full flex-shrink-0"
      />
      
      {/* 텍스트 정보 */}
      <div className="flex-1">
        <div className="text-base font-normal font-['Inter'] leading-relaxed">
          <div>제목: {item.title}</div>
          <div>일시: {item.date}</div>
          <div>위치: {item.location}</div>
        </div>
      </div>
      
      {/* 시간 */}
      <div className="text-right">
        <div className={`text-xs font-normal font-['Amazon_Ember'] ${
          isSelected ? 'text-white' : 'text-gray-400'
        }`}>
          {item.time}
        </div>
      </div>
    </div>
  );
}