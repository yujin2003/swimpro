import { createContext, useContext, useEffect, useState } from "react";
import { AUTH_CONFIG } from "../config/environment.js";

const UserContext = createContext(null);

// 기본 사용자 정보
const DEFAULT_USER = {
  id: '1',
  username: 'yeah',
  email: 'yeah@demo.com',
  name: 'yeah(남성)',
  avatar: '🧑🏻‍🎨'
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);

  // 세션 스토리지에서 사용자 정보 로드 (각 창 독립적으로 작동)
  const loadUser = () => {
    try {
      // sessionStorage 사용 - 각 브라우저 창이 독립적으로 작동
      // localStorage는 모든 창에서 공유되지만, sessionStorage는 각 창에 독립적
      const token = sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY) || localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const userData = sessionStorage.getItem(AUTH_CONFIG.USER_KEY) || localStorage.getItem(AUTH_CONFIG.USER_KEY);
      
      console.log('🔍 현재 창의 사용자 정보 로드:', {
        token: token ? '있음' : '없음',
        userData: userData ? '있음' : '없음',
        storageType: sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY) ? 'sessionStorage' : 'localStorage'
      });
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        console.log('🔍 파싱된 사용자 데이터:', parsedUser);
        
        // userId도 확인하고 없다면 추가
        const storedUserId = sessionStorage.getItem(AUTH_CONFIG.USER_ID_KEY) || localStorage.getItem(AUTH_CONFIG.USER_ID_KEY);
        if (!storedUserId && (parsedUser.id || parsedUser.userId || parsedUser.user_id)) {
          const userId = parsedUser.userId || parsedUser.id || parsedUser.user_id;
          sessionStorage.setItem(AUTH_CONFIG.USER_ID_KEY, String(userId));
          console.log('✅ 저장된 userId 복원 (sessionStorage):', userId);
        }
        
        setUser(parsedUser);
        setToken(token);
        setIsLoggedIn(true);
      } else {
        // 토큰이 없으면 로그인하지 않은 상태
        console.log('🔍 로그인하지 않은 상태');
        setUser(null);
        setToken(null);
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
      setUser(null);
      setToken(null);
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    // 초기 로드
    loadUser();

    // sessionStorage는 각 창이 독립적이므로 storage 이벤트 리스너 불필요
    // 각 창이 독립적으로 작동하도록 함
    console.log('✅ UserProvider 초기화 완료 (독립 창 모드)');
  }, []);

  // 로그인 함수 - sessionStorage 사용 (각 창 독립적)
  const login = (userData, token) => {
    try {
      // ⚠️ 중요: 이전 사용자의 토큰과 정보를 명시적으로 삭제 (JWT 토큰 혼동 방지)
      console.log('🔐 로그인 시작 - 이전 사용자 데이터 확인 및 삭제');
      
      // 이전 토큰 확인 (디버깅용)
      const oldSessionToken = sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const oldLocalToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const oldSessionUserId = sessionStorage.getItem(AUTH_CONFIG.USER_ID_KEY);
      const oldLocalUserId = localStorage.getItem(AUTH_CONFIG.USER_ID_KEY);
      
      console.log('🔍 이전 사용자 데이터:', {
        sessionToken: oldSessionToken ? oldSessionToken.substring(0, 20) + '...' : '없음',
        localToken: oldLocalToken ? oldLocalToken.substring(0, 20) + '...' : '없음',
        sessionUserId: oldSessionUserId || '없음',
        localUserId: oldLocalUserId || '없음'
      });
      
      // sessionStorage에서 이전 데이터 삭제
      sessionStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      sessionStorage.removeItem(AUTH_CONFIG.USER_KEY);
      sessionStorage.removeItem(AUTH_CONFIG.USER_ID_KEY);
      
      // localStorage에서도 이전 데이터 삭제 (이전 사용자의 토큰이 남아있을 수 있음)
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_ID_KEY);
      
      console.log('✅ 이전 사용자 데이터 삭제 완료');
      
      // 새로운 사용자 정보 저장 (sessionStorage 우선)
      sessionStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
      sessionStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userData));
      
      // localStorage에도 저장 (하위 호환성, API 요청 시 확인)
      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
      localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userData));
      
      // userId를 별도로 저장 (백엔드 응답에서 userId 또는 user.id 사용)
      const userId = userData.userId || userData.id || userData.user_id;
      if (userId) {
        sessionStorage.setItem(AUTH_CONFIG.USER_ID_KEY, String(userId));
        localStorage.setItem(AUTH_CONFIG.USER_ID_KEY, String(userId));
        console.log('✅ userId 저장 (sessionStorage + localStorage):', userId);
        console.log('✅ 저장된 토큰 확인:', {
          sessionToken: sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY)?.substring(0, 20) + '...',
          localToken: localStorage.getItem(AUTH_CONFIG.TOKEN_KEY)?.substring(0, 20) + '...',
          userId: userId
        });
      } else {
        console.warn('⚠️ userId를 찾을 수 없습니다. userData:', userData);
      }
      
      setUser(userData);
      setToken(token);
      setIsLoggedIn(true);
      console.log('✅ 로그인 완료 - 새 사용자 정보 저장됨');
    } catch (error) {
      console.error('로그인 정보 저장 실패:', error);
    }
  };

  // 로그아웃 함수 - sessionStorage 정리
  const logout = () => {
    try {
      // sessionStorage 정리 (현재 창만)
      sessionStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      sessionStorage.removeItem(AUTH_CONFIG.USER_KEY);
      sessionStorage.removeItem(AUTH_CONFIG.USER_ID_KEY);
      
      // localStorage도 정리 (선택사항)
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_ID_KEY);
      
      setUser(null);
      setToken(null);
      setIsLoggedIn(false);
      console.log('✅ 로그아웃 완료 (현재 창만)');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  // 사용자 정보 업데이트 - sessionStorage 사용
  const updateUser = (newUserData) => {
    try {
      const updatedUser = { ...user, ...newUserData };
      sessionStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('사용자 정보 업데이트 실패:', error);
    }
  };

  // 스토리지 초기화 (디버깅용) - sessionStorage와 localStorage 모두
  const clearStorage = () => {
    try {
      // sessionStorage 정리
      sessionStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      sessionStorage.removeItem(AUTH_CONFIG.USER_KEY);
      sessionStorage.removeItem(AUTH_CONFIG.USER_ID_KEY);
      
      // localStorage 정리
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_ID_KEY);
      
      setUser(null);
      setToken(null);
      setIsLoggedIn(false);
      console.log('🧹 스토리지 초기화 완료 (현재 창)');
    } catch (error) {
      console.error('스토리지 초기화 실패:', error);
    }
  };

  const value = {
    user,
    token,
    isLoggedIn,
    login,
    logout,
    updateUser,
    clearStorage
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
