// 간단한 백엔드 서버 (개발용)
import express from 'express';
import cors from 'cors';
const app = express();
const PORT = 3001;

// 미들웨어
app.use(cors({
  origin: true, // 모든 origin 허용 (ngrok 호환성)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url} - Origin: ${req.headers.origin || 'unknown'}`);
  
  // 추천 게시글 API 요청인 경우 특별히 로깅
  if (req.url.includes('/recommend') || req.path.includes('/recommend')) {
    console.log('💡💡💡 추천 게시글 API 요청 감지:', {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      path: req.path,
      params: req.params,
      query: req.query
    });
  }
  
  console.log('📡 Headers:', {
    'content-type': req.headers['content-type'],
    'origin': req.headers.origin,
    'ngrok-skip-browser-warning': req.headers['ngrok-skip-browser-warning'],
    'authorization': req.headers.authorization ? 'present' : 'missing'
  });
  
  // /api/messages/dm 요청인 경우 특별히 로깅
  if (req.url === '/api/messages/dm' || req.url.includes('/api/messages/dm')) {
    console.log('🔍🔍🔍 /api/messages/dm 요청 감지 (미들웨어):', {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      path: req.path,
      body: req.body,
      headers: {
        'authorization': req.headers.authorization ? 'present' : 'missing',
        'content-type': req.headers['content-type']
      }
    });
  }
  
  next();
});

// ngrok 헤더 처리 (와이파이 변경되어도 연결 유지)
app.use((req, res, next) => {
  // ngrok-free.dev 도메인에서 오는 요청 처리
  if (req.headers['ngrok-skip-browser-warning']) {
    res.setHeader('ngrok-skip-browser-warning', 'true');
  }
  next();
});

// 메모리 데이터베이스 (개발용)
let posts = [
  {
    id: 1,
    post_id: 1,
    title: '배영 알려주실 분 구해요',
    content: '배영 기초부터 알려주실 멘토 구합니다.',
    author: 'yeah(남성)',
    username: 'yeah(남성)',
    user_id: 1, // 작성자 ID (숫자)
    dateText: '3월 12 오후 6시',
    placeText: '기흥역 근처',
    location: '기흥역 근처',
    region: '경기',
    minutesAgo: 5,
    avatar: '🧑🏻‍🎨',
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  // 테스트용 예시 게시글 (A형 멘티)
  {
    id: 100,
    post_id: 100,
    title: '12월 마스터즈 대회 접영 50m 기록 단축이 목표입니다.',
    content: '안녕하세요. 현재 접영 50m 기록이 33초에서 정체 중입니다. 경기 성남 쪽에서 주말 오전에 같이 훈련하면서 스타트나 턴 동작 피드백 주실 수 있는 멘토님 찾습니다. 자세 교정 영상 분석도 가능하신 분이면 좋겠습니다.',
    author: 'A형멘티',
    username: 'A형멘티',
    user_id: 100,
    dateText: '주말 오전',
    placeText: '경기 성남',
    location: '경기 성남',
    region: '경기',
    category: '접영',
    stroke: '접영',
    role: '멘티',
    user_type: 'A형',
    intent: '팁 요청',
    event: '접영',
    minutesAgo: 10,
    avatar: '🏊',
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    created_at: new Date(Date.now() - 10 * 60000).toISOString()
  },
  // 테스트용 예시 게시글 (A형 멘토)
  {
    id: 101,
    post_id: 101,
    title: '전직 선수 출신, 접영/자유형 포인트 레슨해 드립니다. (기록 단축)',
    content: '경기 성남에서 주말마다 개인 훈련 중입니다. 마스터즈 대회 준비하시는데 기록 정체가 온 A형 분들, 고급 기술(턴, 돌핀킥 등) 위주로 자세 봐드릴 수 있습니다. 정말 기록 단축이 간절하신 분만 연락 주세요.',
    author: 'A형멘토',
    username: 'A형멘토',
    user_id: 101,
    dateText: '주말',
    placeText: '경기 성남',
    location: '경기 성남',
    region: '경기',
    category: '접영',
    stroke: '접영',
    role: '멘토',
    user_type: 'A형',
    intent: '조언자',
    event: '접영',
    minutesAgo: 20,
    avatar: '🏊‍♂️',
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
    created_at: new Date(Date.now() - 20 * 60000).toISOString()
  },
  // 테스트용 예시 게시글 (C형 멘티)
  {
    id: 102,
    post_id: 102,
    title: '수영 완전 처음인데 물이 무서워요...',
    content: '어릴 때 물에 빠진 기억이 있어서 물 공포증이 있습니다. 서울 강서구 근처에서 기초 호흡법이랑 물에 뜨는 법부터 차근차근 알려주실 멘토님 계실까요? 헬스장은 다니는데 수영은 정말 자신이 없네요.',
    author: 'C형멘티',
    username: 'C형멘티',
    user_id: 102,
    dateText: '평일 저녁',
    placeText: '서울 강서구',
    location: '서울 강서구',
    region: '서울',
    category: '기타',
    stroke: '기타',
    role: '멘티',
    user_type: 'C형',
    intent: '질문',
    event: '기타',
    minutesAgo: 30,
    avatar: '🏊‍♀️',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    created_at: new Date(Date.now() - 30 * 60000).toISOString()
  },
  // 테스트용 예시 게시글 (C형 멘토)
  {
    id: 103,
    post_id: 103,
    title: '기초 발차기, 호흡법 전문입니다. (생존 수영)',
    content: '수영강사 자격증 있습니다. 서울 강서구에서 물 무서워하시는 분들, C형 입문자분들 환영합니다. 물 공포증 극복하고 생존 수영 마스터할 수 있게 천천히 도와드릴게요.',
    author: 'C형멘토',
    username: 'C형멘토',
    user_id: 103,
    dateText: '평일 저녁',
    placeText: '서울 강서구',
    location: '서울 강서구',
    region: '서울',
    category: '기타',
    stroke: '기타',
    role: '멘토',
    user_type: 'C형',
    intent: '조언자',
    event: '기타',
    minutesAgo: 40,
    avatar: '🏊',
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    created_at: new Date(Date.now() - 40 * 60000).toISOString()
  },
  // 테스트용 예시 게시글 (B형 멘티)
  {
    id: 104,
    post_id: 104,
    title: '부산 서면 쪽 배영 수영 친구 구해요!',
    content: '배영이 자꾸 가라앉는데... 기록은 상관없고 그냥 편하게 같이 수다 떨면서 수영하실 분 찾습니다! 자세 좀 봐주시면 더 좋고요. 끝나고 커피 한잔하실 분 환영합니다~',
    author: 'B형멘티',
    username: 'B형멘티',
    user_id: 104,
    dateText: '주말 오후',
    placeText: '부산 서면',
    location: '부산 서면',
    region: '부산',
    category: '배영',
    stroke: '배영',
    role: '멘티',
    user_type: 'B형',
    intent: '친구 찾기',
    event: '배영',
    minutesAgo: 50,
    avatar: '🏊‍♀️',
    createdAt: new Date(Date.now() - 50 * 60000).toISOString(),
    created_at: new Date(Date.now() - 50 * 60000).toISOString()
  },
  // 테스트용 예시 게시글 (B형 멘토)
  {
    id: 105,
    post_id: 105,
    title: '부산 서면/연산 배영 같이 하실 분? (B형 환영)',
    content: '저도 배영은 잘 못하지만... 그냥 즐겁게 같이 연습할 분 찾아요! 제가 아는 선에서 조금 알려드릴 수는 있습니다. 부담 없이 같이 운동하고 친해지실 분이면 좋겠어요.',
    author: 'B형멘토',
    username: 'B형멘토',
    user_id: 105,
    dateText: '주말 오후',
    placeText: '부산 서면',
    location: '부산 서면',
    region: '부산',
    category: '배영',
    stroke: '배영',
    role: '멘토',
    user_type: 'B형',
    intent: '조언자',
    event: '배영',
    minutesAgo: 60,
    avatar: '🏊‍♂️',
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    created_at: new Date(Date.now() - 60 * 60000).toISOString()
  },
  // 테스트용 예시 게시글 (기타 - 일상 공유)
  {
    id: 106,
    post_id: 106,
    title: '오늘 드디어 자유형 1000m 쉬지 않고 성공했네요!',
    content: '맨날 500m에서 퍼졌는데 오늘 드디어 1000m 완주했습니다. 샤워하고 나오는데 기분이 너무 좋네요. 역시 수영이 최고!',
    author: '일상공유',
    username: '일상공유',
    user_id: 106,
    dateText: '오늘',
    placeText: '전국',
    location: '전국',
    region: '전국',
    category: '자유형',
    stroke: '자유형',
    role: '기타',
    user_type: 'B형',
    intent: '일상 공유',
    event: '자유형',
    minutesAgo: 70,
    avatar: '🏊',
    createdAt: new Date(Date.now() - 70 * 60000).toISOString(),
    created_at: new Date(Date.now() - 70 * 60000).toISOString()
  }
];

let users = [];
let messages = [
  { id: 1, by: "other", text: "반갑습니다. 멘티 입니다.", time: "10:13 pm", timestamp: new Date().toISOString() }
];
// DM 메시지 저장소 (DB 구조: dm_id, sender_id, receiver_id, content, read, created_at)
let directMessages = [
  // 예시 데이터 (테스트용)
  {
    dm_id: 2,
    sender_id: 1,
    receiver_id: 2,
    content: '안녕하세요! 쪽지 테스트입니다.',
    read: false,
    created_at: '2025-10-23T14:01:47.290+09:00'
  },
  {
    dm_id: 3,
    sender_id: 1,
    receiver_id: 2,
    content: 'Postman에서 보낸 실시간 테스트 메시지',
    read: false,
    created_at: '2025-10-30T01:30:30.126+09:00'
  },
  {
    dm_id: 12,
    sender_id: 1,
    receiver_id: 2,
    content: 'Postman에서 보낸 실시간 테스트 메시지!',
    read: false,
    created_at: '2025-10-30T01:31:41.907+09:00'
  }
];

// 헬스 체크 (모든 요청 허용, 인증 불필요)
app.get('/api/health', (req, res) => {
  console.log('🏥 헬스 체크 요청 받음:', req.method, req.url, req.headers.origin || 'unknown');
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'unknown'
  });
});

// 인증 API
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // 간단한 인증 (실제로는 데이터베이스에서 확인)
  if (email && password) {
    const user = {
      id: '1',
      name: '테스트 사용자',
      email: email,
      username: email.split('@')[0] // 이메일에서 사용자명 추출
    };
    
    const token = 'mock-jwt-token-' + Date.now();
    
    res.json({
      token,
      user
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, username, password } = req.body;
  
  const user = {
    id: Date.now().toString(),
    name,
    email,
    username,
    createdAt: new Date().toISOString()
  };
  
  users.push(user);
  
  res.json({ message: 'User created successfully', user });
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, username, password } = req.body;
  
  const user = {
    id: Date.now().toString(),
    name,
    email,
    username,
    createdAt: new Date().toISOString()
  };
  
  users.push(user);
  
  res.json({ message: 'User created successfully', user });
});

