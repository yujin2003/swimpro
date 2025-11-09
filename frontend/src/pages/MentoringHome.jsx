import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import { usePosts } from "../store/posts.jsx";
import { useUser } from "../store/user.jsx";
import TopNav from "../components/TopNav";
import { postsAPI } from "../services/api.js";

export default function MentoringHome() {
  const { posts, loading, error, loadPosts } = usePosts();
  const [q, setQ] = useState("");
  const [bestPosts, setBestPosts] = useState([]);
  const [bestPostsLoading, setBestPostsLoading] = useState(false);
  const [recommendedPosts, setRecommendedPosts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false); // refresh 상태 추적
  const bestPostsLoadedRef = useRef(false); // 추천 게시글 로드 여부 추적 (무한 루프 방지)
  const wasRefreshingRef = useRef(false); // refresh 상태 추적 (refresh 완료 후 추천 게시글 다시 로드용)
  const location = useLocation();

  // 컴포넌트 마운트 및 경로 변경 시 로그
  useEffect(() => {
    console.log('🚀 MentoringHome 컴포넌트 마운트/업데이트:', {
      pathname: location.pathname,
      search: location.search,
      state: location.state,
      postsCount: posts.length
    });
  }, [location.pathname, location.search, location.state, posts.length]);

  // 수정/삭제/생성 후 돌아왔을 때 강제 새로고침
  useEffect(() => {
    if (location.state?.refresh) {
      console.log('🔄 MentoringHome 새로고침 요청 감지');
      setIsRefreshing(true); // refresh 시작
      bestPostsLoadedRef.current = false; // 추천 게시글 다시 로드 가능하도록 리셋
      // 즉시 state 제거하여 중복 실행 방지
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      // 약간의 지연을 두어 state 제거 후 로드 (레이아웃 시프트 최소화)
      const timer = setTimeout(async () => {
        await loadPosts();
        // 로드 완료 후 refresh 상태 해제 (약간의 지연 후)
        setTimeout(() => {
          wasRefreshingRef.current = true; // refresh 완료 표시
          setIsRefreshing(false);
          console.log('✅ MentoringHome 새로고침 완료');
        }, 200); // 지연 시간 증가하여 안정성 향상
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [location.state?.refresh, loadPosts]);

  // 게시판1 페이지 로드 시 sessionStorage에서 newPostId 확인 및 추천 게시글 요청
  useEffect(() => {
    // sessionStorage에서 방금 만든 게시글 ID 확인
    const storedNewPostId = sessionStorage.getItem('newPostIdForRecommends');
    
    if (storedNewPostId) {
      const newPostId = Number(storedNewPostId);
      console.log('💡 sessionStorage에서 newPostId 발견, 추천 게시글 요청 시작:', newPostId);
      
      // 즉시 추천 게시글 API 호출
      const loadRecommendedPosts = async () => {
        try {
          console.log('📤 추천 게시글 API 호출: GET /api/posts/' + newPostId + '/recommend');
          const data = await postsAPI.getRecommendedPosts(newPostId);
          console.log('✅ 추천 게시글 로드 성공:', data);
          console.log('✅ 추천 게시글 개수:', data?.length || 0);
          setRecommendedPosts(Array.isArray(data) ? data : []);
          
          // 중요: 추천 게시글 요청 후 sessionStorage에서 삭제
          sessionStorage.removeItem('newPostIdForRecommends');
          console.log('🗑️ sessionStorage에서 newPostId 삭제 완료');
        } catch (err) {
          console.error('❌ 추천 게시글 로드 실패:', err);
          setRecommendedPosts([]);
          // 에러 발생 시에도 sessionStorage에서 삭제
          sessionStorage.removeItem('newPostIdForRecommends');
        }
      };
      
      loadRecommendedPosts();
    } else {
      console.log('💡 sessionStorage에 newPostId 없음, 추천 게시글 요청하지 않음');
    }
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // refresh 완료 후 추천 게시글 다시 로드
  useEffect(() => {
    // refresh가 완료되었고 (isRefreshing이 false로 변경), 이전에 refresh 중이었고, 로딩이 완료되었을 때
    if (!isRefreshing && wasRefreshingRef.current && !loading && posts.length > 0) {
      console.log('💡 refresh 완료 후 추천 게시글 다시 로드 시작');
      wasRefreshingRef.current = false;
      bestPostsLoadedRef.current = false; // 다시 로드 가능하도록 리셋
      
      // 가장 최근 게시글의 ID 찾기
      const sortedPosts = [...posts].sort((a, b) => {
        const dateA = new Date(a.created_at || a.event_datetime || 0);
        const dateB = new Date(b.created_at || b.event_datetime || 0);
        return dateB - dateA;
      });
      const latestPostId = Number(sortedPosts[0].post_id || sortedPosts[0].id);
      
      if (latestPostId) {
        setBestPostsLoading(true);
        postsAPI.getRecommendedPosts(latestPostId)
          .then(data => {
            console.log('✅ refresh 후 추천 게시글 로드 성공:', data);
            setBestPosts(Array.isArray(data) && data.length > 0 ? data : sortedPosts.slice(0, 3));
            bestPostsLoadedRef.current = true;
            setBestPostsLoading(false);
          })
          .catch(err => {
            console.error('❌ refresh 후 추천 게시글 로드 실패:', err);
            setBestPosts(sortedPosts.slice(0, 3));
            bestPostsLoadedRef.current = true;
            setBestPostsLoading(false);
          });
      }
    }
  }, [isRefreshing, loading, posts.length]);

  // 추천 게시글 로드 (가장 최근 게시글의 ID 사용, sessionStorage에 newPostId가 없을 때만)
  useEffect(() => {
    // refresh 중이면 실행하지 않음 (레이아웃 시프트 방지)
    if (location.state?.refresh || isRefreshing) {
      console.log('💡 refresh 중이어서 추천 게시글 로드 스킵');
      return;
    }
    
    // 로딩 중이면 실행하지 않음
    if (loading) {
      console.log('💡 로딩 중이어서 추천 게시글 로드 스킵');
      return;
    }
    
    // sessionStorage에 newPostId가 있으면 이 함수는 실행하지 않음 (별도 useEffect에서 처리)
    const storedNewPostId = sessionStorage.getItem('newPostIdForRecommends');
    if (storedNewPostId) {
      console.log('💡 sessionStorage에 newPostId가 있어서 일반 추천 게시글 로드 스킵');
      return;
    }
    
    // 이미 추천 게시글을 로드했으면 다시 로드하지 않음 (불필요한 API 호출 방지)
    if (bestPostsLoadedRef.current) {
      console.log('💡 이미 추천 게시글을 로드했어서 다시 로드하지 않음');
      return;
    }
    
    // refresh 시작 시 wasRefreshingRef 표시
    if (location.state?.refresh) {
      wasRefreshingRef.current = true;
    }
    
    const loadBestPosts = async () => {
      bestPostsLoadedRef.current = true; // 로드 시작 표시
      setBestPostsLoading(true);
      try {
        // 가장 최근 게시글의 ID 찾기
        let latestPostId = null;
        if (posts && posts.length > 0) {
          const sortedPosts = [...posts].sort((a, b) => {
            const dateA = new Date(a.created_at || a.event_datetime || 0);
            const dateB = new Date(b.created_at || b.event_datetime || 0);
            return dateB - dateA;
          });
          latestPostId = Number(sortedPosts[0].post_id || sortedPosts[0].id);
        }
        
        // 게시글이 없으면 추천 게시글 로드하지 않음
        if (!latestPostId) {
          console.log('💡 게시글이 없어서 추천 게시글 로드하지 않음');
          setBestPosts([]);
          setBestPostsLoading(false);
          return;
        }
        
        console.log('💡 추천 게시글 로드 시작... (postId:', latestPostId, ')');
        
        let data = [];
        try {
          console.log('📤 백엔드로 API 요청 전송: GET /api/posts/' + latestPostId + '/recommend');
          data = await postsAPI.getRecommendedPosts(latestPostId);
          console.log('✅ 백엔드 응답 받음:', data);
          console.log('💡 추천 게시글 로드 성공:', data);
          console.log('💡 추천 게시글 개수:', data?.length || 0);
        } catch (err) {
          console.error('❌ 백엔드 API 호출 실패:', err);
          console.warn('⚠️ 추천 게시글 로드 실패, 최신 게시글 상위 3개 사용:', err);
          // 추천 게시글 로드 실패 시 최신 게시글 상위 3개를 추천 게시글로 사용
          if (posts && posts.length > 0) {
            const sortedPosts = [...posts].sort((a, b) => {
              const dateA = new Date(a.created_at || a.event_datetime || 0);
              const dateB = new Date(b.created_at || b.event_datetime || 0);
              return dateB - dateA;
            });
            data = sortedPosts.slice(0, 3);
          }
        }
        
        // 추천 게시글이 비어있으면 최신 게시글 상위 3개 사용
        if (!data || data.length === 0) {
          console.log('⚠️ 추천 게시글이 비어있어서 최신 게시글 상위 3개 사용');
          if (posts && posts.length > 0) {
            const sortedPosts = [...posts].sort((a, b) => {
              const dateA = new Date(a.created_at || a.event_datetime || 0);
              const dateB = new Date(b.created_at || b.event_datetime || 0);
              return dateB - dateA;
            });
            data = sortedPosts.slice(0, 3);
          }
        }
        
        console.log('💡 추천 게시글 최종 데이터:', data);
        console.log('💡 추천 게시글 개수:', data?.length || 0);
        setBestPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('❌ 추천 게시글 로드 실패:', err);
        console.error('❌ 에러 상세:', err.message, err.stack);
        // 에러 발생 시에도 최신 게시글 상위 3개 사용
        if (posts && posts.length > 0) {
          const sortedPosts = [...posts].sort((a, b) => {
            const dateA = new Date(a.created_at || a.event_datetime || 0);
            const dateB = new Date(b.created_at || b.event_datetime || 0);
            return dateB - dateA;
          });
          setBestPosts(sortedPosts.slice(0, 3));
        } else {
          setBestPosts([]);
        }
      } finally {
        setBestPostsLoading(false);
        console.log('💡 추천 게시글 로드 완료, 상태:', { loading: false, count: bestPosts.length });
      }
    };
    
    // posts가 로드된 후에 실행 (loading이 false이고 posts가 있을 때만)
    // refresh 중일 때는 실행하지 않음 (레이아웃 시프트 방지)
    if (!loading && !isRefreshing && posts.length > 0 && !bestPostsLoadedRef.current) {
      loadBestPosts();
    }
  }, [posts.length, loading, location.state?.refresh, isRefreshing]);

  const filtered = useMemo(
    () =>
      posts
        .filter((p) => {
          // 검색어 필터
          return q === "" || 
            p.title.toLowerCase().includes(q.toLowerCase()) ||
            p.body.toLowerCase().includes(q.toLowerCase()) ||
            (p.region || p.placeText || "").toLowerCase().includes(q.toLowerCase()) ||
            p.dateText.toLowerCase().includes(q.toLowerCase()) ||
            (p.stroke && p.stroke.toLowerCase().includes(q.toLowerCase()));
        })
        .sort((a, b) => {
          // PostForm에서 작성된 게시글을 최신순으로 정렬
          const aId = a.id || '';
          const bId = b.id || '';
          
          if (aId.startsWith('form_') && bId.startsWith('form_')) {
            return new Date(b.createdAt || b.editedAt || 0) - new Date(a.createdAt || a.editedAt || 0);
          }
          if (aId.startsWith('form_')) return -1;
          if (bId.startsWith('form_')) return 1;
          return 0;
        }),
    [posts, q]
  );

  return (
    <div className="min-h-screen w-full bg-[#3F2E8C] text-gray-900">
      <TopNav />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-10 pt-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* 새 게시글 작성 버튼 */}
          <div className="flex justify-end">
            <Link
              to="/postform"
              onClick={(e) => {
                console.log('🔘 게시글 작성 버튼 클릭');
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-lg relative z-10"
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 게시글 작성
            </Link>
          </div>
          
          {/* 에러 메시지 */}
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-600">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">오류 발생</span>
              </div>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          )}
          
          {/* 로딩 상태 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="text-white">게시글을 불러오는 중...</span>
              </div>
            </div>
          ) : (
                   <LeftList 
                     posts={filtered} 
                     q={q} 
                     setQ={setQ} 
                     bestPosts={bestPosts} 
                     bestPostsLoading={bestPostsLoading}
                     recommendedPosts={recommendedPosts}
                   />
          )}
        </div>
        <RightPanel />
      </div>
    </div>
  );
}

function LeftList({ posts, q, setQ, bestPosts, bestPostsLoading, recommendedPosts }) {
  return (
    <section className="rounded-2xl bg-white/10 p-5 backdrop-blur">
      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-full bg-white/90 px-5 py-3 shadow">
        <SearchIcon className="h-5 w-5 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-gray-400"
        />
      </div>

      {/* 추천 게시글 섹션 (게시글 작성 후 받은 추천 게시글 우선 표시) */}
      {recommendedPosts.length > 0 ? (
        <div className="mb-4 rounded-xl border-2 border-green-500 bg-white/90 p-4 shadow">
          <h2 className="mb-3 text-lg font-bold text-green-600">💡 추천 게시글</h2>
          <p className="mb-3 text-sm text-gray-600">작성하신 게시글과 매칭되는 추천 게시글입니다.</p>
          <div className="space-y-2">
            {recommendedPosts.map((post, index) => {
              const postId = post.id || post.post_id;
              
              // 메인 게시글 목록에서 같은 ID의 게시글을 찾아서 동일한 데이터 사용
              const mainPost = posts.find(p => {
                const mainPostId = p.post_id || p.id;
                return mainPostId && postId && String(mainPostId) === String(postId);
              });
              
              // 메인 게시글이 있으면 메인 게시글 데이터 사용, 없으면 추천 게시글 데이터 사용
              const displayPost = mainPost || post;
              const postTitle = displayPost.title || '제목 없음';
              
                    // 날짜/시간 포맷팅 (메인 게시글 목록과 완전히 동일한 로직)
                    let displayTime = '';
                    
                    // 1순위: event_datetime 사용 (+ event_end_time 또는 event_end_datetime 포함)
                    if (displayPost.event_datetime) {
                      try {
                        const eventDate = new Date(displayPost.event_datetime);
                        if (!isNaN(eventDate.getTime())) {
                          const startTimeFormatted = eventDate.toLocaleString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                          
                          // 종료 시간이 있으면 추가 표시
                          if (displayPost.event_end_time || displayPost.event_end_datetime) {
                            try {
                              // event_end_time이 HH:mm 형식이면 event_date와 조합
                              let endDateTime;
                              if (displayPost.event_end_time && displayPost.event_date) {
                                const normalizedEndTime = displayPost.event_end_time.includes(':') 
                                  ? displayPost.event_end_time 
                                  : `${displayPost.event_end_time.slice(0, 2)}:${displayPost.event_end_time.slice(2)}`;
                                endDateTime = new Date(`${displayPost.event_date}T${normalizedEndTime}:00`);
                              } else if (displayPost.event_end_datetime) {
                                endDateTime = new Date(displayPost.event_end_datetime);
                              }
                              
                              if (endDateTime && !isNaN(endDateTime.getTime())) {
                                const endTimeFormatted = endDateTime.toLocaleString('ko-KR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                });
                                displayTime = `${startTimeFormatted} - ${endTimeFormatted}`;
                              } else {
                                displayTime = startTimeFormatted;
                              }
                            } catch (err) {
                              displayTime = startTimeFormatted;
                            }
                          } else {
                            displayTime = startTimeFormatted;
                          }
                        }
                      } catch (err) {
                        console.error('❌ event_datetime 파싱 실패:', err, post.event_datetime);
                      }
                    }
                    
                    // 2순위: event_date + event_start_time (+ event_end_time) 조합
                    if (!displayTime && post.event_date && post.event_start_time) {
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
                          if (post.event_end_time || post.event_end_datetime) {
                            try {
                              let endDateTime;
                              if (post.event_end_time) {
                                const normalizedEndTime = post.event_end_time.includes(':') 
                                  ? post.event_end_time 
                                  : `${post.event_end_time.slice(0, 2)}:${post.event_end_time.slice(2)}`;
                                const endIsoString = `${post.event_date}T${normalizedEndTime}:00`;
                                endDateTime = new Date(endIsoString);
                              } else if (post.event_end_datetime) {
                                endDateTime = new Date(post.event_end_datetime);
                              }
                              
                              if (endDateTime && !isNaN(endDateTime.getTime())) {
                                const endTimeFormatted = endDateTime.toLocaleString('ko-KR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                });
                                displayTime = `${startTimeFormatted} - ${endTimeFormatted}`;
                              } else {
                                displayTime = startTimeFormatted;
                              }
                            } catch (err) {
                              displayTime = startTimeFormatted;
                            }
                          } else {
                            displayTime = startTimeFormatted;
                          }
                        }
                      } catch (err) {
                        console.error('❌ 날짜 파싱 실패:', err, { event_date: displayPost.event_date, event_start_time: displayPost.event_start_time });
                      }
                    }
                    
                    // 2-1순위: date + startTime 조합 (기존 게시글용 fallback)
                    if (!displayTime && displayPost.date && displayPost.startTime) {
                      try {
                        const normalizedTime = displayPost.startTime.includes(':') 
                          ? displayPost.startTime 
                          : `${displayPost.startTime.slice(0, 2)}:${displayPost.startTime.slice(2)}`;
                        const isoString = `${displayPost.date}T${normalizedTime}:00`;
                        const dateTime = new Date(isoString);
                        
                        if (!isNaN(dateTime.getTime())) {
                          displayTime = dateTime.toLocaleString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                          
                          // 종료 시간이 있으면 추가
                          if (displayPost.endTime) {
                            try {
                              const normalizedEndTime = displayPost.endTime.includes(':') 
                                ? displayPost.endTime 
                                : `${displayPost.endTime.slice(0, 2)}:${displayPost.endTime.slice(2)}`;
                              const endIsoString = `${displayPost.date}T${normalizedEndTime}:00`;
                              const endDateTime = new Date(endIsoString);
                              
                              if (!isNaN(endDateTime.getTime())) {
                                const endTimeFormatted = endDateTime.toLocaleString('ko-KR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                });
                                displayTime = `${displayTime} - ${endTimeFormatted}`;
                              }
                            } catch (err) {
                              // endTime 파싱 실패해도 시작 시간은 유지
                            }
                          }
                        }
                      } catch (err) {
                        console.error('❌ date+startTime 파싱 실패:', err);
                      }
                    }
                    
                    // 3순위: dateText 사용
                    if (!displayTime && displayPost.dateText) {
                      displayTime = displayPost.dateText;
                    }
                    
                    // 4순위: created_at 사용 (작성 일시 - 절대 마지막 수단)
                    if (!displayTime && displayPost.created_at) {
                      displayTime = new Date(displayPost.created_at).toLocaleString('ko-KR', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });
                    }
              
              // 활동 종류 (category/stroke) - 메인 게시글 데이터 사용
              const categoryText = displayPost.category || displayPost.stroke || '';
              
              // 위치 - 메인 게시글 데이터 사용
              const placeText = displayPost.location || displayPost.region || '';
              
              // 거리/시간 (distance가 있으면 표시) - 메인 게시글 데이터 사용
              const distanceText = displayPost.distance ? `${displayPost.distance}m` : '';
              
              return (
                <Link
                  key={postId || `recommended-${index}`}
                  to={postId ? `/mentoring/${postId}` : '#'}
                  className={[
                    "flex items-center gap-3 rounded-lg p-3 transition-colors",
                    index % 2 === 0
                      ? "bg-white"
                      : "bg-white"
                  ].join(" ")}
                >
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <div className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    index % 2 === 1 ? "bg-blue-500 text-white" : "bg-blue-500 text-white"
                  ].join(" ")}>
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="text-[14px] font-medium">{postTitle}</p>
                    {displayTime && (
                      <p className="text-[13px] opacity-90">
                        일시: {displayTime}
                      </p>
                    )}
                    <div className="flex gap-2 mt-1">
                      {categoryText && categoryText !== "기타" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          🏊‍♂️ {categoryText}
                        </span>
                      )}
                      {placeText && placeText !== "기타" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          📍 {placeText}
                        </span>
                      )}
                    </div>
                  </div>
                  {distanceText && (
                    <div className="text-[13px] text-gray-400">
                      {distanceText}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        /* 베스트 게시글 섹션 (추천 게시글이 없을 때만 표시) */
        (() => {
          console.log('🎨 베스트 게시글 UI 렌더링:', { 
            loading: bestPostsLoading, 
            count: bestPosts.length,
            posts: bestPosts 
          });
          
          if (bestPostsLoading) {
            return (
              <div className="mb-4 rounded-xl border-2 border-blue-500 bg-white/90 p-4 shadow">
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-600">추천 게시글 로딩 중...</span>
                </div>
              </div>
            );
          }
          
          if (bestPosts.length > 0) {
            return (
              <div className="mb-4 rounded-xl border-2 border-blue-500 bg-white/90 p-4 shadow">
                <h2 className="mb-3 text-lg font-bold text-blue-600">추천 게시글</h2>
                <div className="space-y-2">
                  {bestPosts.map((post, index) => {
                    const postId = post.id || post.post_id;
                    
                    // 메인 게시글 목록에서 같은 ID의 게시글을 찾아서 동일한 데이터 사용
                    const mainPost = posts.find(p => {
                      const mainPostId = p.post_id || p.id;
                      return mainPostId && postId && String(mainPostId) === String(postId);
                    });
                    
                    // 메인 게시글이 있으면 메인 게시글 데이터 사용, 없으면 추천 게시글 데이터 사용
                    const displayPost = mainPost || post;
                    const postTitle = displayPost.title || '제목 없음';
                    
                    // 날짜/시간 포맷팅 (메인 게시글 목록과 완전히 동일한 로직)
                    let displayTime = '';
                    
                    // 1순위: event_datetime 사용 (+ event_end_time 또는 event_end_datetime 포함)
                    if (displayPost.event_datetime) {
                      try {
                        const eventDate = new Date(displayPost.event_datetime);
                        if (!isNaN(eventDate.getTime())) {
                          const startTimeFormatted = eventDate.toLocaleString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                          
                          // 종료 시간이 있으면 추가 표시
                          if (displayPost.event_end_time || displayPost.event_end_datetime) {
                            try {
                              // event_end_time이 HH:mm 형식이면 event_date와 조합
                              let endDateTime;
                              if (displayPost.event_end_time && displayPost.event_date) {
                                const normalizedEndTime = displayPost.event_end_time.includes(':') 
                                  ? displayPost.event_end_time 
                                  : `${displayPost.event_end_time.slice(0, 2)}:${displayPost.event_end_time.slice(2)}`;
                                endDateTime = new Date(`${displayPost.event_date}T${normalizedEndTime}:00`);
                              } else if (displayPost.event_end_datetime) {
                                endDateTime = new Date(displayPost.event_end_datetime);
                              }
                              
                              if (endDateTime && !isNaN(endDateTime.getTime())) {
                                const endTimeFormatted = endDateTime.toLocaleString('ko-KR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                });
                                displayTime = `${startTimeFormatted} - ${endTimeFormatted}`;
                              } else {
                                displayTime = startTimeFormatted;
                              }
                            } catch (err) {
                              displayTime = startTimeFormatted;
                            }
                          } else {
                            displayTime = startTimeFormatted;
                          }
                        }
                      } catch (err) {
                        console.error('❌ event_datetime 파싱 실패:', err, post.event_datetime);
                      }
                    }
                    
                    // 2순위: event_date + event_start_time (+ event_end_time) 조합
                    if (!displayTime && post.event_date && post.event_start_time) {
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
                          if (post.event_end_time || post.event_end_datetime) {
                            try {
                              let endDateTime;
                              if (post.event_end_time) {
                                const normalizedEndTime = post.event_end_time.includes(':') 
                                  ? post.event_end_time 
                                  : `${post.event_end_time.slice(0, 2)}:${post.event_end_time.slice(2)}`;
                                const endIsoString = `${post.event_date}T${normalizedEndTime}:00`;
                                endDateTime = new Date(endIsoString);
                              } else if (post.event_end_datetime) {
                                endDateTime = new Date(post.event_end_datetime);
                              }
                              
                              if (endDateTime && !isNaN(endDateTime.getTime())) {
                                const endTimeFormatted = endDateTime.toLocaleString('ko-KR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                });
                                displayTime = `${startTimeFormatted} - ${endTimeFormatted}`;
                              } else {
                                displayTime = startTimeFormatted;
                              }
                            } catch (err) {
                              displayTime = startTimeFormatted;
                            }
                          } else {
                            displayTime = startTimeFormatted;
                          }
                        }
                      } catch (err) {
                        console.error('❌ 날짜 파싱 실패:', err, { event_date: displayPost.event_date, event_start_time: displayPost.event_start_time });
                      }
                    }
                    
                    // 2-1순위: date + startTime 조합 (기존 게시글용 fallback)
                    if (!displayTime && displayPost.date && displayPost.startTime) {
                      try {
                        const normalizedTime = displayPost.startTime.includes(':') 
                          ? displayPost.startTime 
                          : `${displayPost.startTime.slice(0, 2)}:${displayPost.startTime.slice(2)}`;
                        const isoString = `${displayPost.date}T${normalizedTime}:00`;
                        const dateTime = new Date(isoString);
                        
                        if (!isNaN(dateTime.getTime())) {
                          displayTime = dateTime.toLocaleString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                          
                          // 종료 시간이 있으면 추가
                          if (displayPost.endTime) {
                            try {
                              const normalizedEndTime = displayPost.endTime.includes(':') 
                                ? displayPost.endTime 
                                : `${displayPost.endTime.slice(0, 2)}:${displayPost.endTime.slice(2)}`;
                              const endIsoString = `${displayPost.date}T${normalizedEndTime}:00`;
                              const endDateTime = new Date(endIsoString);
                              
                              if (!isNaN(endDateTime.getTime())) {
                                const endTimeFormatted = endDateTime.toLocaleString('ko-KR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                });
                                displayTime = `${displayTime} - ${endTimeFormatted}`;
                              }
                            } catch (err) {
                              // endTime 파싱 실패해도 시작 시간은 유지
                            }
                          }
                        }
                      } catch (err) {
                        console.error('❌ date+startTime 파싱 실패:', err);
                      }
                    }
                    
                    // 3순위: dateText 사용
                    if (!displayTime && displayPost.dateText) {
                      displayTime = displayPost.dateText;
                    }
                    
                    // 4순위: created_at 사용 (작성 일시 - 절대 마지막 수단)
                    if (!displayTime && displayPost.created_at) {
                      displayTime = new Date(displayPost.created_at).toLocaleString('ko-KR', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });
                    }
                    
                    // 활동 종류 (category/stroke) - 메인 게시글 데이터 사용
                    const categoryText = displayPost.category || displayPost.stroke || '';
                    
                    // 위치 - 메인 게시글 데이터 사용
                    const placeText = displayPost.location || displayPost.region || '';
                    
                    // 거리/시간 (distance가 있으면 표시) - 메인 게시글 데이터 사용
                    const distanceText = displayPost.distance ? `${displayPost.distance}m` : '';
                    
                    return (
                      <Link
                        key={postId || `best-${index}`}
                        to={postId ? `/mentoring/${postId}` : '#'}
                        className={[
                          "flex items-center gap-3 rounded-lg p-3 transition-colors",
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-white"
                        ].join(" ")}
                      >
                        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                        <div className={[
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                          index % 2 === 1 ? "bg-blue-500 text-white" : "bg-blue-500 text-white"
                        ].join(" ")}>
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1 leading-tight">
                          <p className="text-[14px] font-medium">{postTitle}</p>
                          {displayTime && (
                            <p className="text-[13px] opacity-90">
                              일시: {displayTime}
                            </p>
                          )}
                          <div className="flex gap-2 mt-1">
                            {categoryText && categoryText !== "기타" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                🏊‍♂️ {categoryText}
                              </span>
                            )}
                            {placeText && placeText !== "기타" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                📍 {placeText}
                              </span>
                            )}
                          </div>
                        </div>
                        {distanceText && (
                          <div className="text-[13px] text-gray-400">
                            {distanceText}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }
          
          // 베스트 게시글이 없어도 로딩이 완료되었으면 빈 섹션 표시하지 않음
          return null;
        })()
      )}

      {/* List */}
      <div className="rounded-xl bg-white/90 p-2 shadow">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-lg font-medium mb-2">아직 게시글이 없습니다</p>
            <p className="text-sm">새 게시글을 작성해보세요!</p>
          </div>
        ) : (
          <ul className="divide-y">
            {posts.map((p, i) => {
              console.log(`📝 게시글 ${i} (post_id: ${p.post_id || p.id}):`, { 
                id: p.post_id || p.id, 
                title: p.title, 
                'event_date': p.event_date,
                'event_start_time': p.event_start_time,
                'event_end_time': p.event_end_time,
                'event_datetime': p.event_datetime,
                'date': p.date,
                'startTime': p.startTime,
                'endTime': p.endTime,
                'created_at': p.created_at,
                type: typeof p.post_id,
                hasId: !!p.post_id,
                idLength: p.post_id ? p.post_id.toString().length : 0
              });
              console.log(`📝 게시글 ${i} 전체 객체:`, JSON.stringify(p, null, 2));
              
              // ID가 없으면 경고
              if (!p.post_id) {
                console.warn(`⚠️ 게시글 ${i}에 ID가 없습니다:`, p);
              }

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

              const userAvatar = getRandomAvatar();
              
              return (
              <li key={p.post_id || `post-${i}`}>
              <Link
                to={p.post_id ? `/mentoring/${p.post_id}` : '#'}
                onClick={(e) => {
                  if (!p.post_id) {
                    e.preventDefault();
                    alert('게시글 ID가 없습니다.');
                  } else {
                    console.log('🔘 게시글 링크 클릭:', p.post_id);
                  }
                }}
                className={[
                  'relative',
                  'z-10',
                  "flex items-center gap-4 rounded-lg px-4 py-4",
                  i % 2 === 1
                    ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                    : "bg-white"
                ].join(" ")}
              >
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <div className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl",
                  i % 2 === 1 ? "bg-white/20" : "bg-yellow-100"
                ].join(" ")}>
                  {userAvatar}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="text-[14px] font-medium">{p.title}</p>
                  <p className="text-[13px] opacity-90">
                    일시: {(() => {
                      // 백엔드에서 받은 일시 정보 로깅
                      console.log(`📅 MentoringHome 게시글 ${i} (post_id: ${p.post_id || p.id}) 일시 필드:`, {
                        'event_datetime': p.event_datetime,
                        'event_end_datetime': p.event_end_datetime,
                        'event_date': p.event_date,
                        'event_start_time': p.event_start_time,
                        'event_end_time': p.event_end_time,
                        'date': p.date,
                        'startTime': p.startTime,
                        'endTime': p.endTime,
                        'dateText': p.dateText,
                        'created_at': p.created_at,
                        '전체 객체': p
                      });
                      
                      // 우선순위: event_datetime > event_date+event_start_time > date+startTime > dateText > created_at
                      let displayTime = '';
                      
                      // 1순위: event_datetime 사용 (+ event_end_time 또는 event_end_datetime 포함)
                      if (p.event_datetime) {
                        try {
                          const eventDate = new Date(p.event_datetime);
                          if (!isNaN(eventDate.getTime())) {
                            const startTimeFormatted = eventDate.toLocaleString('ko-KR', { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            });
                            
                            // 종료 시간이 있으면 추가 표시
                            if (p.event_end_time || p.event_end_datetime) {
                              try {
                                // event_end_time이 HH:mm 형식이면 event_date와 조합
                                let endDateTime;
                                if (p.event_end_time && p.event_date) {
                                  const normalizedEndTime = p.event_end_time.includes(':') 
                                    ? p.event_end_time 
                                    : `${p.event_end_time.slice(0, 2)}:${p.event_end_time.slice(2)}`;
                                  endDateTime = new Date(`${p.event_date}T${normalizedEndTime}:00`);
                                } else if (p.event_end_datetime) {
                                  endDateTime = new Date(p.event_end_datetime);
                                }
                                
                                if (endDateTime && !isNaN(endDateTime.getTime())) {
                                  const endTimeFormatted = endDateTime.toLocaleString('ko-KR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  });
                                  displayTime = `${startTimeFormatted} - ${endTimeFormatted}`;
                                } else {
                                  displayTime = startTimeFormatted;
                                }
                              } catch (err) {
                                displayTime = startTimeFormatted;
                              }
                            } else {
                              displayTime = startTimeFormatted;
                            }
                          }
                        } catch (err) {
                          console.error(`❌ event_datetime 파싱 실패:`, err, p.event_datetime);
                        }
                      }
                      
                      // 2순위: event_date + event_start_time (+ event_end_time) 조합
                      if (!displayTime && p.event_date && p.event_start_time) {
                        try {
                          // 시간 형식 정규화 (HH:mm 형식 보장)
                          const normalizedStartTime = p.event_start_time.includes(':') 
                            ? p.event_start_time 
                            : `${p.event_start_time.slice(0, 2)}:${p.event_start_time.slice(2)}`;
                          const isoString = `${p.event_date}T${normalizedStartTime}:00`;
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
                            if (p.event_end_time || p.event_end_datetime) {
                              try {
                                let endDateTime;
                                if (p.event_end_time) {
                                  const normalizedEndTime = p.event_end_time.includes(':') 
                                    ? p.event_end_time 
                                    : `${p.event_end_time.slice(0, 2)}:${p.event_end_time.slice(2)}`;
                                  const endIsoString = `${p.event_date}T${normalizedEndTime}:00`;
                                  endDateTime = new Date(endIsoString);
                                } else if (p.event_end_datetime) {
                                  endDateTime = new Date(p.event_end_datetime);
                                }
                                
                                if (endDateTime && !isNaN(endDateTime.getTime())) {
                                  const endTimeFormatted = endDateTime.toLocaleString('ko-KR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  });
                                  displayTime = `${startTimeFormatted} - ${endTimeFormatted}`;
                                } else {
                                  displayTime = startTimeFormatted;
                                }
                              } catch (err) {
                                displayTime = startTimeFormatted;
                              }
                            } else {
                              displayTime = startTimeFormatted;
                            }
                          }
                        } catch (err) {
                          console.error(`❌ 날짜 파싱 실패:`, err, { event_date: p.event_date, event_start_time: p.event_start_time });
                        }
                      }
                      
                      // 2-1순위: date + startTime 조합 (기존 게시글용 fallback)
                      if (!displayTime && p.date && p.startTime) {
                        try {
                          const normalizedTime = p.startTime.includes(':') 
                            ? p.startTime 
                            : `${p.startTime.slice(0, 2)}:${p.startTime.slice(2)}`;
                          const isoString = `${p.date}T${normalizedTime}:00`;
                          const dateTime = new Date(isoString);
                          
                          if (!isNaN(dateTime.getTime())) {
                            displayTime = dateTime.toLocaleString('ko-KR', { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            });
                          }
                        } catch (err) {
                          console.error('❌ date+startTime 파싱 실패:', err);
                        }
                      }
                      
                      // 3순위: dateText 사용
                      if (!displayTime && p.dateText) {
                        displayTime = p.dateText;
                      }
                      
                      // 4순위: created_at 사용 (작성 일시 - 절대 마지막 수단)
                      if (!displayTime && p.created_at) {
                        displayTime = new Date(p.created_at).toLocaleString('ko-KR', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        });
                        console.error(`⚠️⚠️ MentoringHome 게시글 ${i} (post_id: ${p.post_id || p.id}) 일시: created_at 사용 (fallback) - 선택한 일시 정보가 없음!`, {
                          'event_datetime': p.event_datetime,
                          'event_end_datetime': p.event_end_datetime,
                          'event_date': p.event_date,
                          'event_start_time': p.event_start_time,
                          'event_end_time': p.event_end_time,
                          'date': p.date,
                          'startTime': p.startTime,
                          'endTime': p.endTime,
                          'dateText': p.dateText,
                          'created_at': p.created_at,
                          '전체 객체 키': Object.keys(p),
                          '전체 객체': JSON.stringify(p, null, 2)
                        });
                      }
                      
                      return displayTime || '';
                    })()}
                  </p>
                  <div className="flex gap-2 mt-1">
                    {(p.category || p.stroke) && (p.category !== "기타" && p.stroke !== "기타") && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        🏊‍♂️ {p.category || p.stroke}
                      </span>
                    )}
                    {(p.location || p.region) && (p.location !== "기타" && p.region !== "기타") && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        📍 {p.location || p.region}
                      </span>
                    )}
                  </div>
                </div>
                <span className={["text-[11px]", i % 2 === 1 ? "text-white/80" : "text-gray-500"].join(" ")}>
                  {p.created_at 
                    ? Math.floor((new Date() - new Date(p.created_at)) / (1000 * 60)) + 'm'
                    : (p.minutesAgo ? p.minutesAgo + 'm' : '')
                  }
                </span>
              </Link>
            </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function RightPanel() {
  const { user, logout, isLoggedIn } = useUser();
  
  return (
    <aside className="rounded-2xl bg-white/90 p-6 shadow flex flex-col h-full" style={{ position: 'relative', zIndex: 100 }}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-xl">
          {user?.avatar || '👤'}
        </div>
        <div>
          <div className="font-semibold">{user?.name || user?.username || '게스트'}</div>
          <div className="text-sm text-gray-500">{user?.email || '로그인이 필요합니다'}</div>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        <SideItem icon={<HomeIcon />} label="Home" to="/" />
        <SideItem icon={<MessageIcon />} label="DM" to="/chat" />
      </nav>

      <div className="border-t pt-4 mt-auto">
        <p className="text-[15px] text-gray-700 font-medium leading-relaxed">
          Dive Deeper into<br />
          Your Swimming Journey
        </p>
      </div>
    </aside>
  );
}

function SideItem({ icon, label, to }) {
  const navigate = useNavigate();
  
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔘 SideItem 클릭:', { label, to });
    
    if (to) {
      try {
        navigate(to);
        console.log('✅ navigate 호출 완료:', to);
      } catch (error) {
        console.error('❌ navigate 실패:', error);
        window.location.href = to;
      }
    } else {
      alert(`${label} 클릭`);
    }
  };
  
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[15px] hover:bg-gray-100"
      onClick={handleClick}
      style={{
        pointerEvents: 'auto',
        cursor: 'pointer',
        zIndex: 10,
        position: 'relative'
      }}
    >
      <span className="inline-flex h-5 w-5 items-center justify-center text-gray-600">
        {icon}
      </span>
      <span className="text-gray-800">{label}</span>
    </button>
  );
}

/* --------------------------------- Icons ---------------------------------- */
function SearchIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10l9-7 9 7" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}
