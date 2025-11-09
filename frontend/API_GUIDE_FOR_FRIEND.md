# 🚀 로그인 API 사용법 가이드

## 📋 API 기본 정보

**요청 주소 (Endpoint):** `https://yasuko-bulletless-trudi.ngrok-free.dev/api/auth/login`

**요청 방식 (Method):** `POST`

**전송 형식 (Header):** `Content-Type: application/json` ⚠️ **매우 중요!**

## 📤 전송 내용 (Request Body)

**반드시 Raw JSON 형식으로 전송해야 합니다:**

```json
{
    "email": "test@example.com",
    "password": "password123"
}
```

## ⚠️ 401 에러 해결 체크리스트

### 🔥 1순위: username vs email 불일치 (가장 유력한 원인!)

**문제점:** API 명세서에는 `username`으로 되어 있지만, 실제 백엔드 코드는 `email`을 받습니다.

**❌ 잘못된 예시:**
```json
{
    "username": "test@example.com",  // ❌ 이렇게 보내면 401 에러!
    "password": "password123"
}
```

**✅ 올바른 예시:**
```json
{
    "email": "test@example.com",     // ✅ 이렇게 보내야 함!
    "password": "password123"
}
```

### 🔥 2순위: 데이터 전송 형식 오류 (JSON vs Form-Data)

**문제점:** 백엔드는 `express.json()`을 사용하므로 **반드시 JSON 형식**이어야 합니다.

**❌ 잘못된 예시 (Form-Data):**
```javascript
// ❌ 이렇게 하면 401 에러!
const formData = new FormData();
formData.append('email', 'test@example.com');
formData.append('password', 'password123');
```

**✅ 올바른 예시 (JSON):**
```javascript
// ✅ axios 사용 시
const response = await axios.post('/api/auth/login', {
    email: 'test@example.com',
    password: 'password123'
}, {
    headers: {
        'Content-Type': 'application/json'
    }
});

// ✅ fetch 사용 시
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
    })
});
```

### 🔥 3순위: 테스트 데이터 문제

**해결책:**
1. **먼저 회원가입을 해야 합니다!**
   - 회원가입 API: `POST https://yasuko-bulletless-trudi.ngrok-free.dev/api/auth/signup`
   - 회원가입 성공 후 같은 정보로 로그인 시도

2. **회원가입 요청 예시:**
```json
{
    "name": "홍길동",
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
}
```

### 🔥 4순위: ngrok 주소 문제

**확인사항:**
- ngrok 서버가 실행 중인지 확인
- 현재 ngrok 주소가 `https://yasuko-bulletless-trudi.ngrok-free.dev`인지 확인
- 서버를 껐다 켤 때마다 ngrok 주소가 바뀔 수 있음

## 🧪 테스트 방법

### 1. Postman으로 테스트
```
Method: POST
URL: https://yasuko-bulletless-trudi.ngrok-free.dev/api/auth/login
Headers: Content-Type: application/json
Body (raw JSON):
{
    "email": "test@example.com",
    "password": "password123"
}
```

### 2. curl로 테스트
```bash
curl -X POST https://yasuko-bulletless-trudi.ngrok-free.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

## 📞 문제 해결이 안 될 때

1. **백엔드 서버 로그 확인**
   - 터미널에서 `POST /api/auth/login` 요청이 들어오는지 확인
   - 에러 메시지가 있는지 확인

2. **네트워크 탭에서 확인**
   - 브라우저 개발자 도구 → Network 탭
   - 요청 헤더와 바디가 올바른지 확인

3. **연락처**
   - 문제가 계속되면 백엔드 개발자에게 연락

## ✅ 성공 시 응답 예시

```json
{
    "token": "mock-jwt-token-1234567890",
    "user": {
        "id": "1",
        "name": "테스트 사용자",
        "email": "test@example.com",
        "username": "test"
    }
}
```

---
**💡 핵심 포인트: `email` 필드 사용 + JSON 형식 전송!**