// 게시글 API
app.get('/api/posts', (req, res) => {
  console.log('📋 게시글 목록 요청 - 총 게시글 수:', posts.length);
  console.log('📋 첫 번째 게시글 ID:', posts[0]?.id, '타입:', typeof posts[0]?.id);
  
  // 각 게시글에 user_id 추가 (없거나 문자열인 경우 숫자로 변환)
  const postsWithUserId = posts.map((post) => {
    let postUserId = post.user_id;
    if (typeof postUserId === 'string') {
      postUserId = !isNaN(Number(postUserId)) ? Number(postUserId) : 1; // 기본값 1
    }
    if (!postUserId || isNaN(postUserId)) {
      postUserId = 1; // 기본값 1
    }
    
    return {
      ...post,
      user_id: postUserId // user_id 필드 추가 또는 업데이트
    };
  });
  
  // 각 게시글의 일시 필드 확인
  postsWithUserId.forEach((post, index) => {
    console.log(`📋 게시글 ${index} 일시 필드:`, {
      'id': post.id || post.post_id,
      'title': post.title,
      'user_id': post.user_id,
      'event_datetime': post.event_datetime,
      'event_date': post.event_date,
      'event_start_time': post.event_start_time,
      'event_end_time': post.event_end_time,
      'created_at': post.created_at,
      'dateText': post.dateText
    });
  });
  
  res.json(postsWithUserId);
});

// 추천 게시글 API (베스트 게시글 조회)
app.get('/api/posts/recommend', (req, res) => {
  try {
    console.log('💡 추천 게시글 요청 (베스트 게시글)');
    console.log('💡 현재 posts 배열 길이:', posts?.length || 0);
    
    // posts 배열이 없거나 비어있는 경우 처리
    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      console.log('⚠️ 게시글이 없습니다. 빈 배열 반환');
      return res.json([]);
    }
    
    // 베스트 게시글 선정 기준:
    // 1. badge가 "BEST"인 게시글
    // 2. 최근 작성된 게시글 중 상위 3개
    // 3. 조회수가 높은 게시글 (있는 경우)
    
    const postsWithUserId = posts.map((post) => {
      try {
        let postUserId = post.user_id;
        if (typeof postUserId === 'string') {
          postUserId = !isNaN(Number(postUserId)) ? Number(postUserId) : 1;
        }
        if (!postUserId || isNaN(postUserId)) {
          postUserId = 1;
        }
        return {
          ...post,
          user_id: postUserId
        };
      } catch (err) {
        console.error('⚠️ 게시글 처리 중 에러:', err, post);
        return {
          ...post,
          user_id: 1
        };
      }
    });
    
    // 베스트 게시글 필터링 및 정렬
    let bestPosts = postsWithUserId.filter(post => {
      // badge가 "BEST"인 게시글 우선
      return post.badge === "BEST";
    });
    
    console.log(`💡 badge="BEST"인 게시글: ${bestPosts.length}개`);
    
    // BEST badge가 없는 경우, 최근 게시글 중 상위 3개
    if (bestPosts.length === 0) {
      console.log('💡 BEST badge가 없어서 최근 게시글 중 상위 3개 선택');
      bestPosts = [...postsWithUserId]
        .sort((a, b) => {
          try {
            // 최신순 정렬
            const dateA = new Date(a.created_at || a.event_datetime || 0);
            const dateB = new Date(b.created_at || b.event_datetime || 0);
            return dateB - dateA;
          } catch (err) {
            console.error('⚠️ 날짜 정렬 중 에러:', err, a, b);
            return 0;
          }
        })
        .slice(0, 3); // 상위 3개만
    } else {
      // BEST badge가 있는 경우, 최신순으로 정렬하고 최대 5개
      console.log('💡 BEST badge가 있는 게시글 최신순 정렬');
      bestPosts = bestPosts
        .sort((a, b) => {
          try {
            const dateA = new Date(a.created_at || a.event_datetime || 0);
            const dateB = new Date(b.created_at || b.event_datetime || 0);
            return dateB - dateA;
          } catch (err) {
            console.error('⚠️ 날짜 정렬 중 에러:', err, a, b);
            return 0;
          }
        })
        .slice(0, 5);
    }
    
    // 응답 데이터 정규화: id와 post_id를 정수형으로 변환
    const normalizedBestPosts = bestPosts.map(post => {
      const normalizedPost = {
        ...post,
        id: Number(post.id || post.post_id || 0),
        post_id: Number(post.post_id || post.id || 0),
        user_id: Number(post.user_id || 1)
      };
      return normalizedPost;
    });
    
    console.log(`💡 최종 베스트 게시글 ${normalizedBestPosts.length}개:`, normalizedBestPosts.map(p => ({
      id: p.id,
      post_id: p.post_id,
      idType: typeof p.id,
      postIdType: typeof p.post_id,
      title: p.title,
      badge: p.badge
    })));
    
    console.log(`💡 베스트 게시글 ${normalizedBestPosts.length}개 반환`);
    res.json(normalizedBestPosts);
  } catch (error) {
    console.error('❌ 베스트 게시글 조회 실패:', error);
    console.error('❌ 에러 스택:', error.stack);
    res.status(500).json({ 
      error: '베스트 게시글 조회 실패',
      message: error.message 
    });
  }
});

// 토큰 검증 미들웨어 (개발용 - 유연한 검증)
const verifyToken = (req, res, next) => {
  // /api/messages/dm 요청인 경우 특별 로깅
  if (req.path === '/api/messages/dm' || req.url === '/api/messages/dm' || req.originalUrl === '/api/messages/dm') {
    console.log('🔐 verifyToken 미들웨어 실행 (POST /api/messages/dm):', {
      path: req.path,
      url: req.url,
      originalUrl: req.originalUrl,
      method: req.method,
      baseUrl: req.baseUrl
    });
  }
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  // JWT 토큰에서 user_id 추출 (실제로는 JWT 디코딩 필요)
  // TODO: 실제 JWT 토큰 디코딩 로직 추가 필요
  let userId = 1; // 기본값
  let username = 'yeah';
  
  if (token) {
    try {
      // 간단한 토큰 파싱 (실제로는 jwt.verify 사용)
      // 여기서는 로컬 스토리지에서 가져온 사용자 정보를 확인
      // 임시로 토큰 길이 등으로 판단하거나, 나중에 JWT 라이브러리로 교체
    } catch (err) {
      console.error('토큰 파싱 실패:', err);
    }
  }
  
  // 개발용: 토큰이 없어도 통과 (실제 운영에서는 제거)
  if (!token) {
    console.log('⚠️ 토큰 없음 - 개발 모드에서 허용');
    req.user = { id: userId, userId: userId, username: username }; // 숫자 ID 사용
    
    // /api/messages/dm 요청인 경우 로그
    if (req.path === '/api/messages/dm' || req.url === '/api/messages/dm' || req.originalUrl === '/api/messages/dm') {
      console.log('✅ verifyToken: 토큰 없지만 next() 호출 (개발 모드)');
    }
    
    return next();
  }
  
  // 토큰이 있으면 검증
  if (token === 'test-token' || token.length > 5) {
    req.user = { id: userId, userId: userId, username: username };
    
    // /api/messages/dm 요청인 경우 로그
    if (req.path === '/api/messages/dm' || req.url === '/api/messages/dm' || req.originalUrl === '/api/messages/dm') {
      console.log('✅ verifyToken: 토큰 검증 통과, next() 호출');
    }
    
    next();
  } else {
    console.log('⚠️ 유효하지 않은 토큰 - 개발 모드에서 허용');
    req.user = { id: userId, userId: userId, username: username }; // 개발용으로 통과
    
    // /api/messages/dm 요청인 경우 로그
    if (req.path === '/api/messages/dm' || req.url === '/api/messages/dm' || req.originalUrl === '/api/messages/dm') {
      console.log('✅ verifyToken: 유효하지 않은 토큰이지만 next() 호출 (개발 모드)');
    }
    
    next();
  }
  
  // next() 호출 후 로그
  if (req.path === '/api/messages/dm' || req.url === '/api/messages/dm' || req.originalUrl === '/api/messages/dm') {
    console.log('✅ verifyToken 미들웨어 완료, next() 호출됨');
  }
};

// 게시글 내용 분석 함수 (role, user_type, event, location, intent 분류)
function classifyPost(title, content) {
  const fullText = `${title || ''} ${content || ''}`.toLowerCase();
  
  // 1. role 분류 (멘토/멘티/기타)
  let role = '기타';
  const menteeKeywords = ['구해요', '구합니다', '배우고', '알려주실', '멘티', '초보', '배울', '도움', '가르쳐주', '학습', '입문'];
  const mentorKeywords = ['알려드', '가르쳐', '멘토', '도와드', '레슨', '교실', '강습', '지도', '피드백', '조언'];
  
  const hasMenteeKeywords = menteeKeywords.some(keyword => fullText.includes(keyword));
  const hasMentorKeywords = mentorKeywords.some(keyword => fullText.includes(keyword));
  
  if (hasMenteeKeywords && !hasMentorKeywords) {
    role = '멘티';
  } else if (hasMentorKeywords && !hasMenteeKeywords) {
    role = '멘토';
  } else if (hasMenteeKeywords && hasMentorKeywords) {
    // 둘 다 있으면 문맥상 더 강한 쪽 선택
    role = fullText.includes('구해요') || fullText.includes('구합니다') ? '멘티' : '멘토';
  }
  
  // 2. user_type 분류 (A형/B형/C형)
  let user_type = 'B형'; // 기본값
  const typeAKeywords = ['대회', '기록', '자세 교정', '고급 기술', '기록 단축', '마스터즈', '스타트', '턴', '돌핀킥', '포인트 레슨', '전직 선수', '정체', '피드백', '영상 분석'];
  const typeCKeywords = ['처음', '무서워요', '기초', '발차기', '호흡법', '물 공포증', '물에 뜨는', '생존 수영', '입문자', '완전 처음', '자신이 없', '차근차근'];
  const typeBKeywords = ['편하게', '같이', '즐겁게', '수영 친구', '수다', '커피', '친해지', '부담 없이', '같이 운동', '일상 공유', '성공했네요', '기분이 너무 좋'];
  
  const typeAScore = typeAKeywords.filter(keyword => fullText.includes(keyword)).length;
  const typeCScore = typeCKeywords.filter(keyword => fullText.includes(keyword)).length;
  const typeBScore = typeBKeywords.filter(keyword => fullText.includes(keyword)).length;
  
  if (typeAScore > typeCScore && typeAScore > typeBScore) {
    user_type = 'A형';
  } else if (typeCScore > typeAScore && typeCScore > typeBScore) {
    user_type = 'C형';
  } else if (typeBScore > 0 || (typeAScore === 0 && typeCScore === 0)) {
    user_type = 'B형';
  }
  
  // 3. event 분류 (수영 종목)
  let event = '기타';
  if (fullText.includes('접영') || fullText.includes('버터플라이')) event = '접영';
  else if (fullText.includes('자유형') || fullText.includes('프리스타일')) event = '자유형';
  else if (fullText.includes('배영') || fullText.includes('백스트로크')) event = '배영';
  else if (fullText.includes('평영') || fullText.includes('브레스트')) event = '평영';
  else if (fullText.includes('혼영') || fullText.includes('개인혼영')) event = '혼영';
  
  // 4. location 분류
  let location = '전국';
  const locationMap = {
    '서울': ['서울', '강남', '강서구', '강남구'],
    '경기': ['경기', '수원', '기흥', '성남'],
    '부산': ['부산', '서면', '연산'],
    '대구': ['대구'],
    '인천': ['인천'],
    '광주': ['광주'],
    '대전': ['대전'],
    '울산': ['울산'],
    '세종': ['세종'],
    '강원': ['강원'],
    '충북': ['충북', '충남'],
    '전북': ['전북', '전남'],
    '경남': ['경남', '경북'],
    '제주': ['제주']
  };
  
  for (const [region, keywords] of Object.entries(locationMap)) {
    if (keywords.some(keyword => fullText.includes(keyword))) {
      location = region;
      break;
    }
  }
  
  // 5. intent 분류
  let intent = '일상 공유';
  if (role === '멘티') {
    if (fullText.includes('질문') || fullText.includes('물어보')) intent = '질문';
    else if (fullText.includes('구해요') || fullText.includes('구합니다')) intent = '팁 요청';
    else if (fullText.includes('친구') || fullText.includes('같이')) intent = '친구 찾기';
  } else if (role === '멘토') {
    intent = '조언자';
  }
  
  return {
    role,
    user_type,
    event,
    location,
    intent
  };
}

