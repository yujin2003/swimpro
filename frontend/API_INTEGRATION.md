# 백엔드 API 연결 가이드

이 문서는 프론트엔드와 백엔드 API를 연결하는 방법을 설명합니다.

## 📋 개요

프론트엔드 애플리케이션이 백엔드 API와 통신할 수 있도록 다음과 같은 구조로 연결되어 있습니다:

- **API 서비스 레이어**: `src/services/api.js`
- **환경 설정**: `src/config/environment.js`
- **상태 관리**: `src/store/posts.jsx` (API 통합)
- **컴포넌트**: 로그인, 회원가입, 게시글, 채팅 등

## 🔧 설정

### 1. 백엔드 서버 URL 설정

`src/config/environment.js` 파일에서 API URL을 설정하세요:

```javascript
export const API_CONFIG = {
  BASE_URL: isDevelopment 
    ? 'http://localhost:3001'  // 개발 환경
    : 'https://your-production-api.com', // 프로덕션 환경
};
```

### 2. 백엔드 서버 실행

백엔드 서버가 다음 포트에서 실행되어야 합니다:
- **개발 환경**: `http://localhost:3001`
- **프로덕션**: 실제 도메인으로 변경

## 🚀 API 엔드포인트

### 인증 (Authentication)

```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
POST /api/auth/refresh
```

### 게시글 (Posts)

```
GET    /api/posts           # 모든 게시글 조회
GET    /api/posts/:id       # 특정 게시글 조회
POST   /api/posts           # 게시글 생성
PUT    /api/posts/:id       # 게시글 수정
DELETE /api/posts/:id       # 게시글 삭제
GET    /api/posts/search    # 게시글 검색
```

### 채팅 (Chat)

```
GET    /api/chat/rooms                    # 채팅방 목록
GET    /api/chat/:chatId/messages         # 메시지 조회
POST   /api/chat/:chatId/messages         # 메시지 전송
```

### 수영 기록 (Swimming Records)

```
GET    /api/swimming/records/:userId      # 수영 기록 조회
POST   /api/swimming/records              # 수영 기록 추가
PUT    /api/swimming/records/:id          # 수영 기록 수정
DELETE /api/swimming/records/:id          # 수영 기록 삭제
```

### 사용자 (Users)

```
GET    /api/users/:id        # 사용자 정보 조회
PUT    /api/users/:id        # 사용자 정보 수정
```

## 📝 데이터 형식

### 게시글 (Post)

```javascript
{
  id: string,
  title: string,
  content: string,
  author: string,
  dateText: string,
  placeText: string,
  region: string,
  minutesAgo: number,
  avatar: string,
  createdAt: string,
  editedAt?: string
}
```

### 사용자 (User)

```javascript
{
  id: string,
  name: string,
  email: string,
  username: string,
  createdAt: string
}
```

### 채팅 메시지 (Message)

```javascript
{
  id: string,
  by: "me" | "other",
  text: string,
  time: string,
  timestamp: string
}
```

## 🔐 인증

### 로그인

```javascript
// 요청
{
  username: string,
  password: string
}

// 응답
{
  token: string,
  user: {
    id: string,
    name: string,
    email: string,
    username: string
  }
}
```

### 토큰 관리

- **저장**: `localStorage`에 `authToken` 키로 저장
- **사용**: API 요청 시 `Authorization: Bearer {token}` 헤더에 포함
- **만료**: 401 응답 시 자동으로 토큰 제거 및 로그인 페이지로 리다이렉트

## 🛠️ 개발 도구

### 디버깅

개발 환경에서 API 요청/응답을 확인하려면:

1. 브라우저 개발자 도구의 Network 탭 확인
2. 콘솔에서 `[DEBUG]` 로그 확인
3. `src/config/environment.js`의 `debugLog` 함수 활용

### 에러 처리

API 에러는 다음과 같이 처리됩니다:

- **네트워크 에러**: "네트워크 연결을 확인해주세요."
- **서버 에러**: "서버 오류가 발생했습니다."
- **인증 에러**: "로그인이 필요합니다."
- **권한 에러**: "접근 권한이 없습니다."

## 🔄 폴백 메커니즘

API 연결이 실패할 경우 자동으로 로컬 스토리지 데이터를 사용합니다:

1. **게시글**: `localStorage`의 `mentoring_posts_v1` 키
2. **채팅**: `localStorage`의 `chat_messages_v1` 키
3. **사용자**: `localStorage`의 `user` 키

## 🧪 테스트

### API 연결 테스트

```javascript
import { checkAPIHealth } from './src/services/api.js';

// API 상태 확인
const isConnected = await checkAPIHealth();
console.log('API 연결 상태:', isConnected);
```

### 수동 테스트

1. **로그인 테스트**: `/signin` 페이지에서 로그인 시도
2. **게시글 테스트**: 게시글 작성/수정/삭제 기능 확인
3. **채팅 테스트**: 메시지 전송/수신 기능 확인

## 🚨 문제 해결

### 일반적인 문제

1. **CORS 에러**: 백엔드에서 CORS 설정 확인
2. **네트워크 에러**: 백엔드 서버 실행 상태 확인
3. **인증 에러**: 토큰 만료 또는 잘못된 토큰

### 로그 확인

```javascript
// 브라우저 콘솔에서 확인
localStorage.getItem('authToken'); // 토큰 확인
localStorage.getItem('user'); // 사용자 정보 확인
```

## 📚 추가 정보

- **환경 변수**: `import.meta.env.DEV`로 개발/프로덕션 환경 구분
- **타임아웃**: API 요청 타임아웃은 10초로 설정
- **재시도**: 네트워크 에러 시 자동 재시도 (최대 3회)

## 🔗 관련 파일

- `src/services/api.js` - API 서비스 레이어
- `src/config/environment.js` - 환경 설정
- `src/store/posts.jsx` - 게시글 상태 관리
- `src/SignIn.jsx` - 로그인 컴포넌트
- `src/SignUp.jsx` - 회원가입 컴포넌트
- `src/pages/ChatPage.jsx` - 채팅 컴포넌트
- `src/pages/MentoringHome.jsx` - 멘토링 홈 컴포넌트





