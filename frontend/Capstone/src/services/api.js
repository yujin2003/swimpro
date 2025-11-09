// API 서비스 레이어
// 백엔드 API와의 통신을 담당하는 서비스

import { API_CONFIG, AUTH_CONFIG, ERROR_MESSAGES, debugLog } from '../config/environment.js';

// API 요청을 위한 기본 설정 (고정)
const defaultHeaders = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true', // ngrok 브라우저 경고 스킵
  'Accept': 'application/json',
  'Cache-Control': 'no-cache'
};

// 인증 토큰 가져오기
const getAuthToken = () => {
  // sessionStorage 우선 사용 (각 창 독립적), 없으면 localStorage (하위 호환성)
  const sessionToken = sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  const localToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  const token = sessionToken || localToken;
  
  return token;
};

// API 요청 래퍼 함수
async function apiRequest(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // 인증 토큰이 있으면 헤더에 추가
  const token = getAuthToken();
  
  // 디버깅: 메시지 관련 API 호출 시 토큰 확인
  if (endpoint?.includes('/messages')) {
    const sessionToken = sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const localToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    console.log('🔐 API 토큰 확인 (메시지 API):', {
      endpoint,
      sessionToken: sessionToken ? sessionToken.substring(0, 20) + '...' : '없음',
      localToken: localToken ? localToken.substring(0, 20) + '...' : '없음',
      usingToken: token ? token.substring(0, 20) + '...' : '없음',
      source: sessionToken ? 'sessionStorage' : (localToken ? 'localStorage' : '없음')
    });
  }
  const headers = {
    ...defaultHeaders,
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  
  const config = {
    headers,
    ...options,
  };

  debugLog('API 요청:', url, config);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    // ngrok 서버용 헤더 강제 설정
    const finalHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };
    
    console.log('📤 API 요청 상세:', {
      url,
      method: config.method || 'GET',
      headers: finalHeaders,
      body: config.body ? JSON.parse(config.body) : undefined
    });
    
    const response = await fetch(url, {
      method: config.method || 'GET',
      headers: finalHeaders,
      body: config.body,
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // 에러 응답 본문 읽기 시도
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.text();
        if (errorData) {
          try {
            const parsed = JSON.parse(errorData);
            errorMessage = parsed.error || parsed.message || errorMessage;
          } catch {
            errorMessage = errorData || errorMessage;
          }
        }
      } catch (e) {
        console.warn('⚠️ 에러 응답 본문 읽기 실패:', e);
      }
      
      if (response.status === 401) {
        // 인증 실패 시 토큰 제거
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.USER_KEY);
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      } else if (response.status === 403) {
        throw new Error(ERROR_MESSAGES.FORBIDDEN);
      } else if (response.status === 404) {
        throw new Error(ERROR_MESSAGES.NOT_FOUND);
      } else if (response.status === 400) {
        throw new Error(`400 Bad Request: ${errorMessage}`);
      } else if (response.status >= 500) {
        throw new Error(ERROR_MESSAGES.SERVER_ERROR);
      } else {
        throw new Error(errorMessage);
      }
    }
    
    const data = await response.json();
    
    // 백엔드 응답 데이터 상세 로깅 (특히 게시글 조회 시)
    if (url.includes('/api/posts/') && data && typeof data === 'object') {
      console.log('🔍 백엔드에서 받은 원시 JSON 데이터:', {
        'event_date': data.event_date,
        'event_start_time': data.event_start_time,
        'event_end_time': data.event_end_time,
        'event_datetime': data.event_datetime,
        '전체 키': Object.keys(data),
        '원시 데이터': JSON.stringify(data, null, 2)
      });
    }
    debugLog('API 응답:', data);
    debugLog('응답 타입:', typeof data);
    debugLog('응답 길이:', data?.length);
    if (data && data.length > 0) {
      debugLog('첫 번째 항목:', data[0]);
      debugLog('첫 번째 항목 ID:', data[0]?.id, '타입:', typeof data[0]?.id);
    }
    return data;
  } catch (error) {
    debugLog('API 요청 실패:', error);
    debugLog('에러 타입:', error.name);
    debugLog('에러 메시지:', error.message);
    debugLog('요청 URL:', url);
    
    // 네트워크 에러나 CORS 에러인 경우 더 구체적으로 처리
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      debugLog('네트워크 연결 실패 - 서버가 실행 중인지 확인하세요');
      throw new Error('네트워크 연결을 확인해주세요. 백엔드 서버가 실행 중인지 확인해주세요.');
    }
    
    if (error.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다.');
    }
    
    // CORS 에러 처리
    if (error.message.includes('CORS') || error.message.includes('cors')) {
      throw new Error('CORS 에러가 발생했습니다. 서버 설정을 확인해주세요.');
    }
    
    throw error;
  }
}