// GPT 분류 API (임시 구현)
app.post('/api/posts/classify', verifyToken, (req, res) => {
  console.log('🤖 GPT 분류 요청:', req.body);
  
  try {
    const { title, content } = req.body;
    const classification = classifyPost(title, content);
    
    console.log('✅ GPT 분류 결과:', classification);
    res.json(classification);
    
  } catch (error) {
    console.error('❌ GPT 분류 실패:', error);
    res.status(500).json({ error: 'GPT 분류에 실패했습니다.' });
  }
});

// 게시글 생성 API
app.post('/api/posts', verifyToken, (req, res) => {
  console.log('📝 게시글 생성 요청:', req.body);
  
  try {
    const { date, startTime, endTime, title, content, stroke, region, author, placeText, dateText, minutesAgo, avatar, event_datetime, event_date, event_start_time, event_end_time } = req.body;
    
    console.log('📅 날짜/시간 필드:', { 
      date, 
      startTime,
      endTime,
      event_date, 
      event_start_time,
      event_end_time,
      event_datetime 
    });
    
    // 필수 필드 검증
    if (!title || !content) {
      return res.status(400).json({ error: '제목과 내용은 필수입니다.' });
    }
    
    // 사용자가 선택한 날짜/시간 우선 사용 (event_date/event_start_time > date/startTime)
    const selectedDate = event_date || date;
    const selectedStartTime = event_start_time || startTime;
    const selectedEndTime = event_end_time || endTime;
    
    // event_datetime 생성: 우선순위 1) 전달된 event_datetime, 2) event_date+event_start_time, 3) date+startTime
    let finalEventDateTime;
    if (event_datetime && typeof event_datetime === 'string' && event_datetime.trim() !== '') {
      finalEventDateTime = event_datetime;
      console.log('✅ 전달된 event_datetime 사용:', finalEventDateTime);
    } else if (selectedDate && selectedStartTime) {
      try {
        // 시간 형식 정규화 (HH:mm 형식으로 변환)
        const normalizedTime = selectedStartTime.includes(':') ? selectedStartTime : `${selectedStartTime.slice(0, 2)}:${selectedStartTime.slice(2)}`;
        const isoString = `${selectedDate}T${normalizedTime}:00`;
        finalEventDateTime = new Date(isoString).toISOString();
        console.log('✅ event_date/event_start_time으로 event_datetime 생성:', {
          'selectedDate': selectedDate,
          'selectedStartTime': selectedStartTime,
          'normalizedTime': normalizedTime,
          'isoString': isoString,
          'finalEventDateTime': finalEventDateTime
        });
      } catch (err) {
        console.error('❌ event_datetime 생성 실패:', err);
        console.error('❌ 생성 시도한 값:', { selectedDate, selectedStartTime });
        finalEventDateTime = undefined;
      }
    } else {
      console.warn('⚠️ event_datetime 생성 불가: selectedDate 또는 selectedStartTime이 없음', {
        selectedDate,
        selectedStartTime,
        event_date,
        event_start_time,
        date,
        startTime
      });
    }
    
    // 현재 로그인한 사용자 ID 가져오기 (우선순위: 요청 본문 > req.user > 기본값)
    let currentUserId = req.body.user_id || req.body.userId || req.user?.id || req.user?.userId;
    
    // 문자열인 경우 숫자로 변환
    if (typeof currentUserId === 'string') {
      currentUserId = !isNaN(Number(currentUserId)) ? Number(currentUserId) : 1;
    }
    
    // 숫자가 아니면 기본값 1 사용
    if (!currentUserId || isNaN(currentUserId)) {
      currentUserId = 1;
    }
    
    console.log('👤 현재 사용자 정보:', { 
      body_user_id: req.body.user_id,
      body_userId: req.body.userId,
      req_user: req.user, 
      currentUserId,
      userIdType: typeof currentUserId 
    });
    
    // 게시글 내용 분석 (role, user_type, event, location, intent)
    const classification = classifyPost(title, content);
    console.log('🤖 게시글 자동 분류 결과:', classification);
    
    // 새 게시글 생성
    const postIdNumber = Number(Date.now()); // 정수형으로 명확히 변환
    const newPost = {
      id: postIdNumber,
      post_id: postIdNumber, // post_id도 정수형으로 설정
      title,
      content,
      author: author || 'yeah(남성)',
      username: author || 'yeah(남성)', // username도 추가
      user_id: currentUserId, // 작성자 ID (숫자, 필수)
      dateText: dateText || `${selectedDate} ${selectedStartTime}${selectedEndTime ? ` - ${selectedEndTime}` : ''}`,
      placeText: placeText || '기흥역 근처',
      location: placeText || region || classification.location || '기흥역 근처', // location 추가
      region: region || classification.location || '기타',
      category: stroke || classification.event || '기타', // category 추가
      stroke: stroke || classification.event || '기타',
      // 분류 정보 추가
      role: classification.role,
      user_type: classification.user_type,
      intent: classification.intent,
      // 사용자가 선택한 날짜/시간 정보 저장
      date: selectedDate,
      startTime: selectedStartTime,
      endTime: selectedEndTime,
      event_date: selectedDate, // 백엔드 필드명 (YYYY-MM-DD)
      event_start_time: selectedStartTime, // 백엔드 필드명 (HH:mm)
      event_end_time: selectedEndTime, // 백엔드 필드명 (HH:mm, 선택사항)
      event_datetime: finalEventDateTime, // ISO 형식 일시
      created_at: new Date().toISOString(), // created_at도 추가
      minutesAgo: minutesAgo || 0,
      avatar: avatar || '🧑🏻‍🎨',
      createdAt: new Date().toISOString(),
      editedAt: new Date().toISOString()
    };
    
    console.log('✅ 게시글 생성 - user_id 포함:', {
      user_id: newPost.user_id,
      userIdType: typeof newPost.user_id
    });
    
    // 게시글 추가
  posts.unshift(newPost);
    
    console.log('✅ 게시글 생성 성공:', {
      id: newPost.id,
      post_id: newPost.post_id,
      idType: typeof newPost.id,
      postIdType: typeof newPost.post_id,
      title: newPost.title,
      event_date: newPost.event_date,
      event_start_time: newPost.event_start_time,
      event_end_time: newPost.event_end_time,
      event_datetime: newPost.event_datetime,
      created_at: newPost.created_at
    });
    res.status(201).json(newPost);
    
  } catch (error) {
    console.error('❌ 게시글 생성 실패:', error);
    res.status(500).json({ error: '게시글 생성에 실패했습니다.' });
  }
});

// 추천 게시글 API (특정 게시글과 매칭되는 추천 게시글)
app.get('/api/posts/:id/recommend', (req, res) => {
  try {
    const postId = Number(req.params.id); // 정수형으로 명확히 변환
    console.log('💡 추천 게시글 요청:', { 
      postId, 
      postIdType: typeof postId,
      rawParam: req.params.id,
      rawParamType: typeof req.params.id
    });
    
    // postId가 유효한 숫자인지 확인
    if (isNaN(postId) || postId <= 0) {
      console.error('❌ 잘못된 postId:', req.params.id);
      return res.status(400).json({ error: '잘못된 게시글 ID입니다.' });
    }
    
    // 해당 게시글 찾기 (정수형으로 비교)
    const targetPost = posts.find(p => {
      const pId = Number(p.id || 0);
      const pPostId = Number(p.post_id || 0);
      return pId === postId || pPostId === postId;
    });
    
    if (!targetPost) {
      console.log('❌ 게시글을 찾을 수 없음:', postId);
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }
    
    console.log('📋 대상 게시글:', {
      id: targetPost.id || targetPost.post_id,
      title: targetPost.title,
      content: targetPost.content?.substring(0, 50) + '...',
      category: targetPost.category || targetPost.stroke,
      region: targetPost.region || targetPost.location
    });
    
    // 추천 게시글 선정 로직 (GPT 분류 기반):
    // 1. GPT로 분류된 category/stroke가 같은 게시글 중에서
    // 2. 같은 region을 가진 게시글 우선
    // 3. 멘티-멘토 매칭 (작성한 글이 멘티면 멘토 글 추천, 멘토면 멘티 글 추천)
    // 4. 자기 자신은 제외
    // 5. 최신순으로 정렬하여 상위 3개 반환
    
    const targetCategory = targetPost.category || targetPost.stroke || '';
    const targetRegion = targetPost.region || targetPost.location || '';
    
    // 작성한 게시글의 분류 정보 가져오기 (저장된 정보가 있으면 사용, 없으면 분석)
    let targetClassification = {
      role: targetPost.role,
      user_type: targetPost.user_type,
      event: targetPost.event || targetCategory,
      location: targetPost.location || targetRegion,
      intent: targetPost.intent
    };
    
    // 분류 정보가 없으면 새로 분석
    if (!targetClassification.role || !targetClassification.user_type) {
      targetClassification = classifyPost(targetPost.title, targetPost.content);
      console.log('🤖 대상 게시글 새로 분류:', targetClassification);
    }
    
    const targetRole = targetClassification.role;
    const targetUserType = targetClassification.user_type;
    const isMentee = targetRole === '멘티';
    const isMentor = targetRole === '멘토';
    
    console.log('🔍 게시글 분석:', {
      role: targetRole,
      user_type: targetUserType,
      isMentee,
      isMentor,
      targetCategory,
      targetRegion,
      intent: targetClassification.intent
    });
    
    let recommendedPosts = posts.filter(post => {
      // 자기 자신 제외 (정수형으로 비교)
      const postIdNum = Number(post.id || 0);
      const postPostIdNum = Number(post.post_id || 0);
      if (postIdNum === postId || postPostIdNum === postId) {
        return false;
      }
      
      // GPT로 분류된 같은 category를 가진 게시글
      const postCategory = post.category || post.stroke || '';
      
      // category가 JSON 문자열인 경우 파싱 (예: "{\"자유형\",\"평영\"}")
      let postCategories = [];
      try {
        if (postCategory.startsWith('{') && postCategory.includes(',')) {
          // JSON 배열 형태로 파싱 시도
          const parsed = JSON.parse(postCategory);
          postCategories = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          postCategories = [postCategory];
        }
      } catch (e) {
        postCategories = [postCategory];
      }
      
      // targetCategory와 매칭되는지 확인
      const categoryMatch = postCategories.includes(targetCategory) || 
                           targetCategory === '' || 
                           postCategory === '' ||
                           postCategory === targetCategory;
      
      // 추천 게시글의 분류 정보 가져오기 (저장된 정보가 있으면 사용, 없으면 분석)
      let postClassification = {
        role: post.role,
        user_type: post.user_type,
        event: post.event || postCategory,
        location: post.location || (post.region || ''),
        intent: post.intent
      };
      
      // 분류 정보가 없으면 새로 분석
      if (!postClassification.role || !postClassification.user_type) {
        postClassification = classifyPost(post.title, post.content);
      }
      
      const postRole = postClassification.role;
      const postUserType = postClassification.user_type;
      const postIsMentee = postRole === '멘티';
      const postIsMentor = postRole === '멘토';
      
      // 1. role 매칭: 멘티면 멘토 글 추천, 멘토면 멘티 글 추천
      // 기타(일상 공유)는 추천에서 제외
      let roleMatch = false;
      if (targetRole === '기타' || postRole === '기타') {
        roleMatch = false; // 일상 공유는 추천하지 않음
      } else if (isMentee && postIsMentor) {
        roleMatch = true; // 멘티가 작성했고 멘토 글은 추천
      } else if (isMentor && postIsMentee) {
        roleMatch = true; // 멘토가 작성했고 멘티 글은 추천
      } else {
        roleMatch = false; // 같은 역할이면 추천하지 않음
      }
      
      // 2. user_type 매칭: 같은 user_type끼리 매칭 (A형 멘티 → A형 멘토)
      const userTypeMatch = targetUserType === postUserType;
      
      // 3. event 매칭: 같은 수영 종목이면 우선
      const eventMatch = targetClassification.event === postClassification.event || 
                        targetCategory === postCategory ||
                        targetCategory === '' || postCategory === '';
      
      // 최종 매칭 조건: role 매칭 + (user_type 매칭 우선, 없으면 event 매칭)
      const finalMatch = roleMatch && (userTypeMatch || eventMatch);
      
      if (finalMatch) {
        console.log(`✅ 매칭된 게시글:`, {
          postId: post.id || post.post_id,
          title: post.title?.substring(0, 30),
          targetRole,
          targetUserType,
          postRole,
          postUserType,
          roleMatch,
          userTypeMatch,
          eventMatch
        });
      }
      
      return finalMatch;
    });
    
    console.log(`💡 필터링 후 후보 게시글: ${recommendedPosts.length}개`);
    
    // 같은 region을 가진 게시글 우선 정렬
    recommendedPosts.sort((a, b) => {
      const aRegion = a.region || a.location || '';
      const bRegion = b.region || b.location || '';
      
      // 같은 region이면 우선순위 높음
      if (aRegion === targetRegion && bRegion !== targetRegion) return -1;
      if (aRegion !== targetRegion && bRegion === targetRegion) return 1;
      
      // 최신순 정렬
      const dateA = new Date(a.created_at || a.event_datetime || 0);
      const dateB = new Date(b.created_at || b.event_datetime || 0);
      return dateB - dateA;
    });
    
    // 추천 게시글 개수 설정 (백엔드에서 결정)
    const RECOMMENDED_POSTS_COUNT = 3; // 추천 게시글은 3개로 고정
    recommendedPosts = recommendedPosts.slice(0, RECOMMENDED_POSTS_COUNT);
    
    console.log(`💡 추천 게시글 개수 설정: ${RECOMMENDED_POSTS_COUNT}개`);
    
    // 응답 데이터 정규화: id와 post_id를 정수형으로 변환
    const normalizedRecommendedPosts = recommendedPosts.map(post => {
      return {
        ...post,
        id: Number(post.id || post.post_id || 0),
        post_id: Number(post.post_id || post.id || 0),
        user_id: Number(post.user_id || 1)
      };
    });
    
    console.log(`💡 추천 게시글 ${normalizedRecommendedPosts.length}개 반환:`, normalizedRecommendedPosts.map(p => ({
      id: p.id,
      post_id: p.post_id,
      idType: typeof p.id,
      postIdType: typeof p.post_id,
      title: p.title,
      category: p.category || p.stroke,
      region: p.region || p.location
    })));
    
    res.json(normalizedRecommendedPosts);
  } catch (error) {
    console.error('❌ 추천 게시글 조회 실패:', error);
    res.status(500).json({ error: '추천 게시글 조회 실패' });
  }
});

