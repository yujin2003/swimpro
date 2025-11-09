// src/pages/PostDetail.jsx
import { useMemo, useState, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { usePosts } from "../store/posts.jsx";
import { useUser } from "../store/user.jsx";
import { postsAPI } from "../services/api.js";
import { AUTH_CONFIG } from "../config/environment.js";
import TopNav from "../components/TopNav";

export default function PostDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { posts, updatePost, loadPosts } = usePosts();
  const { user } = useUser(); // 현재 로그인한 사용자 정보
  
  console.log('🔍 PostDetail - 받은 ID:', id, '타입:', typeof id);
  console.log('🔍 PostDetail - URL:', window.location.href);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 현재 사용자가 게시글 작성자인지 확인
  const isAuthor = useMemo(() => {
    if (!post) {
      console.log('🔍 작성자 확인: post가 없음');
      return false;
    }
    
    // 게시글 작성자 ID 추출 (여러 필드명 지원)
    const postUserId = post.user_id || post.userId || post.author_id || post.authorId;
    
    // 게시글 작성자 username 추출
    let postUsername = post.username || post.author;
    // 괄호가 있으면 제거 (예: 'hhj03(사용자)' -> 'hhj03')
    if (postUsername) {
      postUsername = postUsername.split('(')[0].trim();
    }
    
    // 현재 로그인한 사용자 ID 추출 (여러 소스 확인)
    const currentUserId = user?.id || user?.userId || user?.user_id;
    
    // 현재 로그인한 사용자 username 추출
    // user.name이 'hhj03(사용자)' 형식일 수 있으므로 username 우선 사용
    let currentUsername = user?.username;
    // username이 없으면 name에서 괄호 앞 부분만 추출
    if (!currentUsername && user?.name) {
      currentUsername = user.name.split('(')[0].trim();
    }
    
    // sessionStorage/localStorage에서도 userId 확인
    const storedUserId = sessionStorage.getItem(AUTH_CONFIG.USER_ID_KEY) || 
                        localStorage.getItem(AUTH_CONFIG.USER_ID_KEY);
    
    // 최종 현재 사용자 ID 결정 (우선순위: user 객체 > sessionStorage > localStorage)
    const finalCurrentUserId = currentUserId || storedUserId;
    
    // 문자열로 변환하여 비교 (타입 불일치 방지)
    const postUserIdStr = postUserId ? String(postUserId) : null;
    const finalCurrentUserIdStr = finalCurrentUserId ? String(finalCurrentUserId) : null;
    
    // user_id로 비교
    const isMatchById = postUserIdStr && finalCurrentUserIdStr && 
                        postUserIdStr === finalCurrentUserIdStr;
    
    // username으로 비교 (user_id가 일치하지 않을 때 대체 방법)
    const isMatchByUsername = postUsername && currentUsername && 
                              postUsername.trim() === currentUsername.trim();
    
    // user_id 또는 username 중 하나라도 일치하면 작성자로 인정
    const isMatch = isMatchById || isMatchByUsername;
    
    console.log('🔍 작성자 확인 상세:', {
      post: {
        id: post.id || post.post_id,
        title: post.title,
        user_id: post.user_id,
        userId: post.userId,
        author_id: post.author_id,
        username: postUsername,
        postUserId: postUserId,
        postUserIdStr: postUserIdStr
      },
      user: {
        id: user?.id,
        userId: user?.userId,
        user_id: user?.user_id,
        username: currentUsername,
        currentUserId: currentUserId
      },
      stored: {
        sessionStorage: sessionStorage.getItem(AUTH_CONFIG.USER_ID_KEY),
        localStorage: localStorage.getItem(AUTH_CONFIG.USER_ID_KEY),
        storedUserId: storedUserId
      },
      final: {
        finalCurrentUserId: finalCurrentUserId,
        finalCurrentUserIdStr: finalCurrentUserIdStr,
        isMatchById: isMatchById,
        isMatchByUsername: isMatchByUsername,
        isMatch: isMatch
      }
    });
    
    return isMatch;
  }, [post, user]);

  // 수정 후 돌아왔을 때 강제 새로고침
  useEffect(() => {
    if (location.state?.refresh) {
      console.log('🔄 PostDetail: 수정 후 새로고침 트리거됨');
      loadPosts();
      // 게시글 상세 정보도 다시 로드
      if (id && id !== 'undefined') {
        const numericId = parseInt(id, 10);
        if (!isNaN(numericId)) {
          postsAPI.getPost(numericId).then(apiPost => {
            console.log('✅ PostDetail: 업데이트된 게시글 로드 완료', apiPost);
            setPost(apiPost);
          }).catch(err => {
            console.error('❌ PostDetail: 업데이트된 게시글 로드 실패', err);
          });
        }
      }
      // 한 번만 처리되도록 state 제거
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
  }, [location.state, id]);

  // API에서 게시글 상세 정보 로드 (GET /api/posts/:id)
  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🔍 게시글 상세 조회: GET /api/posts/${id}`);
        console.log('📋 받은 ID:', id, '타입:', typeof id);
        
        if (!id || id === 'undefined') {
          throw new Error('유효하지 않은 게시글 ID입니다.');
        }
        
        // ID를 숫자로 변환하여 API 호출 (GET /api/posts/:id)
        const numericId = parseInt(id, 10);
        console.log(`🔍 API 호출: GET /api/posts/${numericId} (원본: ${id})`);
        
        if (isNaN(numericId)) {
          throw new Error('유효하지 않은 게시글 ID입니다.');
        }
        
        // API에서 게시글 상세 정보 조회 (항상 최신 데이터 가져오기)
        const apiPost = await postsAPI.getPost(numericId);
        console.log('✅ API 응답:', apiPost);
        console.log('✅ API 응답 전체 객체:', JSON.stringify(apiPost, null, 2));
        console.log('✅ API 응답 타입:', typeof apiPost);
        console.log('✅ API 응답 키 목록:', Object.keys(apiPost || {}));
        console.log('📅 API 응답 일시 필드 상세:', {
          'event_datetime': apiPost?.event_datetime,
          'event_date': apiPost?.event_date,
          'event_start_time': apiPost?.event_start_time,
          'event_end_time': apiPost?.event_end_time,
          'created_at': apiPost?.created_at,
          'dateText': apiPost?.dateText,
          'date': apiPost?.date,
          'startTime': apiPost?.startTime,
          'endTime': apiPost?.endTime,
          'has event_date': 'event_date' in (apiPost || {}),
          'has event_start_time': 'event_start_time' in (apiPost || {}),
          'has event_end_time': 'event_end_time' in (apiPost || {})
        });
        
        // 백엔드에서 받은 데이터를 그대로 사용 (필드명 확인)
        if (apiPost && typeof apiPost === 'object') {
          console.log('🔍 백엔드 응답 데이터 검증:', {
            'event_date 직접 확인': apiPost.event_date,
            'event_start_time 직접 확인': apiPost.event_start_time,
            'event_end_time 직접 확인': apiPost.event_end_time,
            '모든 일시 관련 필드': {
              event_datetime: apiPost.event_datetime,
              event_date: apiPost.event_date,
              event_start_time: apiPost.event_start_time,
              event_end_time: apiPost.event_end_time,
              date: apiPost.date,
              startTime: apiPost.startTime,
              endTime: apiPost.endTime
            }
          });
        }
        
        setPost(apiPost);
        
      } catch (err) {
        console.error('❌ 게시글 로드 실패:', err);
        
        // API 실패 시 로컬 posts에서 찾기 (폴백)
        const localPost = posts.find((p) => {
          const postId = p.post_id || p.id;
          return postId && (postId.toString() === id || postId.toString() === numericId.toString());
        });
        if (localPost) {
          console.log('📱 로컬 데이터로 폴백:', localPost);
          setPost(localPost);
        } else {
          setError('게시글을 불러올 수 없습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id && id !== 'undefined') {
      loadPost();
    } else {
      setError('유효하지 않은 게시글 ID입니다.');
      setLoading(false);
    }
  }, [id]); // posts dependency 제거하여 항상 서버에서 최신 데이터 가져오기

  const avatarBg = useMemo(() => "bg-yellow-100", []);

  // 완전 랜덤 아바타 생성
  const getRandomAvatar = () => {
    const avatars = [
      '🧑🏻‍🎨', '👨🏻‍💻', '👩🏻‍💻', '🧑🏻‍🍳', '👨🏻‍🏫', '👩🏻‍🏫',
      '🧑🏻‍🎓', '👨🏻‍🎨', '👩🏻‍🎨', '🧑🏻‍💼', '👨🏻‍💼', '👩🏻‍💼',
      '🧑🏻‍🔬', '👨🏻‍🔬', '👩🏻‍🔬', '🧑🏻‍⚕️', '👨🏻‍⚕️', '👩🏻‍⚕️',
      '🧑🏻‍🚀', '👨🏻‍🚀', '👩🏻‍🚀', '🧑🏻‍✈️', '👨🏻‍✈️', '👩🏻‍✈️',
      '🧑🏻‍🚒', '👨🏻‍🚒', '👩🏻‍🚒', '🧑🏻‍🌾', '👨🏻‍🌾', '👩🏻‍🌾',
      '🧑🏻‍🏭', '👨🏻‍🏭', '👩🏻‍🏭', '🧑🏻‍💻', '👨🏻‍💻', '👩🏻‍💻'
    ];
    
    // 완전 랜덤 인덱스 생성
    const randomIndex = Math.floor(Math.random() * avatars.length);
    return avatars[randomIndex];
  };

  // 쪽지 페이지로 이동 (게시글 작성자와의 채팅 시작)
  const handleSendMessage = () => {
    if (!post) return;
    
    console.log('📤 게시글 작성자 정보 확인:', {
      post: post,
      username: post.username,
      author: post.author,
      post_id: post.post_id,
      id: post.id,
      user_id: post.user_id,
      author_id: post.author_id,
      userId: post.userId
    });
    
    // 게시글 작성자 정보 전달
    // 백엔드 API는 user_id (숫자)를 기대하므로, user_id를 우선적으로 사용
    // TODO: 백엔드 게시글 API 응답에 user_id 필드 추가 필요
    const authorId = post.user_id || post.userId || post.author_id;
    const authorUsername = post.username || post.author || '작성자';
    const authorName = post.author || post.username || '작성자';
    
    console.log('📤 작성자 정보 분석:', {
      has_user_id: !!post.user_id,
      has_userId: !!post.userId,
      has_author_id: !!post.author_id,
      user_id: post.user_id,
      userId: post.userId,
      author_id: post.author_id,
      username: post.username,
      author: post.author,
      selected_authorId: authorId
    });
    
    // user_id가 없거나 숫자가 아닌 경우 경고 (임시 처리)
    // 백엔드에 user_id 필드가 추가되면 이 부분 수정 필요
    if (!authorId) {
      console.warn('⚠️ 게시글에 user_id가 없습니다.');
      alert('작성자 정보를 불러오는 중 문제가 발생했습니다. 백엔드에 user_id 필드가 필요합니다.');
      return;
    }
    
    // user_id가 문자열인지 확인 (임시 처리)
    if (typeof authorId === 'string' && isNaN(Number(authorId))) {
      console.warn('⚠️ user_id가 숫자 문자열이 아닙니다. 백엔드 API 호출이 실패할 수 있습니다:', authorId);
      // 일단 진행하되, 대화 내역 로드는 하지 않음 (ChatPage에서 처리)
    }
    
    console.log('💬 채팅 시작 대상:', { 
      userId: authorId, 
      username: authorUsername, 
      name: authorName,
      userIdType: typeof authorId
    });
    
    // receiverId로 간단하게 전달 (ChatPage에서 자동 처리)
    navigate('/chat', {
      state: {
        receiverId: Number(authorId) || authorId, // 숫자로 변환하여 전달
        username: authorUsername,
        name: authorName
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white text-gray-900">
        <TopNav />
        <main className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="text-gray-600">게시글을 불러오는 중...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-white text-gray-900">
        <TopNav />
        <main className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-lg bg-red-50 p-6 text-center">
            <div className="text-red-600 mb-2">❌</div>
            <p className="text-red-800">{error}</p>
            <Link to="/mentoring" className="mt-4 inline-block rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600">
              목록으로 돌아가기
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen w-full bg-white text-gray-900">
        <TopNav />
        <main className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-lg bg-gray-50 p-6 text-center">
            <div className="text-gray-400 mb-2">📝</div>
            <p className="text-gray-600">존재하지 않는 게시글입니다.</p>
            <Link to="/mentoring" className="mt-4 inline-block rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600">
              목록으로 돌아가기
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white text-gray-900">
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* 카드 */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${avatarBg} text-2xl`}>
              {getRandomAvatar()}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="text-[20px] font-extrabold text-indigo-700">{post.author || post.username || '작성자'}</h2>
                <time className="text-[18px] font-semibold text-indigo-700">
                  {(() => {
                    // post 객체 전체 확인
                    console.log('📅 PostDetail 일시 표시 - post 객체 전체:', post);
                    console.log('📅 PostDetail 일시 표시 - post 객체 키 목록:', Object.keys(post || {}));
                    console.log('📅 PostDetail 일시 표시 - 백엔드에서 받은 데이터:', {
                      'post.event_datetime': post.event_datetime,
                      'post.event_end_datetime': post.event_end_datetime,
                      'post.event_date': post.event_date,
                      'post.event_start_time': post.event_start_time,
                      'post.event_end_time': post.event_end_time,
                      'post.created_at': post.created_at,
                      'post.dateText': post.dateText,
                      'post.date': post.date,
                      'post.startTime': post.startTime,
                      'post.endTime': post.endTime,
                      'post 전체 JSON': JSON.stringify(post, null, 2)
                    });
                    
                    // 우선순위: event_datetime > event_date+event_start_time > created_at
                    let displayTime = '';
                    
                    // 1순위: event_datetime 사용 (+ event_end_time 또는 event_end_datetime 포함)
                    if (post.event_datetime) {
                      try {
                        const eventDate = new Date(post.event_datetime);
                        if (!isNaN(eventDate.getTime())) {
                          const startTimeFormatted = eventDate.toLocaleString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                          
                          // 종료 시간이 있으면 추가 표시
                          if (post.event_end_time || post.event_end_datetime) {
                            const endTimeStr = post.event_end_time || post.event_end_datetime;
                            try {
                              // event_end_time이 HH:mm 형식이면 event_date와 조합
                              let endDateTime;
                              if (post.event_end_time && post.event_date) {
                                const normalizedEndTime = post.event_end_time.includes(':') 
                                  ? post.event_end_time 
                                  : `${post.event_end_time.slice(0, 2)}:${post.event_end_time.slice(2)}`;
                                endDateTime = new Date(`${post.event_date}T${normalizedEndTime}:00`);
                              } else if (post.event_end_datetime) {
                                endDateTime = new Date(post.event_end_datetime);
                              }
                              
                              if (endDateTime && !isNaN(endDateTime.getTime())) {
                                const endTimeFormatted = endDateTime.toLocaleString('ko-KR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                });
                                displayTime = `${startTimeFormatted} - ${endTimeFormatted}`;
                                console.log('✅ PostDetail event_datetime + event_end_time 사용:', displayTime);
                              } else {
                                displayTime = startTimeFormatted;
                                console.log('✅ PostDetail event_datetime 사용:', displayTime);
                              }
                            } catch (err) {
                              displayTime = startTimeFormatted;
                              console.log('✅ PostDetail event_datetime 사용 (종료시간 파싱 실패):', displayTime);
                            }
                          } else {
                            displayTime = startTimeFormatted;
                            console.log('✅ PostDetail event_datetime 사용:', displayTime);
                          }
                          
                          return displayTime;
                        } else {
                          console.error('❌ event_datetime이 유효하지 않은 날짜:', post.event_datetime);
                        }
                      } catch (err) {
                        console.error('❌ event_datetime 파싱 실패:', err, post.event_datetime);
                      }
                    }
                    
                    // 2순위: event_date + event_start_time (+ event_end_time) 조합
                    if (!displayTime && post.event_date && post.event_start_time) {
                      // 백엔드에서 받은 event_date와 event_start_time을 조합
                      try {
                        // 시간 형식 정규화 (HH:mm 형식 보장)
                        const normalizedStartTime = post.event_start_time.includes(':') 
                          ? post.event_start_time 
                          : `${post.event_start_time.slice(0, 2)}:${post.event_start_time.slice(2)}`;
                        const isoString = `${post.event_date}T${normalizedStartTime}:00`;
                        const dateTime = new Date(isoString);
                        
                        if (!isNaN(dateTime.getTime())) {
                          // 시작 시간 포맷
                          const startTimeFormatted = dateTime.toLocaleString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                          
                          // 종료 시간이 있으면 추가
                          if (post.event_end_time) {
                            const normalizedEndTime = post.event_end_time.includes(':') 
                              ? post.event_end_time 
                              : `${post.event_end_time.slice(0, 2)}:${post.event_end_time.slice(2)}`;
                            const endIsoString = `${post.event_date}T${normalizedEndTime}:00`;
                            const endDateTime = new Date(endIsoString);
                            
                            if (!isNaN(endDateTime.getTime())) {
                              const endTimeFormatted = endDateTime.toLocaleString('ko-KR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              });
                              displayTime = `${startTimeFormatted} - ${endTimeFormatted}`;
                              console.log('✅ PostDetail event_date(' + post.event_date + ')+event_start_time(' + post.event_start_time + ')+event_end_time(' + post.event_end_time + ') 조합 사용 → ' + displayTime);
                            } else {
                              displayTime = startTimeFormatted;
                              console.log('✅ PostDetail event_date(' + post.event_date + ')+event_start_time(' + post.event_start_time + ') 조합 사용 → ' + displayTime);
                            }
                          } else {
                            displayTime = startTimeFormatted;
                            console.log('✅ PostDetail event_date(' + post.event_date + ')+event_start_time(' + post.event_start_time + ') 조합 사용 → ' + displayTime);
                          }
                          
                          return displayTime;
                        } else {
                          console.error('❌ 날짜 조합 실패:', { isoString, dateTime, event_date: post.event_date, event_start_time: post.event_start_time });
                        }
                      } catch (err) {
                        console.error('❌ 날짜 파싱 실패:', err, { event_date: post.event_date, event_start_time: post.event_start_time });
                      }
                    }
                    
                    // 2-1순위: date + startTime 조합 (기존 게시글용 fallback)
                    if (!displayTime && post.date && post.startTime) {
                      try {
                        const normalizedTime = post.startTime.includes(':') 
                          ? post.startTime 
                          : `${post.startTime.slice(0, 2)}:${post.startTime.slice(2)}`;
                        const isoString = `${post.date}T${normalizedTime}:00`;
                        const dateTime = new Date(isoString);
                        
                        if (!isNaN(dateTime.getTime())) {
                          displayTime = dateTime.toLocaleString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                          console.log('✅ PostDetail date(' + post.date + ')+startTime(' + post.startTime + ') 조합 사용 → ' + displayTime);
                          return displayTime;
                        }
                      } catch (err) {
                        console.error('❌ date+startTime 파싱 실패:', err);
                      }
                    }
                    
                    // 3순위: created_at 사용 (작성 일시 - 절대 마지막 수단)
                    if (!displayTime && post.created_at) {
                      displayTime = new Date(post.created_at).toLocaleString('ko-KR', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });
                      console.error('⚠️⚠️ PostDetail created_at 사용 (fallback) - 선택한 일시 정보가 없음!', {
                        'event_datetime': post.event_datetime,
                        'event_date': post.event_date,
                        'event_start_time': post.event_start_time,
                        'created_at': post.created_at
                      });
                    }
                    
                    return displayTime || post.timestamp || '';
                  })()}
                </time>
              </div>
              <div className="relative mt-4">
                <div className="rounded-xl bg-gray-100 p-6 leading-relaxed">
                  <Row label="제목" value={post.title || ''} />
                  {post.content && <Row label="" value={post.content} className="mt-3" />}
                  {post.body && <Row label="" value={post.body} className="mt-3" />}
                  <Row label="일시" value={(() => {
                    // 우선순위: event_datetime > event_date+event_start_time > dateText > created_at
                    let displayTime = '';
                    
                    // 1순위: event_datetime 사용 (+ event_end_time 또는 event_end_datetime 포함)
                    if (post.event_datetime) {
                      try {
                        const eventDate = new Date(post.event_datetime);
                        if (!isNaN(eventDate.getTime())) {
                          const startTimeFormatted = eventDate.toLocaleString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                          
                          // 종료 시간이 있으면 추가 표시
                          if (post.event_end_time || post.event_end_datetime) {
                            const endTimeStr = post.event_end_time || post.event_end_datetime;
                            try {
                              // event_end_time이 HH:mm 형식이면 event_date와 조합
                              let endDateTime;
                              if (post.event_end_time && post.event_date) {
                                const normalizedEndTime = post.event_end_time.includes(':') 
                                  ? post.event_end_time 
                                  : `${post.event_end_time.slice(0, 2)}:${post.event_end_time.slice(2)}`;
                                endDateTime = new Date(`${post.event_date}T${normalizedEndTime}:00`);
                              } else if (post.event_end_datetime) {
                                endDateTime = new Date(post.event_end_datetime);
                              }
                              
                              if (endDateTime && !isNaN(endDateTime.getTime())) {
                                const endTimeFormatted = endDateTime.toLocaleString('ko-KR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                });
                                displayTime = `${startTimeFormatted} - ${endTimeFormatted}`;
                                console.log('✅ Row 일시: event_datetime + event_end_time 사용:', displayTime);
                              } else {
                                displayTime = startTimeFormatted;
                                console.log('✅ Row 일시: event_datetime 사용:', displayTime);
                              }
                            } catch (err) {
                              displayTime = startTimeFormatted;
                              console.log('✅ Row 일시: event_datetime 사용 (종료시간 파싱 실패):', displayTime);
                            }
                          } else {
                            displayTime = startTimeFormatted;
                            console.log('✅ Row 일시: event_datetime 사용:', displayTime);
                          }
                          
                          return displayTime;
                        }
                      } catch (err) {
                        console.error('❌ event_datetime 파싱 실패:', err);
                      }
                    }
                    
                    // 2순위: event_date + event_start_time (+ event_end_time) 조합
                    if (!displayTime && post.event_date && post.event_start_time) {
                      // 백엔드에서 받은 event_date와 event_start_time을 조합
                      try {
                        // 시간 형식 정규화 (HH:mm 형식 보장)
                        const normalizedStartTime = post.event_start_time.includes(':') 
                          ? post.event_start_time 
                          : `${post.event_start_time.slice(0, 2)}:${post.event_start_time.slice(2)}`;
                        const isoString = `${post.event_date}T${normalizedStartTime}:00`;
                        const dateTime = new Date(isoString);
                        
                        if (!isNaN(dateTime.getTime())) {
                          // 시작 시간 포맷
                          const startTimeFormatted = dateTime.toLocaleString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                          
                          // 종료 시간이 있으면 추가
                          if (post.event_end_time) {
                            const normalizedEndTime = post.event_end_time.includes(':') 
                              ? post.event_end_time 
                              : `${post.event_end_time.slice(0, 2)}:${post.event_end_time.slice(2)}`;
                            const endIsoString = `${post.event_date}T${normalizedEndTime}:00`;
                            const endDateTime = new Date(endIsoString);
                            
                            if (!isNaN(endDateTime.getTime())) {
                              const endTimeFormatted = endDateTime.toLocaleString('ko-KR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              });
                              displayTime = `${startTimeFormatted} - ${endTimeFormatted}`;
                              console.log('✅ Row 일시: event_date(' + post.event_date + ')+event_start_time(' + post.event_start_time + ')+event_end_time(' + post.event_end_time + ') 조합 사용 → ' + displayTime);
                            } else {
                              displayTime = startTimeFormatted;
                              console.log('✅ Row 일시: event_date(' + post.event_date + ')+event_start_time(' + post.event_start_time + ') 조합 사용 → ' + displayTime);
                            }
                          } else {
                            displayTime = startTimeFormatted;
                            console.log('✅ Row 일시: event_date(' + post.event_date + ')+event_start_time(' + post.event_start_time + ') 조합 사용 → ' + displayTime);
                          }
                          
                          return displayTime;
                        } else {
                          console.error('❌ 날짜 조합 실패:', { isoString, dateTime, event_date: post.event_date, event_start_time: post.event_start_time });
                        }
                      } catch (err) {
                        console.error('❌ 날짜 파싱 실패:', err, { event_date: post.event_date, event_start_time: post.event_start_time });
                      }
                    }
                    
                    // 2-1순위: date + startTime 조합 (기존 게시글용 fallback)
                    if (!displayTime && post.date && post.startTime) {
                      try {
                        const normalizedTime = post.startTime.includes(':') 
                          ? post.startTime 
                          : `${post.startTime.slice(0, 2)}:${post.startTime.slice(2)}`;
                        const isoString = `${post.date}T${normalizedTime}:00`;
                        const dateTime = new Date(isoString);
                        
                        if (!isNaN(dateTime.getTime())) {
                          displayTime = dateTime.toLocaleString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit',
                            minute: '2-digit' 
                          });
                          console.log('✅ Row 일시: date(' + post.date + ')+startTime(' + post.startTime + ') 조합 사용 → ' + displayTime);
                          return displayTime;
                        }
                      } catch (err) {
                        console.error('❌ date+startTime 파싱 실패:', err);
                      }
                    }
                    
                    // 3순위: dateText 사용
                    if (!displayTime && post.dateText) {
                      console.log('⚠️ Row 일시: dateText 사용 (fallback):', post.dateText);
                      return post.dateText;
                    }
                    
                    // 4순위: created_at 사용 (작성 일시 - 절대 마지막 수단)
                    if (!displayTime && post.created_at) {
                      displayTime = new Date(post.created_at).toLocaleString('ko-KR', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit'
                      });
                      console.error('⚠️⚠️ Row 일시: created_at 사용 (fallback) - 선택한 일시 정보가 없음!', {
                        'event_datetime': post.event_datetime,
                        'event_date': post.event_date,
                        'event_start_time': post.event_start_time,
                        'created_at': post.created_at
                      });
                    }
                    
                    return displayTime || '';
                  })()} className="mt-3" />
                  <Row label="지역" value={post.location || post.region || post.placeText || ''} className="mt-2" />
                  {(post.category || post.stroke) && (post.category !== "기타" && post.stroke !== "기타") && (
                    <Row label="종목" value={`🏊‍♂️ ${post.category || post.stroke}`} className="mt-2" />
                  )}
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  className="absolute -right-5 -bottom-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-900 shadow-lg ring-4 ring-white hover:bg-indigo-800 transition-colors"
                  aria-label="send message"
                >
                  <PaperPlaneIcon className="h-7 w-7 text-white" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 액션 버튼들 */}
        <section className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <Link to="/mentoring" className="rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600">
              목록으로
            </Link>
            {isAuthor && (() => {
              const rawId = (post?.post_id ?? post?.id ?? id ?? '').toString();
              const editId = rawId.replace('form_', '');
              const href = editId ? `/postedit?id=${encodeURIComponent(editId)}` : '/postedit';
              return (
                <Link 
                  to={href} 
                  state={{ refresh: false }} // 수정 페이지로 이동 시에는 새로고침 불필요
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
                  게시글 수정
                </Link>
              );
            })()}
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-gray-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  );
}

function Row({ label, value, className = "" }) {
  return (
    <p className={`text-[16px] text-gray-800 ${className}`}>
      {label && <span className="mr-2 font-semibold text-gray-600">{label}:</span>}
      <span>{value}</span>
    </p>
  );
}

function PaperPlaneIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}
