// 환경 설정 파일
// 개발/프로덕션 환경에 따른 설정 관리

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// API 기본 URL 설정 (고정)
export const API_CONFIG = {
  // ngrok 서버 사용 (외부 접근 가능)
  BASE_URL: 'https://yasuko-bulletless-trudi.ngrok-free.dev',
  // BASE_URL: 'http://localhost:3001', // 로컬 백엔드 서버 (개발용)
  
  // API 엔드포인트
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/signup',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh'
    },
    POSTS: {
      LIST: '/api/posts',
      CREATE: '/api/posts',
      UPDATE: '/api/posts',
      DELETE: '/api/posts',
      SEARCH: '/api/posts/search'
    },
    CHAT: {
      ROOMS: '/api/chat/rooms',
      MESSAGES: '/api/chat',
      SEND: '/api/chat'
    },
    SWIMMING: {
      RECORDS: '/api/swimming/records',
      CREATE: '/api/swimming/records',
      UPDATE: '/api/swimming/records',
      DELETE: '/api/swimming/records'
    },
    USERS: {
      PROFILE: '/api/users',
      UPDATE: '/api/users'
    }
  },
  
  // 요청 타임아웃 (밀리초)
  TIMEOUT: 10000,
  
  // 재시도 횟수
  RETRY_COUNT: 3,
  
  // 재시도 간격 (밀리초)
  RETRY_DELAY: 1000
};

// 인증 토큰 관리
export const AUTH_CONFIG = {
  TOKEN_KEY: 'authToken',
  USER_KEY: 'user',
  USER_ID_KEY: 'userId', // userId를 별도로 저장하기 위한 키
  REFRESH_TOKEN_KEY: 'refreshToken'
};

// 로컬 스토리지 키 관리
export const STORAGE_KEYS = {
  POSTS: 'mentoring_posts_v1',
  CHAT_MESSAGES: 'chat_messages_v1',
  USER_PREFERENCES: 'user_preferences_v1'
};

// 에러 메시지 설정
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  VALIDATION_ERROR: '입력 정보를 확인해주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.'
};

// 개발 환경에서만 콘솔 로그 출력
export const debugLog = (...args) => {
  if (isDevelopment) {
    console.log('[DEBUG]', ...args);
  }
};

// API 상태 확인
export const checkAPIConnection = async () => {
  try {
    console.log('🔍 API 연결 확인 시작:', API_CONFIG.BASE_URL);
    
    // /api/posts로 직접 확인 (백엔드에 /api/health 엔드포인트가 없으므로)
    const postsResponse = await fetch(`${API_CONFIG.BASE_URL}/api/posts`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
      },
      mode: 'cors',
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
    });
    
    console.log('🔍 API 응답 상태:', postsResponse.status);
    console.log('🔍 API 응답 OK:', postsResponse.ok);
    return postsResponse.ok;
  } catch (error) {
    console.error('🔍 API 연결 확인 실패:', error);
    console.error('🔍 에러 타입:', error.name);
    console.error('🔍 에러 메시지:', error.message);
    debugLog('API 연결 확인 실패:', error);
    return false;
  }
};