app.get('/api/posts/:id', (req, res) => {
  console.log('🔍 게시글 상세 조회 요청:', req.params.id, '타입:', typeof req.params.id);
  
  // ID를 정수형으로 변환하여 비교 (id 또는 post_id 모두 지원)
  const postId = parseInt(req.params.id);
  const post = posts.find(p => p.id === postId || p.post_id === postId);
  
  console.log('📋 찾은 게시글:', post ? '찾음' : '없음');
  
  if (post) {
    // user_id가 없거나 문자열인 경우 숫자로 변환하여 추가
    let postUserId = post.user_id;
    if (typeof postUserId === 'string') {
      postUserId = !isNaN(Number(postUserId)) ? Number(postUserId) : 1; // 기본값 1
    }
    if (!postUserId || isNaN(postUserId)) {
      postUserId = 1; // 기본값 1
    }

    const responsePost = {
      ...post,
      user_id: postUserId // user_id 필드 추가 또는 업데이트
    };

    // 응답 데이터의 일시 필드 확인
    console.log('📅 게시글 상세 응답 - 일시 필드:', {
      'id': responsePost.id || responsePost.post_id,
      'title': responsePost.title,
      'event_datetime': responsePost.event_datetime,
      'event_date': responsePost.event_date,
      'event_start_time': responsePost.event_start_time,
      'event_end_time': responsePost.event_end_time,
      'created_at': responsePost.created_at,
      'dateText': responsePost.dateText,
      'date': responsePost.date,
      'startTime': responsePost.startTime,
      'endTime': responsePost.endTime
    });
    console.log('📅 게시글 상세 응답 - user_id 포함:', {
      user_id: responsePost.user_id,
      userIdType: typeof responsePost.user_id,
      original_user_id: post.user_id,
      original_userIdType: typeof post.user_id
    });
    console.log('📅 게시글 상세 응답 - 전체 객체 키:', Object.keys(responsePost));
    res.json(responsePost);
  } else {
    console.error('❌ 게시글을 찾을 수 없음:', postId);
    res.status(404).json({ error: 'Post not found' });
  }
});