// 게시글 관련 API
export const postsAPI = {
  // 모든 게시글 조회
  getAllPosts: () => apiRequest('/api/posts'),
  
  // 특정 게시글 조회
  getPost: (id) => apiRequest(`/api/posts/${id}`),
  
  // 게시글 생성
  createPost: (postData) => apiRequest('/api/posts', {
    method: 'POST',
    body: JSON.stringify(postData),
  }),
  
  // 게시글 수정
  updatePost: (id, postData) => apiRequest(`/api/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(postData),
  }),
  
  // 게시글 삭제
  deletePost: (id, data = {}) => apiRequest(`/api/posts/${id}`, {
    method: 'DELETE',
    body: Object.keys(data).length > 0 ? JSON.stringify(data) : undefined,
  }),
  
  // 게시글 검색
  searchPosts: (query) => apiRequest(`/api/posts/search?q=${encodeURIComponent(query)}`),
  
  // 베스트 게시글 조회 (추천 게시글 API 사용)
  getBestPosts: () => apiRequest('/api/posts/recommend'),
  
  // 추천 게시글 조회 (특정 게시글과 매칭되는 추천 게시글)
  getRecommendedPosts: (postId) => apiRequest(`/api/posts/${postId}/recommend`),
};

// 사용자 관련 API
export const usersAPI = {
  // 로그인
  login: (credentials) => apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  // 회원가입
  register: (userData) => apiRequest('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  // 사용자 정보 조회
  getUser: (id) => apiRequest(`/api/users/${id}`),
  
  // 사용자 정보 수정
  updateUser: (id, userData) => apiRequest(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
};

// 채팅 관련 API
export const chatAPI = {
  // 채팅 메시지 조회
  getMessages: (chatId) => apiRequest(`/api/chat/${chatId}/messages`),
  
  // 채팅 메시지 전송
  sendMessage: (chatId, message) => apiRequest(`/api/chat/${chatId}/messages`, {
    method: 'POST',
    body: JSON.stringify(message),
  }),
  
  // 채팅방 목록 조회
  getChatRooms: () => apiRequest('/api/chat/rooms'),
};

// DM(쪽지) 관련 API
export const messagesAPI = {
  // 대화 상대 목록 조회
  getConversations: () => apiRequest('/api/messages/conversations'),
  
  // 특정 사용자와의 대화 내역 조회
  getMessagesWithUser: (otherUserId) => apiRequest(`/api/messages/with/${otherUserId}`),
  
  // WebSocket DM 메시지 저장 (백엔드 동기화용)
  saveDMMessage: (messageData) => apiRequest('/api/messages/dm', {
    method: 'POST',
    body: JSON.stringify(messageData),
  }),
};

// 수영 기록 관련 API
export const swimmingAPI = {
  // 수영 기록 조회
  getRecords: (userId) => apiRequest(`/api/swimming/records/${userId}`),
  
  // 수영 기록 추가
  addRecord: (recordData) => apiRequest('/api/swimming/records', {
    method: 'POST',
    body: JSON.stringify(recordData),
  }),
  
  // 수영 기록 수정
  updateRecord: (id, recordData) => apiRequest(`/api/swimming/records/${id}`, {
    method: 'PUT',
    body: JSON.stringify(recordData),
  }),
  
  // 수영 기록 삭제
  deleteRecord: (id) => apiRequest(`/api/swimming/records/${id}`, {
    method: 'DELETE',
  }),
  
  // 수영 종목 정보 조회
  getSwimTypes: () => apiRequest('/api/swim-types', {
    method: 'GET',
  }),
  
  // 루틴 추천 (POST)
  recommendRoutine: (userData) => apiRequest('/api/routines/recommend', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  // 추천 루틴 조회 (GET)
  getRecommendedRoutine: () => apiRequest('/api/routines/recommend', {
    method: 'GET',
  }),
};

// 에러 처리 유틸리티
export const handleAPIError = (error) => {
  debugLog('API 에러 상세:', error);
  console.error('API 에러:', error.message, error);
  
  // 이미 처리된 에러 메시지가 있으면 그대로 반환
  if (Object.values(ERROR_MESSAGES).includes(error.message)) {
    return error.message;
  }
  
  // 네트워크 에러 처리
  if (error.message.includes('Network') || error.message.includes('fetch')) {
    return '네트워크 연결을 확인해주세요. 백엔드 서버가 실행 중인지 확인해주세요.';
  }
  
  // HTTP 상태 코드별 에러 메시지
  if (error.message.includes('404')) {
    return ERROR_MESSAGES.NOT_FOUND;
  } else if (error.message.includes('500')) {
    return ERROR_MESSAGES.SERVER_ERROR;
  } else if (error.message.includes('401')) {
    return ERROR_MESSAGES.UNAUTHORIZED;
  } else if (error.message.includes('403')) {
    return ERROR_MESSAGES.FORBIDDEN;
  } else {
    return `에러: ${error.message}`;
  }
};

// 퀴즈 관련 API
export const quizAPI = {
  // 퀴즈 시작 (GET 방식)
  startQuiz: () => apiRequest('/api/quiz/start', {
    method: 'GET',
  }),
  
  // 퀴즈 제출
  submitQuiz: (answers) => apiRequest('/api/quiz/submit', {
    method: 'POST',
    body: JSON.stringify(answers),
  }),
};

// 수영 기록 로그 API (RecordCalendar용)
export const logsAPI = {
  // 전체 달력 데이터 조회 (year, month 쿼리 파라미터 포함)
  getCalendar: (year, month) => {
    const queryParams = new URLSearchParams({
      year: year?.toString() || new Date().getFullYear().toString(),
      month: month?.toString() || (new Date().getMonth() + 1).toString()
    });
    return apiRequest(`/api/logs/calendar?${queryParams.toString()}`, {
      method: 'GET',
    });
  },
  
  // 특정 날짜의 기록 조회
  getDateRecord: (date) => apiRequest(`/api/logs/date/${encodeURIComponent(date)}`, {
    method: 'GET',
  }),
  
  // 기록 저장
  saveRecord: (recordData) => apiRequest('/api/logs', {
    method: 'POST',
    body: JSON.stringify(recordData),
  }),
  
  // 기록 삭제
  deleteRecord: (date) => apiRequest(`/api/logs/date/${encodeURIComponent(date)}`, {
    method: 'DELETE',
  }),
};

// API 상태 확인
export const checkAPIHealth = async () => {
  try {
    console.log('🔍 API 상태 확인 시작:', API_CONFIG.BASE_URL);
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
      },
      mode: 'cors'
    });
    console.log('🔍 API 응답 상태:', response.status);
    console.log('🔍 API 응답 OK:', response.ok);
    const data = await response.json();
    console.log('🔍 API 응답 데이터:', data);
    return response.ok;
  } catch (error) {
    console.error('🔍 API 상태 확인 실패:', error);
    console.error('🔍 에러 타입:', error.name);
    console.error('🔍 에러 메시지:', error.message);
    return false;
  }
};
