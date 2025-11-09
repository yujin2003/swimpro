// src/components/TopNav.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useUser } from "../store/user.jsx";

export default function TopNav() {
  const { user, isLoggedIn, logout } = useUser();
  const navigate = useNavigate();
  const [isEtcOpen, setIsEtcOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 멘토링 버튼 클릭 핸들러 (강제 라우팅)
  const handleMentoringClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔘🔘🔘 멘토링 버튼 클릭 감지 (TopNav):', {
      href: '/mentoring',
      isLoggedIn,
      user: user?.name || user?.username,
      timestamp: new Date().toISOString(),
      eventType: e.type,
      target: e.target.tagName,
      currentTarget: e.currentTarget.tagName,
      currentPath: window.location.pathname
    });
    
    // 무조건 navigate로 이동 (Link의 기본 동작보다 우선)
    try {
      navigate('/mentoring');
      console.log('✅ navigate(/mentoring) 호출 완료');
    } catch (error) {
      console.error('❌ navigate 실패:', error);
      // 최후의 수단: window.location 사용
      window.location.href = '/mentoring';
    }
  };

  // 외부 클릭 시 드롭다운 닫기 (각 창에 독립적으로 등록)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 현재 창의 이벤트만 처리
      if (event.target && event.target.ownerDocument === document) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsEtcOpen(false);
        }
      }
    };

    // 현재 창의 document에만 리스너 등록
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 전역 클릭 디버깅 제거 - 다른 링크 작동을 방해하지 않도록
  // 멘토링 버튼은 자체 onClick 핸들러로 충분함

  // 멘토링 버튼 렌더링 확인 및 상태 체크 (한 번만 실행)
  useEffect(() => {
    // 각 창에서 한 번만 체크
    const checkButton = () => {
      // 현재 창의 document에서만 확인
      const mentoringButton = document.querySelector('[data-mentoring-button]');
      const navItem = document.querySelector('[data-testid="mentoring-nav-item"]');
      
      if (mentoringButton && mentoringButton.ownerDocument === document) {
        const styles = window.getComputedStyle(mentoringButton);
        const rect = mentoringButton.getBoundingClientRect();
        
        console.log('🔍 멘토링 버튼 DOM 확인 (현재 창):', {
          exists: true,
          visible: styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0',
          zIndex: styles.zIndex,
          pointerEvents: styles.pointerEvents,
          width: rect.width,
          height: rect.height,
          clickable: rect.width > 0 && rect.height > 0
        });
        
        // 실제 클릭 가능한지 테스트
        const clickable = rect.width > 0 && rect.height > 0 && 
                         styles.pointerEvents !== 'none' &&
                         styles.display !== 'none';
        
        if (!clickable) {
          console.warn('⚠️ 멘토링 버튼이 클릭 불가능한 상태입니다!');
        }
      } else if (!mentoringButton) {
        // 버튼이 없으면 TopNav가 렌더링되지 않은 것 (정상 - 다른 페이지일 수 있음)
        console.log('ℹ️ TopNav의 멘토링 버튼이 없습니다 (현재 페이지에 TopNav가 없을 수 있음)');
      }
    };
    
    // 컴포넌트 마운트 후 한 번만 확인
    const timeoutId = setTimeout(checkButton, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <header className="border-b" style={{ position: 'relative', zIndex: 1000, isolation: 'isolate' }}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4" style={{ position: 'relative', zIndex: 1001 }}>
        <ul className="flex items-center gap-8 text-[17px] font-medium" style={{ position: 'relative', zIndex: 1002 }}>
          <li style={{ position: 'relative', zIndex: 10 }}>
            <Link 
              className="hover:text-indigo-700" 
              to="/about"
              onClick={(e) => {
                console.log('🔘 About 링크 클릭');
              }}
              style={{ pointerEvents: 'auto', cursor: 'pointer', position: 'relative', zIndex: 11 }}
            >
              About
            </Link>
          </li>
          <li style={{ position: 'relative', zIndex: 10 }}>
            <Link 
              className="hover:text-indigo-700" 
              to="/routine"
              onClick={(e) => {
                console.log('🔘 Routine 링크 클릭');
              }}
              style={{ pointerEvents: 'auto', cursor: 'pointer', position: 'relative', zIndex: 11 }}
            >
              Routine
            </Link>
          </li>
          <li 
            style={{ 
              position: 'relative', 
              zIndex: 1000,
              isolation: 'isolate'
            }}
            data-testid="mentoring-nav-item"
          >
            {/* 대체: Link 대신 button 사용 */}
            <button
              data-mentoring-button
              onClick={(e) => {
                console.log('🔘 버튼 클릭 이벤트 시작');
                handleMentoringClick(e);
              }}
              onMouseDown={(e) => {
                console.log('🖱️ 멘토링 버튼 mousedown');
              }}
              onMouseUp={(e) => {
                console.log('🖱️ 멘토링 버튼 mouseup');
              }}
              onMouseEnter={() => {
                console.log('🖱️ 멘토링 버튼에 마우스 진입');
              }}
              onMouseLeave={() => {
                console.log('🖱️ 멘토링 버튼에서 마우스 나감');
              }}
              className="hover:text-indigo-700 relative inline-block bg-transparent border-none cursor-pointer text-[17px] font-medium p-0 m-0"
              style={{ 
                pointerEvents: 'auto', 
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
                fontFamily: 'inherit',
                color: 'inherit',
                outline: 'none',
                position: 'relative',
                zIndex: 1001,
                userSelect: 'none'
              }}
              aria-label="멘토링 페이지로 이동"
              type="button"
            >
              Mentoring
            </button>
            {/* 보조 Link (접근성용) */}
            <Link 
              to="/mentoring"
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
            >
              멘토링 페이지
            </Link>
          </li>
          <li style={{ position: 'relative', zIndex: 10 }}>
            <Link 
              className="hover:text-indigo-700" 
              to="/record"
              onClick={(e) => {
                console.log('🔘 Record 링크 클릭');
              }}
              style={{ pointerEvents: 'auto', cursor: 'pointer', position: 'relative', zIndex: 11 }}
            >
              Record
            </Link>
          </li>
          <li className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsEtcOpen(!isEtcOpen)}
              className="hover:text-indigo-700 flex items-center gap-1"
            >
              Etc
              <svg className={`w-4 h-4 transition-transform ${isEtcOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isEtcOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                <Link 
                  to="/shopping" 
                  className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  onClick={() => setIsEtcOpen(false)}
                >
                  🛍️ Swim Gear
                </Link>
                <Link 
                  to="/quiz" 
                  className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  onClick={() => setIsEtcOpen(false)}
                >
                  🏊‍♀️ Quiz
                </Link>
              </div>
            )}
          </li>
        </ul>

        {/* Right: login/signup buttons or user profile */}
        {isLoggedIn && user ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-xl">
              {user.avatar}
            </div>
            <span className="text-sm font-medium">{user.name || user.username}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="rounded-lg px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}