app.put('/api/posts/:id', (req, res) => {
  console.log('✏️ 게시글 수정 요청:', req.params.id, '타입:', typeof req.params.id);
  console.log('📝 수정 데이터:', JSON.stringify(req.body, null, 2));
  console.log('📋 요청 헤더:', req.headers);
  
  try {
    // ID를 정수형으로 변환하여 비교 (id 또는 post_id 모두 지원)
    const postId = parseInt(req.params.id);
    console.log('🔍 변환된 ID:', postId, '타입:', typeof postId);
    
    if (isNaN(postId)) {
      console.error('❌ 유효하지 않은 ID:', req.params.id);
      return res.status(400).json({ error: 'Invalid post ID' });
    }
    
    console.log('📋 현재 posts 배열:', posts.map(p => ({ 
      id: p.id, 
      post_id: p.post_id,
      title: p.title 
    })));
    
    // id 또는 post_id로 찾기 (둘 다 지원)
    const index = posts.findIndex(p => p.id === postId || p.post_id === postId);
    console.log('🔍 찾은 인덱스:', index);
  
  if (index !== -1) {
    const existingPost = posts[index];
    
    // 작성자 권한 확인
    const token = req.headers.authorization?.replace('Bearer ', '');
    let currentUserId = null;
    
    // JWT 토큰에서 userId 추출 시도
    if (token) {
      try {
        // 간단한 토큰 파싱 (실제로는 JWT 디코딩 필요)
        // 여기서는 요청 body나 헤더에서 userId를 가져오거나, 토큰에서 추출
        // 임시로 req.body.userId 또는 req.headers['x-user-id'] 사용
        currentUserId = req.body.userId || req.headers['x-user-id'] || null;
      } catch (err) {
        console.error('토큰 파싱 실패:', err);
      }
    }
    
    // sessionStorage/localStorage에서 userId를 가져올 수 없으므로
    // 프론트엔드에서 요청 시 userId를 포함하도록 하거나,
    // verifyToken 미들웨어를 사용하여 req.user에서 가져오기
    // 임시로 게시글의 user_id와 비교 (프론트엔드에서 이미 체크했지만 백엔드에서도 확인)
    const postUserId = existingPost.user_id || existingPost.userId || existingPost.author_id;
    
    // 프론트엔드에서 userId를 body에 포함시켰는지 확인
    const requestUserId = req.body.currentUserId || req.body.userId || currentUserId;
    
    if (requestUserId && postUserId) {
      const numericPostUserId = Number(postUserId);
      const numericRequestUserId = Number(requestUserId);
      
      console.log('🔍 백엔드 작성자 권한 확인:', {
        postUserId,
        requestUserId,
        numericPostUserId,
        numericRequestUserId,
        isAuthor: String(numericPostUserId) === String(numericRequestUserId)
      });
      
      if (String(numericPostUserId) !== String(numericRequestUserId)) {
        console.error('❌ 작성자가 아닙니다. 수정 권한이 없습니다.');
        return res.status(403).json({ error: '본인이 작성한 게시글만 수정할 수 있습니다.' });
      }
    } else {
      console.warn('⚠️ userId 정보가 없어 권한 체크를 건너뜁니다. (개발 모드)');
    }
    
    // 사용자가 선택한 날짜/시간 우선 사용 (event_date/event_start_time > date/startTime)
    const selectedDate = req.body.event_date || req.body.date;
    const selectedStartTime = req.body.event_start_time || req.body.startTime;
    const selectedEndTime = req.body.event_end_time || req.body.endTime;
    
    console.log('📅 날짜/시간 필드:', { 
      'req.body.event_date': req.body.event_date,
      'req.body.event_start_time': req.body.event_start_time,
      'req.body.event_end_time': req.body.event_end_time,
      'req.body.date': req.body.date,
      'req.body.startTime': req.body.startTime,
      'req.body.endTime': req.body.endTime,
      'selectedDate': selectedDate,
      'selectedStartTime': selectedStartTime,
      'selectedEndTime': selectedEndTime
    });
    
    // event_datetime 처리: 우선순위 1) 전달된 event_datetime, 2) event_date+event_start_time, 3) date+startTime, 4) 기존 값
    let newEventDateTime = existingPost.event_datetime; // 기본값: 기존 값 유지
    
    if (req.body.event_datetime && typeof req.body.event_datetime === 'string' && req.body.event_datetime.trim() !== '') {
      // 요청에 유효한 event_datetime이 있으면 사용
      newEventDateTime = req.body.event_datetime;
      console.log('📅 요청 body의 event_datetime 사용:', newEventDateTime);
    } else if (selectedDate && selectedStartTime) {
      // event_date/event_start_time 또는 date/startTime이 있으면 event_datetime 생성
      try {
        newEventDateTime = new Date(`${selectedDate}T${selectedStartTime}:00`).toISOString();
        console.log('📅 event_date/event_start_time 또는 date/startTime으로 event_datetime 생성:', newEventDateTime);
      } catch (err) {
        console.error('❌ event_datetime 생성 실패:', err);
        // 생성 실패 시 기존 값 유지
      }
    }
    
    console.log('📅 최종 event_datetime:', {
      'req.body.event_datetime': req.body.event_datetime,
      'req.body.event_date': req.body.event_date,
      'req.body.event_start_time': req.body.event_start_time,
      'req.body.event_end_time': req.body.event_end_time,
      'req.body.date': req.body.date,
      'req.body.startTime': req.body.startTime,
      '기존 event_datetime': existingPost.event_datetime,
      '최종 newEventDateTime': newEventDateTime
    });
    
    // req.body에서 event_datetime을 제거하고 나머지만 가져오기 (명시적으로 설정할 것이므로)
    const { event_datetime: _, ...bodyWithoutEventDatetime } = req.body;
    
    const updatedPost = { 
      ...existingPost, 
      ...bodyWithoutEventDatetime, 
      id: existingPost.id ?? postId, // 기존 id 유지 또는 새 id
      post_id: existingPost.post_id ?? postId, // post_id도 보장
      // 사용자가 선택한 날짜/시간 정보 업데이트
      date: selectedDate || existingPost.date,
      startTime: selectedStartTime || existingPost.startTime,
      endTime: selectedEndTime || existingPost.endTime,
      event_date: selectedDate || existingPost.event_date, // 백엔드 필드명 (YYYY-MM-DD)
      event_start_time: selectedStartTime || existingPost.event_start_time, // 백엔드 필드명 (HH:mm)
      event_end_time: selectedEndTime || existingPost.event_end_time, // 백엔드 필드명 (HH:mm, 선택사항)
      // event_datetime 명시적으로 설정 (항상 값이 있음)
      event_datetime: newEventDateTime,
      // category와 location도 업데이트 (요청에 있으면 사용)
      category: req.body.category || req.body.stroke || existingPost.category || existingPost.stroke,
      stroke: req.body.stroke || req.body.category || existingPost.stroke || existingPost.category,
      location: req.body.location || req.body.region || existingPost.location || existingPost.region,
      region: req.body.region || req.body.location || existingPost.region || existingPost.location,
      // dateText와 placeText도 업데이트
      dateText: req.body.dateText || existingPost.dateText,
      placeText: req.body.placeText || existingPost.placeText,
      created_at: existingPost.created_at, // created_at은 변경하지 않음
      editedAt: new Date().toISOString() 
    };
    posts[index] = updatedPost;
    console.log('✅ 게시글 수정 성공:', { 
      id: updatedPost.id, 
      post_id: updatedPost.post_id, 
      event_datetime: updatedPost.event_datetime,
      created_at: updatedPost.created_at,
      '수정된 제목': updatedPost.title
    });
    res.json(updatedPost);
  } else {
    console.error('❌ 게시글을 찾을 수 없음:', postId);
    res.status(404).json({ error: 'Post not found' });
  }
  } catch (error) {
    console.error('❌ 게시글 수정 중 오류 발생:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.delete('/api/posts/:id', (req, res) => {
  console.log('🗑️ 게시글 삭제 요청:', req.params.id, '타입:', typeof req.params.id);
  console.log('📝 삭제 요청 데이터:', JSON.stringify(req.body, null, 2));
  console.log('📋 요청 헤더:', req.headers);
  
  try {
    // ID를 정수형으로 변환하여 비교 (id 또는 post_id 모두 지원)
    const postId = parseInt(req.params.id);
    console.log('🔍 변환된 ID:', postId, '타입:', typeof postId);
    
    if (isNaN(postId)) {
      console.error('❌ 유효하지 않은 ID:', req.params.id);
      return res.status(400).json({ error: 'Invalid post ID' });
    }
    
    console.log('📋 현재 posts 배열:', posts.map(p => ({ 
      id: p.id, 
      post_id: p.post_id,
      title: p.title 
    })));
    
    // id 또는 post_id로 찾기 (둘 다 지원)
    const index = posts.findIndex(p => p.id === postId || p.post_id === postId);
    console.log('🔍 찾은 인덱스:', index);
    
  if (index !== -1) {
      const deletedPost = posts[index];
      
      // 작성자 권한 확인
      const token = req.headers.authorization?.replace('Bearer ', '');
      let currentUserId = null;
      
      // JWT 토큰에서 userId 추출 시도
      if (token) {
        try {
          // 간단한 토큰 파싱 (실제로는 JWT 디코딩 필요)
          currentUserId = req.body?.userId || req.body?.currentUserId || req.headers['x-user-id'] || null;
        } catch (err) {
          console.error('토큰 파싱 실패:', err);
        }
      }
      
      const postUserId = deletedPost.user_id || deletedPost.userId || deletedPost.author_id;
      const requestUserId = req.body?.currentUserId || req.body?.userId || currentUserId;
      
      if (requestUserId && postUserId) {
        const numericPostUserId = Number(postUserId);
        const numericRequestUserId = Number(requestUserId);
        
        console.log('🔍 백엔드 삭제 권한 확인:', {
          postUserId,
          requestUserId,
          numericPostUserId,
          numericRequestUserId,
          isAuthor: String(numericPostUserId) === String(numericRequestUserId)
        });
        
        if (String(numericPostUserId) !== String(numericRequestUserId)) {
          console.error('❌ 작성자가 아닙니다. 삭제 권한이 없습니다.');
          return res.status(403).json({ error: '본인이 작성한 게시글만 삭제할 수 있습니다.' });
        }
      } else {
        console.warn('⚠️ userId 정보가 없어 권한 체크를 건너뜁니다. (개발 모드)');
      }
      
    posts.splice(index, 1);
      console.log('✅ 게시글 삭제 성공:', { id: deletedPost.id, post_id: deletedPost.post_id });
      res.json({ message: 'Post deleted successfully', deletedId: postId });
  } else {
      console.error('❌ 게시글을 찾을 수 없음:', postId);
    res.status(404).json({ error: 'Post not found' });
    }
  } catch (error) {
    console.error('❌ 게시글 삭제 중 오류 발생:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.get('/api/posts/search', (req, res) => {
  const query = req.query.q || '';
  const filteredPosts = posts.filter(post => 
    post.title.includes(query) || 
    post.content.includes(query) ||
    post.region.includes(query)
  );
  res.json(filteredPosts);
});

// 채팅 API
app.get('/api/chat/rooms', (req, res) => {
  res.json([{ id: 'default', name: '기본 채팅방' }]);
});

app.get('/api/chat/:chatId/messages', (req, res) => {
  res.json(messages);
});

app.get('/api/chat', (req, res) => {
  res.json(messages);
});

app.post('/api/chat/:chatId/messages', (req, res) => {
  const newMessage = {
    id: Date.now(),
    ...req.body,
    timestamp: new Date().toISOString()
  };
  messages.push(newMessage);
  res.json(newMessage);
});

app.post('/api/chat', (req, res) => {
  const newMessage = {
    id: Date.now(),
    ...req.body,
    timestamp: new Date().toISOString()
  };
  messages.push(newMessage);
  res.json(newMessage);
});

// WebSocket DM 메시지 저장 API (POST /api/messages/dm)
// ⚠️ 중요: Express는 라우트를 정의한 순서대로 평가하므로, 
// 더 구체적인 경로(/api/messages/dm)를 일반적인 경로(/api/messages)보다 먼저 정의해야 함
// ⚠️ 더블 체크: 이 라우트는 /api/messages/:userId 보다 먼저 정의되어 있어야 함!
app.post('/api/messages/dm', verifyToken, (req, res) => {
  console.log('✅✅✅ /api/messages/dm 엔드포인트 도착! (POST)');
  console.log('✅✅✅ 요청이 성공적으로 라우팅됨!');
  console.log('💌 WebSocket DM 메시지 저장 요청:', req.body);
  console.log('💌 req.user:', req.user);
  console.log('💌 req.headers:', {
    'authorization': req.headers.authorization ? 'present' : 'missing',
    'content-type': req.headers['content-type']
  });
  
  try {
    let { sender_id, receiver_id, content, dm_id } = req.body;
    
    // 필수 필드 검증
    if (!sender_id || !receiver_id || !content) {
      console.error('❌ 필수 필드 누락:', { sender_id, receiver_id, content: !!content });
      return res.status(400).json({ error: '필수 필드가 누락되었습니다. (sender_id, receiver_id, content)' });
    }
    
    // 숫자로 변환
    let senderId = Number(sender_id);
    let receiverId = Number(receiver_id);
    
    // sender_id가 없거나 0이면 현재 사용자 ID 사용
    if (!senderId || senderId === 0 || isNaN(senderId)) {
      senderId = req.user?.id || req.user?.userId || 1;
      if (typeof senderId === 'string') {
        senderId = !isNaN(Number(senderId)) ? Number(senderId) : 1;
      }
      console.log('⚠️ sender_id 없음, 현재 사용자 ID 사용:', senderId);
    }
    
    if (!receiverId || receiverId === 0 || isNaN(receiverId)) {
      console.error('❌ receiver_id가 유효하지 않음:', receiver_id);
      return res.status(400).json({ error: 'receiver_id는 숫자여야 합니다.' });
    }
    
    // 새 메시지 생성 (DB 구조에 맞춤)
    const newMessage = {
      dm_id: dm_id || Date.now(),
      sender_id: senderId,
      receiver_id: receiverId,
      content: String(content).trim(),
      read: false,
      created_at: new Date().toISOString()
    };
    
    // 중복 체크 (같은 dm_id가 있으면 업데이트하지 않음)
    const existingIndex = directMessages.findIndex(msg => msg.dm_id === newMessage.dm_id);
    if (existingIndex === -1) {
      directMessages.push(newMessage);
      console.log('✅ DM 메시지 저장 성공:', {
        dm_id: newMessage.dm_id,
        sender_id: newMessage.sender_id,
        receiver_id: newMessage.receiver_id,
        content: newMessage.content.substring(0, 50) + '...',
        totalMessages: directMessages.length,
        allDmIds: directMessages.map(m => m.dm_id)
      });
    } else {
      console.log('⚠️ DM 메시지 중복 (이미 존재):', {
        dm_id: newMessage.dm_id,
        existing: directMessages[existingIndex]
      });
      // 이미 존재하지만 성공 응답 반환
    }
    
    res.status(201).json(newMessage);
    
  } catch (error) {
    console.error('❌ DM 메시지 저장 실패:', error);
    console.error('❌ 에러 스택:', error.stack);
    res.status(500).json({ error: 'DM 메시지 저장에 실패했습니다.' });
  }
});

// 쪽지 API (POST /api/messages) - 레거시 (호환성 유지)
// ⚠️ 주의: /api/messages/dm 보다 뒤에 위치 (더 구체적인 경로가 먼저)
app.post('/api/messages', (req, res) => {
  console.log('💌 쪽지 전송 요청 (레거시):', req.body);
  
  try {
    const { postId, authorId, message, timestamp } = req.body;
    
    if (!postId || !authorId || !message) {
      return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
    }
    
    const newMessage = {
      id: Date.now().toString(),
      postId,
      authorId,
      message,
      sender: 'current_user', // 현재 사용자
      timestamp: timestamp || new Date().toISOString(),
      read: false
    };
    
    directMessages.push(newMessage);
    
    console.log('✅ 쪽지 전송 성공:', newMessage.id);
    res.status(201).json(newMessage);
    
  } catch (error) {
    console.error('❌ 쪽지 전송 실패:', error);
    res.status(500).json({ error: '쪽지 전송에 실패했습니다.' });
  }
});

// 쪽지 목록 조회 API
app.get('/api/messages', (req, res) => {
  console.log('📬 쪽지 목록 조회 요청');
  res.json(directMessages);
});

// 특정 사용자의 쪽지 조회 API (레거시 - /api/messages/:userId)
// 주의: 이 라우트는 구체적인 라우트(/api/messages/conversations, /api/messages/dm, /api/messages/with/:otherUserId) 보다 뒤에 위치해야 함
app.get('/api/messages/:userId', (req, res) => {
  const { userId } = req.params;
  
  console.log('🔍 GET /api/messages/:userId 호출:', { userId });
  
  // /api/messages/conversations나 /api/messages/dm, /api/messages/with와 충돌하지 않도록 체크
  if (userId === 'conversations' || userId === 'dm' || userId === 'with') {
    console.warn('⚠️ 특수 경로와 충돌:', userId);
    return res.status(404).json({ error: 'Not found' });
  }
  
  // POST 메서드도 체크
  if (req.method === 'POST' && userId === 'dm') {
    console.warn('⚠️ POST /api/messages/dm이 /api/messages/:userId로 매칭됨 - 이것은 문제입니다!');
    return res.status(404).json({ error: 'Use /api/messages/dm directly' });
  }
  
  const userMessages = directMessages.filter(msg => 
    msg.authorId === userId || msg.sender === userId
  );
  res.json(userMessages);
});

// 대화 상대 목록 조회 API (GET /api/messages/conversations)
// 주의: 구체적인 라우트는 동적 라우트(:userId)보다 먼저 정의해야 함
app.get('/api/messages/conversations', verifyToken, (req, res) => {
  console.log('💬 대화 상대 목록 조회 요청');
  console.log('💬 req.user:', req.user);
  
  try {
    let currentUserId = req.user?.id || req.user?.userId || 1;
    
    // 문자열인 경우 숫자로 변환
    if (typeof currentUserId === 'string') {
      currentUserId = !isNaN(Number(currentUserId)) ? Number(currentUserId) : 1;
    }
    
    // 숫자가 아니면 기본값 1 사용
    if (!currentUserId || isNaN(currentUserId)) {
      currentUserId = 1;
    }
    
    console.log('💬 현재 사용자 ID:', currentUserId, '타입:', typeof currentUserId);
    console.log('💬 전체 메시지 수:', directMessages.length);
    console.log('💬 전체 메시지:', JSON.stringify(directMessages, null, 2));
    
    // 현재 사용자가 sender_id 또는 receiver_id로 참여한 모든 메시지 조회
    const myMessages = directMessages.filter(msg => {
      const senderId = Number(msg.sender_id) || 0;
      const receiverId = Number(msg.receiver_id) || 0;
      const isMyMessage = senderId === currentUserId || receiverId === currentUserId;
      
      console.log(`💬 메시지 확인:`, {
        dm_id: msg.dm_id,
        sender_id: senderId,
        receiver_id: receiverId,
        currentUserId: currentUserId,
        isMyMessage: isMyMessage
      });
      
      return isMyMessage;
    });
    
    console.log('💬 내 메시지 수:', myMessages.length);
    
    // 대화 상대 user_id 추출
    const conversationUserIds = new Set();
    myMessages.forEach(msg => {
      const senderId = Number(msg.sender_id) || 0;
      const receiverId = Number(msg.receiver_id) || 0;
      
      if (senderId !== currentUserId) {
        conversationUserIds.add(senderId);
      }
      if (receiverId !== currentUserId) {
        conversationUserIds.add(receiverId);
      }
    });
    
    // 대화 상대 목록 생성 (user_id, username)
    const conversations = Array.from(conversationUserIds).map(userId => ({
      user_id: userId,
      username: `user${userId}` // TODO: 실제 사용자 정보에서 가져오기
    }));
    
    console.log('✅ 대화 상대 목록:', {
      currentUserId,
      conversationCount: conversations.length,
      conversationUserIds: Array.from(conversationUserIds),
      conversations
    });
    
    res.json(conversations);
  } catch (error) {
    console.error('❌ 대화 상대 목록 조회 실패:', error);
    res.status(500).json({ error: '대화 상대 목록 조회에 실패했습니다.' });
  }
});

// 특정 사용자와의 대화 내역 조회 API (GET /api/messages/with/:otherUserId)
// 주의: 구체적인 라우트는 동적 라우트(:userId)보다 먼저 정의해야 함
app.get('/api/messages/with/:otherUserId', verifyToken, (req, res) => {
  console.log('💬 특정 사용자와의 대화 내역 조회 요청:', req.params.otherUserId);
  console.log('💬 req.user:', req.user);
  
  try {
    let currentUserId = req.user?.id || req.user?.userId || 1;
    
    // 문자열인 경우 숫자로 변환
    if (typeof currentUserId === 'string') {
      currentUserId = !isNaN(Number(currentUserId)) ? Number(currentUserId) : 1;
    }
    
    // 숫자가 아니면 기본값 1 사용
    if (!currentUserId || isNaN(currentUserId)) {
      currentUserId = 1;
    }
    
    const otherUserId = parseInt(req.params.otherUserId);
    
    if (isNaN(otherUserId)) {
      console.error('❌ 올바르지 않은 사용자 ID:', req.params.otherUserId);
      return res.status(400).json({ error: '올바르지 않은 사용자 ID입니다.' });
    }
    
    console.log('💬 대화 내역 조회:', {
      currentUserId,
      currentUserIdType: typeof currentUserId,
      otherUserId,
      otherUserIdType: typeof otherUserId,
      totalMessages: directMessages.length
    });
    
    // 현재 사용자와 otherUserId 간의 모든 메시지 조회 (양방향)
    const messages = directMessages.filter(msg => {
      const senderId = Number(msg.sender_id) || 0;
      const receiverId = Number(msg.receiver_id) || 0;
      
      const isMatch = (
        (senderId === currentUserId && receiverId === otherUserId) ||
        (senderId === otherUserId && receiverId === currentUserId)
      );
      
      if (isMatch) {
        console.log('✅ 매칭된 메시지:', {
          dm_id: msg.dm_id,
          sender_id: senderId,
          receiver_id: receiverId,
          content: msg.content
        });
      }
      
      return isMatch;
    });
    
    // created_at 기준으로 정렬 (오래된 것부터)
    messages.sort((a, b) => {
      const dateA = new Date(a.created_at || a.timestamp || 0);
      const dateB = new Date(b.created_at || b.timestamp || 0);
      return dateA - dateB;
    });
    
    console.log('✅ 대화 내역 조회 결과:', {
      currentUserId,
      otherUserId,
      messageCount: messages.length,
      messages: messages.map(m => ({ dm_id: m.dm_id, content: m.content }))
    });
    
    res.json(messages);
  } catch (error) {
    console.error('❌ 대화 내역 조회 실패:', error);
    res.status(500).json({ error: '대화 내역 조회에 실패했습니다.' });
  }
});

// 수영 기록 API
let swimmingRecords = [];

app.get('/api/swimming/records/:userId', (req, res) => {
  res.json(swimmingRecords);
});

app.get('/api/swimming/records', (req, res) => {
  res.json(swimmingRecords);
});

app.post('/api/swimming/records', (req, res) => {
  const newRecord = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  swimmingRecords.push(newRecord);
  res.json(newRecord);
});

app.put('/api/swimming/records/:id', (req, res) => {
  const index = swimmingRecords.findIndex(r => r.id === req.params.id);
  if (index !== -1) {
    swimmingRecords[index] = { ...swimmingRecords[index], ...req.body };
    res.json(swimmingRecords[index]);
  } else {
    res.status(404).json({ error: 'Record not found' });
  }
});

app.delete('/api/swimming/records/:id', (req, res) => {
  const index = swimmingRecords.findIndex(r => r.id === req.params.id);
  if (index !== -1) {
    swimmingRecords.splice(index, 1);
    res.json({ message: 'Record deleted successfully' });
  } else {
    res.status(404).json({ error: 'Record not found' });
  }
});

// 수영 기록 로그 API (RecordCalendar용)
// 날짜 형식: YYYY-MM-DD 또는 toDateString() 형식 (예: "Mon Jan 01 2024")
let logsRecords = {}; // { dateKey: { time, distance, best, note } }

// GET /api/logs/calendar - 전체 달력 데이터 조회 (기록이 있는 날짜 목록)
app.get('/api/logs/calendar', verifyToken, (req, res) => {
  console.log('📅 GET /api/logs/calendar 요청');
  console.log('📅 요청 헤더:', {
    authorization: req.headers.authorization ? '있음' : '없음',
    origin: req.headers.origin
  });
  console.log('📅 req.user:', req.user);
  console.log('📅 현재 저장된 기록 개수:', Object.keys(logsRecords).length);
  
  // 빈 객체라도 반환 (프론트엔드에서 오류 방지)
  if (Object.keys(logsRecords).length === 0) {
    console.log('📅 기록 없음, 빈 객체 반환');
    return res.json({});
  }
  
  // records 객체를 그대로 반환 (프론트엔드 records 상태에 직접 설정 가능)
  console.log('📅 기록 반환:', logsRecords);
  res.json(logsRecords);
});

// GET /api/logs/date/:date - 특정 날짜의 기록 조회
app.get('/api/logs/date/:date', verifyToken, (req, res) => {
  const { date } = req.params;
  console.log('📅 GET /api/logs/date/:date 요청:', date);
  
  const record = logsRecords[date];
  
  if (record) {
    console.log('✅ 날짜별 기록 찾음:', record);
    res.json(record);
  } else {
    console.log('⚠️ 날짜별 기록 없음:', date);
    res.status(404).json({ error: 'Record not found' });
  }
});

// POST /api/logs - 기록 저장
app.post('/api/logs', verifyToken, (req, res) => {
  console.log('📅 POST /api/logs 요청:', req.body);
  
  const { date, time, distance, best, note } = req.body;
  
  if (!date) {
    return res.status(400).json({ error: '날짜는 필수입니다.' });
  }
  
  const record = {
    time: time || '',
    distance: distance || '',
    best: best || '',
    note: note || ''
  };
  
  logsRecords[date] = record;
  console.log('✅ 기록 저장 완료:', { date, record });
  console.log('📅 현재 저장된 기록 개수:', Object.keys(logsRecords).length);
  
  res.status(201).json(record);
});

// DELETE /api/logs/date/:date - 기록 삭제
app.delete('/api/logs/date/:date', verifyToken, (req, res) => {
  const { date } = req.params;
  console.log('📅 DELETE /api/logs/date/:date 요청:', date);
  
  if (logsRecords[date]) {
    delete logsRecords[date];
    console.log('✅ 기록 삭제 완료:', date);
    console.log('📅 현재 저장된 기록 개수:', Object.keys(logsRecords).length);
    res.json({ message: 'Record deleted successfully' });
  } else {
    console.log('⚠️ 삭제할 기록 없음:', date);
    res.status(404).json({ error: 'Record not found' });
  }
});

// 인증 미들웨어
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
  }
  
  const token = authHeader.substring(7); // "Bearer " 제거
  
  // 간단한 토큰 검증 (개발용 - 모든 토큰 허용)
  console.log('🔐 받은 토큰:', token);
  console.log('🔐 토큰 길이:', token.length);
  
  // 개발용: 모든 토큰 허용
  req.user = { id: 'user-1', name: '사용자' };
  next();
};

// 루틴 추천 API (인증 필요)
app.post('/api/routines/recommend', authMiddleware, async (req, res) => {
  try {
    console.log("프론트에서 받은 Body:", req.body);
    // 1. 프론트엔드에서 모든 입력값을 받습니다.
    const { height, age, weight, gender, skill, pool: poolValue } = req.body;
    const userId = req.user.id || 'user-1'; // 개발용 기본값

    // ★★★ 2. 받은 값을 백엔드가 이해할 수 있도록 변환합니다. ★★★
    let swimAbility;
    if (skill === 'beginner' || skill === '초급(처음 시작)') {
      swimAbility = '초급';
    } else if (skill === 'intermediate' || skill === '중급(기본기 완성)') {
      swimAbility = '중급';
    } else if (skill === 'advanced' || skill === '고급(대회 준비)') {
      swimAbility = '고급';
    } else {
      swimAbility = '중급'; // 혹시 모를 기본값
    }

    // "25m" 같은 문자열에서 숫자 25만 추출합니다.
    const poolLength = parseInt(poolValue, 10);

    let routineTitle = "";
    let routineDescription = "";
    let routineSteps = [];

    // 2. 수영 실력(swimAbility)을 기준으로 크게 분기합니다.
    if (swimAbility === '초급') {
      routineTitle = `초급 ${poolLength}m 풀 적응 루틴`;
      routineDescription = "물과 친해지고 기본 자세와 호흡을 연습하는 데 집중합니다.";
      routineSteps = [
        "워밍업: 천천히 걷기 100m",
        "발차기 연습 (킥판 잡고) 25m x 4세트",
        "자유형 팔 동작 연습 25m x 4세트",
        "쿨다운: 배영으로 천천히 50m"
      ];
    
    } else if (swimAbility === '중급') {
      // 사용자가 보내준 이미지의 예시 케이스 (160cm, 20세, 여, 25m)
      if (height <= 160 && age <= 20 && gender === "여" && poolLength == 25) {
        routineTitle = "자유형 50m - 1분 안에 완주하기 도전!";
        routineDescription = "체력과 기술을 균형있게 향상시키는 루틴입니다.";
        routineSteps = [
          "워밍업: 자유형 300m",
          "기술 연습: 각 영법별 150m씩",
          "인터벌: 고강도 400m",
          "쿨다운: 완만한 자유형 200m"
        ];
      } else if (poolLength == 50) {
        // 그 외 중급, 50m 풀
        routineTitle = `중급 50m 풀 지구력 강화 루틴`;
        routineDescription = "휴식 시간을 줄이며 지구력을 기르는 데 집중합니다.";
        routineSteps = [
          "워밍업: 자유형 200m",
          "IM(접-배-평-자) 100m x 2세트",
          "자유형 50m x 8세트 (30초 휴식)",
          "쿨다운: 100m"
        ];
      } else {
        // 그 외 중급, 25m 풀
        routineTitle = `중급 25m 풀 스피드 향상 루틴`;
        routineDescription = "짧은 거리를 빠르게 반복하여 스피드를 올립니다.";
        routineSteps = [
          "워밍업: 200m",
          "드릴 연습 (한팔 자유형 등) 100m",
          "대시(Dash) 25m x 8세트 (40초 휴식)",
          "쿨다운: 100m"
        ];
      }

    } else if (swimAbility === '고급') {
      routineTitle = `고급 ${poolLength}m 풀 대회 준비 루틴`;
      routineDescription = "실전 감각을 익히고 최대 스피드를 유지하는 훈련입니다.";
      routineSteps = [
        "워밍업: 400m",
        "주요 영법 드릴 200m",
        "인터벌 트레이닝 100m x 8세트 (휴식 1분)",
        "스프린트 50m x 4세트 (전력 질주)",
        "쿨다운: 200m"
      ];
    }

    // 3. (로직 추가 예시) 나이나 몸무게에 따라 강도 조절 (선택 사항)
    if (age > 50 || weight > 90) {
      routineTitle = "[강도 조절] " + routineTitle;
      // (여기서 세트 수를 줄이거나 휴식 시간을 늘리는 등 로직을 추가할 수 있습니다)
    }

    // 4. 프론트엔드에서 기대하는 구조로 응답 생성
    const routine = {
      title: routineTitle,
      description: routineDescription,
      exercises: routineSteps.map((step, index) => ({
        name: step.split(':')[0] || `단계 ${index + 1}`,
        description: step.split(':')[1] || step,
        duration: "10-15분",
        intensity: index === 0 || index === routineSteps.length - 1 ? "낮음" : 
                  index === routineSteps.length - 2 ? "높음" : "중간"
      }))
    };

    // 5. 사용자에게 응답으로 보냅니다.
    res.status(200).json({
      userInfo: { height, age, weight, skill, gender, pool: poolValue },
      routine,
      generatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("서버 에러");
  }
});

// 퀴즈 시작 API
app.get('/api/quiz/start', (req, res) => {
  try {
    console.log('🎯 퀴즈 시작 요청 받음');
    
    // 더 많은 퀴즈 데이터 (실제로는 DB에서 가져와야 함)
    const allQuizData = [
      {
        quiz_id: 1,
        question: "올림픽에서 자유형 100m 세계 기록은?",
        options: ["44초", "45초", "46초", "47초"]
      },
      {
        quiz_id: 2,
        question: "수영에서 접영의 영문 명칭은?",
        options: ["Butterfly", "Freestyle", "Backstroke", "Breaststroke"]
      },
      {
        quiz_id: 3,
        question: "수영에서 킥판은 주로 어떤 훈련에 사용될까?",
        options: ["상체", "하체", "호흡", "자세"]
      },
      {
        quiz_id: 4,
        question: "올림픽 수영 경기장의 길이는?",
        options: ["25m", "33m", "50m", "100m"]
      },
      {
        quiz_id: 5,
        question: "평영에서 팔 동작은 몇 단계로 나뉘나?",
        options: ["2단계", "3단계", "4단계", "5단계"]
      },
      {
        quiz_id: 6,
        question: "수영에서 자유형의 다른 이름은?",
        options: ["크롤", "백스트로크", "브레스트", "플라이"]
      },
      {
        quiz_id: 7,
        question: "수영에서 가장 빠른 영법은?",
        options: ["자유형", "배영", "평영", "접영"]
      },
      {
        quiz_id: 8,
        question: "수영에서 물속에서 숨을 참는 시간은?",
        options: ["10초", "20초", "30초", "40초"]
      },
      {
        quiz_id: 9,
        question: "수영에서 킥의 주된 역할은?",
        options: ["속도", "균형", "호흡", "자세"]
      },
      {
        quiz_id: 10,
        question: "수영에서 턴할 때 벽을 터치하는 부위는?",
        options: ["손", "발", "어깨", "허리"]
      }
    ];
    
    // 5개 문제를 랜덤하게 선택
    const shuffled = allQuizData.sort(() => 0.5 - Math.random());
    const selectedQuiz = shuffled.slice(0, 5);
    
    console.log('✅ 랜덤 퀴즈 선택 완료:', selectedQuiz.length, '개 문제');
    
    res.json({ quizzes: selectedQuiz });
    console.log('✅ 퀴즈 데이터 전송 완료:', selectedQuiz.length, '개 문제');
  } catch (err) {
    console.error('❌ 퀴즈 시작 실패:', err);
    res.status(500).send("서버 에러");
  }
});

// 퀴즈 제출 API
app.post('/api/quiz/submit', (req, res) => {
  try {
    console.log('🎯 퀴즈 제출 요청 받음:', req.body);
    
    const { answers } = req.body;
    
    if (!answers || answers.length === 0) {
      return res.status(400).json({ message: "제출된 답안지가 없습니다." });
    }
    
    // 임시 정답 데이터 (실제로는 DB에서 가져와야 함)
    const correctAnswers = {
      1: "46초",
      2: "Butterfly", 
      3: "하체",
      4: "50m",
      5: "3단계"
    };
    
    // 채점
    let correctCount = 0;
    const results = answers.map(answer => {
      const isCorrect = correctAnswers[answer.quizId] === answer.selectedOption;
      if (isCorrect) correctCount++;
      
      return {
        quizId: answer.quizId,
        selectedOption: answer.selectedOption,
        isCorrect: isCorrect,
        correctAnswer: correctAnswers[answer.quizId]
      };
    });
    
    // 등급 계산
    let rank = "";
    if (correctCount >= 4) {
      rank = "상 (Excellent!)";
    } else if (correctCount >= 3) {
      rank = "중 (Good Job!)";
    } else {
      rank = "하 (Try Again!)";
    }
    
    const response = {
      title: "퀴즈 완료!",
      totalQuestions: answers.length,
      correctCount: correctCount,
      scoreMessage: `점수: ${correctCount} / ${answers.length}`,
      correctRate: parseFloat(((correctCount / answers.length) * 100).toFixed(1)),
      rank: rank,
      results: results
    };
    
    res.json(response);
    console.log('✅ 퀴즈 제출 처리 완료:', response);
  } catch (err) {
    console.error('❌ 퀴즈 제출 실패:', err);
    res.status(500).send("서버 에러");
  }
});

// 수영 종목 정보 API
app.get('/api/swim-types', (req, res) => {
  try {
    console.log('📊 /api/swim-types 요청 받음');
    const swimTypes = {
      freestyle: {
        stroke_name: 'freestyle',
        titleKor: "자유형",
        titleEng: "Freestyle",
        muscles: [
          "삼각근(어깨)",
          "광배근(등)",
          "복직근(코어)",
          "대퇴사두근(허벅지 앞)"
        ],
        pros: [
          "속도가 가장 빠름 → 칼로리 소모 많음",
          "전신을 골고루 사용 → 유산소 + 근력 효과 탁월",
          "기본 자세로 가장 널리 사용됨"
        ],
        cons: [
          "잘못된 호흡으로 피로가 쉽게 쌓일 수 있음",
          "초보자는 호흡 리듬 익히기 어려움",
          "어깨에 부담이 갈 수 있음"
        ],
        rec: [
          "체중 감량 목적자",
          "전신 운동이 필요한 분",
          "기초 체력이 있는 사람"
        ],
        highlight: {
          front: ["shoulders","core","quads","calves"],
          back:  ["delts","lats","glutes","hams"],
        },
      },
      backstroke: {
        stroke_name: 'backstroke',
        titleKor: "배영",
        titleEng: "Backstroke",
        muscles: ["승모근/광배근","후면 삼각근","둔근","햄스트링"],
        pros: ["호흡 부담 적음","허리 부담 상대적으로 낮음","장거리 유산소 적합"],
        cons: ["진행 방향 확인 어려움","정렬 유지 난이도"],
        rec: ["자세 교정","장거리 선호자"],
        highlight: {
          front: ["core","forearms"],
          back: ["traps","lats","delts","glutes","hams"],
        },
      },
      breaststroke: {
        stroke_name: 'breaststroke',
        titleKor: "평영",
        titleEng: "Breaststroke",
        muscles: ["내전근","둔근","가슴","삼두/전완"],
        pros: ["시야 확보 쉬움","하체 내전/둔근 강화","지속 운동 용이"],
        cons: ["무릎/고관절 부담","속도 느림"],
        rec: ["무리없는 순환운동","기초 체력 향상"],
        highlight: {
          front: ["adductors","chest","triceps","core"],
          back: ["glutes","calves"],
        },
      },
      butterfly: {
        stroke_name: 'butterfly',
        titleKor: "접영",
        titleEng: "Butterfly",
        muscles: ["광배/승모","가슴/전면 삼각근","코어","둔근/햄스트링"],
        pros: ["강한 전신 파워","고강도 인터벌 적합"],
        cons: ["기술 난이도 높음","어깨/허리 부담"],
        rec: ["근지구력 향상","도전적 인터벌"],
        highlight: {
          front: ["shoulders","chest","core","quads"],
          back: ["delts","lats","traps","glutes","hams"],
        },
      },
    };
    
    console.log('✅ 수영 종목 정보 반환:', Object.keys(swimTypes));
    res.json(swimTypes);
  } catch (error) {
    console.error('❌ /api/swim-types 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.', message: error.message });
  }
});

// 사용자 API
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.put('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index !== -1) {
    users[index] = { ...users[index], ...req.body };
    res.json(users[index]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// 제품 목록 API
let products = [
  {
    id: 1,
    name: "Women Swimwear",
    image: "/women-swimwear.jpg",
    shortDescription: "여자 수영복은 수영이나 물놀이를 위해 입는 옷으로, 원피스, 비키니, 래시가드 등 용도와 디자인에 따라 다양한 종류가 있습니다.",
    description: "여성용 수영복은 몸에 잘 밀착되어 유선형을 유지해 수영 시 저항을 최소화합니다.",
    pros: ["편안한 착용감", "빠른 건조", "다양한 디자인"],
    cons: ["가격대가 높은 편"],
    link: "https://www.arena.co.kr/product/list.html?cate_no=24",
    badge: "슈퍼적립",
    rating: 4.92,
    reviews: 13,
  },
  {
    id: 2,
    name: "Men Swimwear",
    image: "/men-swimwear.jpg",
    shortDescription: "남자 수영복은 수영이나 물놀이를 위해 입는 옷으로, 경기용 삼각이나 사각부터 물놀이용 보드숏, 자외선 차단용 래시가드까지 용도에 따라 다양한 종류가 있습니다.",
    description: "남성용 수영복은 압박감이 적당하여 수영 시 안정적인 자세를 유지하도록 도와줍니다.",
    pros: ["내구성 좋음", "체형 보정 효과", "경기용으로 적합"],
    cons: ["타이트한 착용감"],
    link: "https://www.arena.co.kr/product/list.html?cate_no=25",
    badge: "BEST",
    rating: 4.79,
    reviews: 78,
  },
  {
    id: 3,
    name: "Goggles",
    image: "/goggles.jpg", // 수경.jpg
    shortDescription: "물안경(수경)은 수영 시 소독약이나 이물질로부터 눈을 보호하고 물 속 시야를 확보해주는 장비로, 경기용, 강습용, 레저용 등 목적에 따라 다양한 종류가 있습니다.",
    description: "고성능 수경으로, 김서림 방지와 자외선 차단 기능이 탑재되어 있습니다.",
    pros: ["시야 확보 우수", "김서림 방지", "가벼운 착용감"],
    cons: ["스크래치에 약함"],
    link: "https://www.arena.co.kr/product/list.html?cate_no=239",
    badge: "SALE",
    rating: 4.81,
    reviews: 54,
  },
  {
    id: 4,
    name: "Swimming Cap",
    image: "/swimming-cap.jpg", // 수영모.jpg
    shortDescription: "수영모자(수모)는 위생, 모발 보호, 물 저항 감소를 위해 착용하며, 방수와 내구성이 좋은 실리콘 재질과 착용감이 편한 천 재질 등이 있습니다.",
    description: "수영모는 머리카락을 보호하고 물의 저항을 줄이는 역할을 합니다.",
    pros: ["실리콘 재질로 내구성 높음", "물 저항 감소"],
    cons: ["장시간 착용 시 압박감"],
    link: "https://www.arena.co.kr/product/list.html?cate_no=380",
    badge: "HOT",
    rating: 4.7,
    reviews: 10,
  },
  {
    id: 5,
    name: "Auxiliary Equipment",
    image: "/auxiliary-equipment.jpg", // 수영 용품.jpeg
    shortDescription: "수영 용품은 수영복처럼 물에서 입는 옷을 비롯해, 킥판, 오리발, 패들처럼 훈련을 돕거나 타월 등 편의를 위한 장비들을 말합니다.",
    description: "수영 훈련 보조용품으로, 킥판, 풀부이 등 다양한 보조 장비를 포함합니다.",
    pros: ["훈련 효율성 향상", "다양한 선택지"],
    cons: ["보관 공간 필요"],
    link: "https://www.arena.co.kr/product/list.html?cate_no=28",
    badge: "NEW",
    rating: 4.6,
    reviews: 25,
  },
  {
    id: 6,
    name: "Swimming Bag",
    image: "/swimming-bag.jpg", // 수영 가방.jpg
    shortDescription: "수영 가방은 젖은 용품과 마른 소지품을 분리해서 담을 수 있도록 '건습 분리' 기능이 되어있고, 통풍이 잘되는 메쉬 소재나 방수 소재로 만들어진 수영 용품 전용 가방입니다.",
    description: "수영 가방 및 기타 용품으로 수영에 필요한 장비를 편리하게 보관할 수 있습니다.",
    pros: ["방수 기능", "넉넉한 수납공간"],
    cons: ["부피가 큼"],
    link: "https://www.arena.co.kr/product/list.html?cate_no=96",
    badge: "BEST",
    rating: 4.8,
    reviews: 30,
  },
  {
    id: 7,
    name: "One-piece",
    image: "/one-piece.jpg",
    shortDescription: "원피스형 수영복은 가장 일반적이고 실내 수영장 기본 복장입니다.",
    description: "어깨 끈이 고정되어 움직임이 안정적이며, 초보자에게 추천됩니다.",
    pros: ["안정적인 움직임", "실내 수영장 일반용", "체형 보완 효과"],
    cons: ["디자인 선택의 폭이 제한적"],
    link: "https://www.arena.co.kr/product/list.html?cate_no=239",
    badge: "BEST",
    rating: 4.5,
    reviews: 120,
  },
  {
    id: 8,
    name: "Open-back / Cross-back",
    image: "/open-back-cross-back.jpg",
    shortDescription: "등 부분이 크게 트여있거나 X자형 스트랩으로 어깨 움직임이 자유롭습니다.",
    description: "훈련용으로 적합하며 속도 향상에 도움이 됩니다.",
    pros: ["어깨 움직임 자유로움", "훈련용 최적화", "속도 향상"],
    cons: ["초보자는 착용 어려움"],
    link: "https://www.arena.co.kr/product/list.html?cate_no=239",
    badge: "NEW",
    rating: 4.6,
    reviews: 85,
  },
  {
    id: 9,
    name: "Briefs",
    image: "/briefs.jpg",
    shortDescription: "전통적인 수영복 형태로 저항이 적고 경기용으로 많이 사용됩니다.",
    description: "수저항이 가장 적어 경기용으로 최적화되어 있습니다.",
    pros: ["수저항 최소", "경기용 최적화", "전통적인 디자인"],
    cons: ["일부 사용자는 노출이 많다고 느낄 수 있음"],
    link: "https://www.arena.co.kr/product/list.html?cate_no=239",
    badge: "HOT",
    rating: 4.7,
    reviews: 95,
  },
  {
    id: 10,
    name: "Trunks / Square-cut",
    image: "/trunks.jpg",
    shortDescription: "짧은 반바지 형태로 실내 수영장 일반용으로 가장 흔합니다.",
    description: "착용감이 편안하고 초보자에게 적합합니다.",
    pros: ["실내 수영장 일반용", "착용감 편안함", "초보자 적합"],
    cons: ["수저항이 삼각형보다 다소 높음"],
    link: "https://www.arena.co.kr/product/list.html?cate_no=239",
    badge: "BEST",
    rating: 4.8,
    reviews: 150,
  },
  {
    id: 11,
    name: "Jammer",
    image: "/jammer.jpg",
    shortDescription: "허벅지 중간까지 오는 압박형으로 경기용 또는 훈련용에 적합합니다.",
    description: "근육 지지와 수저항 감소 효과가 있습니다.",
    pros: ["근육 지지 효과 우수", "수저항 감소", "경기용 적합"],
    cons: ["초보자에게는 다소 불편할 수 있음"],
    link: "https://www.arena.co.kr/product/list.html?cate_no=239",
    badge: "NEW",
    rating: 4.9,
    reviews: 75,
  },
  {
    id: 12,
    name: "Rash guard",
    image: "/rashguard.jpg",
    shortDescription: "상체 보호와 편안함 중심으로 초보자나 체형 보완 목적에 적합합니다.",
    description: "자외선 차단 효과가 우수하며 레저용에 가깝습니다.",
    pros: ["자외선 차단 우수", "체형 보완", "초보자 친화적"],
    cons: ["수저항이 다소 증가할 수 있음"],
    link: "https://www.arena.co.kr/product/list.html?cate_no=239",
    badge: "SALE",
    rating: 4.5,
    reviews: 110,
  },
];

// 제품 목록 조회 API
app.get('/api/products', (req, res) => {
  try {
    console.log('📦 GET /api/products 요청');
    
    // products 배열이 정의되어 있는지 확인
    if (!products || !Array.isArray(products)) {
      console.error('❌ products 배열이 정의되지 않았거나 배열이 아닙니다.');
      return res.status(500).json({ error: '제품 데이터가 올바르게 초기화되지 않았습니다.' });
    }
    
    console.log('📦 제품 개수:', products.length);
    
    // 첫 번째 제품의 원본 데이터 확인
    if (products.length > 0) {
      console.log('📦 첫 번째 제품 원본 데이터:', JSON.stringify(products[0], null, 2));
      console.log('📦 첫 번째 제품 image 필드:', products[0].image);
    }
    
    // 제품 데이터 정리 (직렬화 가능한 형태로 변환)
    const cleanProducts = products.map(product => ({
      id: product.id,
      name: product.name || '',
      image: product.image || '',
      shortDescription: product.shortDescription || product.shortdescription || '',
      description: product.description || '',
      pros: Array.isArray(product.pros) ? product.pros : [],
      cons: Array.isArray(product.cons) ? product.cons : [],
      link: product.link || '',
      badge: product.badge || '',
      rating: typeof product.rating === 'number' ? product.rating : 0,
      reviews: typeof product.reviews === 'number' ? product.reviews : 0
    }));
    
    // 정리된 첫 번째 제품 확인
    if (cleanProducts.length > 0) {
      console.log('📦 정리된 첫 번째 제품:', JSON.stringify(cleanProducts[0], null, 2));
      console.log('📦 정리된 첫 번째 제품 image 필드:', cleanProducts[0].image);
    }
    
    // JSON 직렬화 테스트
    try {
      const jsonString = JSON.stringify(cleanProducts);
      console.log('✅ JSON 직렬화 성공, 길이:', jsonString.length);
    } catch (stringifyError) {
      console.error('❌ JSON 직렬화 실패:', stringifyError);
      console.error('❌ 직렬화 실패 상세:', stringifyError.message, stringifyError.stack);
      return res.status(500).json({ error: '제품 데이터 직렬화 중 오류가 발생했습니다.', details: stringifyError.message });
    }
    
    // 응답 전송 전 최종 확인
    console.log('📤 응답 전송 시작...');
    console.log('📦 전송할 제품 개수:', cleanProducts.length);
    console.log('📦 전송할 첫 번째 제품:', JSON.stringify(cleanProducts[0], null, 2));
    console.log('📦 전송할 첫 번째 제품 image 필드:', cleanProducts[0]?.image);
    
    // 모든 제품의 image 필드 확인
    const imageCheck = cleanProducts.map(p => ({ id: p.id, name: p.name, image: p.image }));
    console.log('📦 전송할 모든 제품의 image 필드:', imageCheck);
    
    res.json(cleanProducts);
    console.log('✅ 응답 전송 완료');
  } catch (error) {
    console.error('❌ 제품 목록 조회 에러:', error);
    console.error('❌ 에러 스택:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: '서버 오류가 발생했습니다.', details: error.message });
    }
  }
});

// 제품 상세 정보 조회 API
app.get('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  console.log('📦 GET /api/products/:id 요청 - productId:', productId);
  
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    console.log('❌ 제품을 찾을 수 없음 - productId:', productId);
    return res.status(404).json({ error: '제품을 찾을 수 없습니다.' });
  }
  
  console.log('✅ 제품 상세 정보 반환:', product.name);
  res.json(product);
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 백엔드 서버가 http://localhost:${PORT}에서 실행 중입니다.`);
  console.log(`📋 API 문서: http://localhost:${PORT}/api/health`);
  console.log(`📨 등록된 메시지 API 엔드포인트:`);
  console.log(`   - POST /api/messages/dm (verifyToken 필요)`);
  console.log(`   - GET /api/messages/conversations (verifyToken 필요)`);
  console.log(`   - GET /api/messages/with/:otherUserId (verifyToken 필요)`);
});
