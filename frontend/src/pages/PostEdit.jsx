import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { usePosts } from "../store/posts.jsx";
import { useUser } from "../store/user.jsx";
import { postsAPI } from "../services/api.js";
import { API_CONFIG, AUTH_CONFIG } from "../config/environment.js";
import TopNav from "../components/TopNav";

// 수영 종목 키워드
const SWIMMING_STROKES = {
  "자유형": ["자유형", "프리스타일", "freestyle"],
  "배영": ["배영", "백스트로크", "backstroke"],
  "평영": ["평영", "브레스트", "breaststroke"],
  "접영": ["접영", "버터플라이", "butterfly"],
  "혼영": ["혼영", "개인혼영", "IM", "개인메들리"],
  "자유형계영": ["자유형계영", "자유형릴레이"],
  "혼영계영": ["혼영계영", "혼영릴레이", "메들리릴레이"]
};

// 지역 키워드
const REGIONS = {
  "서울": ["서울", "강남", "강북", "강동", "강서", "송파", "서초", "마포", "용산", "영등포", "잠실"],
  "경기": ["경기", "수원", "성남", "의정부", "안양", "부천", "광명", "평택", "과천", "오산", "시흥", "군포", "의왕", "하남", "용인", "파주", "이천", "안성", "김포", "화성", "광주", "여주", "양평", "고양", "의정부", "동두천", "가평", "연천", "기흥", "수원역"],
  "인천": ["인천", "부평", "계양", "서구", "동구", "남구", "중구", "연수", "남동", "옹진"],
  "부산": ["부산", "해운대", "사하", "금정", "강서", "북구", "사상", "동래", "연제", "수영", "남구", "중구", "서구", "영도", "동구", "부산진"],
  "대구": ["대구", "수성", "달서", "달성", "북구", "서구", "남구", "중구", "동구"],
  "광주": ["광주", "서구", "남구", "북구", "동구", "광산"],
  "대전": ["대전"],
  "울산": ["울산", "남구", "동구", "북구", "중구", "울주"],
  "세종": ["세종", "세종시"],
  "강원": ["강원", "춘천", "원주", "강릉", "동해", "태백", "속초", "삼척", "홍천", "횡성", "영월", "평창", "정선", "철원", "화천", "양구", "인제", "고성", "양양"],
  "충북": ["충북", "청주", "충주", "제천", "보은", "옥천", "영동", "증평", "진천", "괴산", "음성", "단양"],
  "충남": ["충남", "천안", "공주", "보령", "아산", "서산", "논산", "계룡", "당진", "금산", "부여", "서천", "청양", "홍성", "예산", "태안"],
  "전북": ["전북", "전주", "군산", "익산", "정읍", "남원", "김제", "완주", "진안", "무주", "장수", "임실", "순창", "고창", "부안"],
  "전남": ["전남", "목포", "여수", "순천", "나주", "광양", "담양", "곡성", "구례", "고흥", "보성", "화순", "장흥", "강진", "해남", "영암", "무안", "함평", "영광", "장성", "완도", "진도", "신안"],
  "경북": ["경북", "포항", "경주", "김천", "안동", "구미", "영주", "영천", "상주", "문경", "경산", "군위", "의성", "청송", "영양", "영덕", "청도", "고령", "성주", "칠곡", "예천", "봉화", "울진", "울릉"],
  "경남": ["경남", "창원", "진주", "통영", "사천", "김해", "밀양", "거제", "양산", "의령", "함안", "창녕", "고성", "남해", "하동", "산청", "함양", "거창", "합천"],
  "제주": ["제주", "제주시", "서귀포", "제주도"]
};

// 수영 종목 추출 함수
function extractSwimmingStroke(text) {
  const lowerText = text.toLowerCase();
  for (const [stroke, keywords] of Object.entries(SWIMMING_STROKES)) {
    if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
        return stroke;
    }
  }
  return "기타";
}

// 지역 추출 함수
function extractRegion(text) {
  const lowerText = text.toLowerCase();
  for (const [region, keywords] of Object.entries(REGIONS)) {
    if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
        return region;
    }
  }
  return "기타";
}

// PostEdit.jsx
// Single-file React component to implement the "게시글 수정" 화면.
// - TailwindCSS is assumed to be installed in the host project.
// - Loads existing posts from localStorage key `posts_v1` and finds the post by `id` query param.
// - Allows editing date, start/end time, title, content.
// - Save updates back to localStorage (replaces the post object with same id).
// - Delete and Cancel actions were removed per requirements.


export default function PostEdit() {
  const navigate = useNavigate();
  const { id: urlId } = useParams(); // URL 파라미터에서 id 가져오기 (/postedit/:id)
  const [searchParams] = useSearchParams(); // 쿼리 파라미터도 지원 (?id=...)
  const { updatePost, syncPostFormData, loadPosts } = usePosts();
  const { user } = useUser(); // 현재 로그인한 사용자 정보
  
  // id 파싱: URL 파라미터 우선, 없으면 쿼리 파라미터
  const idParam = urlId || searchParams.get('id');
  const parsedId = idParam != null ? parseInt(String(idParam).replace(/[^0-9]/g, ''), 10) : NaN;
  const id = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [original, setOriginal] = useState(null);

  // 날짜/시간 유틸리티
  const toDateInput = (iso) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch { return ""; }
  };
  const toTimeInput = (iso) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch { return ""; }
  };
  const joinToISO = (dateStr, timeStr) => {
    try {
      if (!dateStr) return "";
      const t = timeStr && timeStr.length >= 4 ? timeStr : '00:00';
      const iso = new Date(`${dateStr}T${t}:00`).toISOString();
      return iso;
    } catch { return ""; }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        // id가 없으면 경고 후 종료
        if (!id) {
          console.error('❌ 게시글 ID가 없습니다. URL을 확인해주세요.');
          alert("수정할 게시글 ID가 없습니다. 목록에서 수정 버튼을 클릭해주세요.");
          navigate("/mentoring");
          return;
        }

        let found = null;
        let effectiveId = id;

        // 현재 로그인한 사용자 확인
        const currentUserId = user?.id || user?.userId || user?.user_id || 
                            sessionStorage.getItem(AUTH_CONFIG.USER_ID_KEY) || 
                            localStorage.getItem(AUTH_CONFIG.USER_ID_KEY);
        
        if (!currentUserId) {
          console.error('❌ 로그인한 사용자 정보가 없습니다.');
          alert("로그인이 필요합니다.");
          navigate("/signin");
          return;
        }
        
        // ⭐ 항상 서버에서 최신 데이터를 먼저 조회 (수정된 내용 반영)
        try {
          console.log('📡 서버에서 최신 게시글 조회:', effectiveId);
          const apiPost = await postsAPI.getPost(effectiveId);
          
          if (apiPost) {
            console.log('✅ 서버에서 받은 게시글 데이터:', apiPost);
            
            // 작성자 권한 확인 (user_id와 username 모두 확인)
            const postUserId = apiPost.user_id || apiPost.userId || apiPost.author_id;
            const numericCurrentUserId = Number(currentUserId);
            const numericPostUserId = Number(postUserId);
            
            // user_id로 비교
            const isMatchById = String(numericPostUserId) === String(numericCurrentUserId);
            
            // username으로도 비교 (user_id가 일치하지 않을 때 대체 방법)
            let postUsername = apiPost.username || apiPost.author;
            // 괄호가 있으면 제거 (예: 'hhj03(사용자)' -> 'hhj03')
            if (postUsername) {
              postUsername = postUsername.split('(')[0].trim();
            }
            
            let currentUsername = user?.username;
            // username이 없으면 name에서 괄호 앞 부분만 추출
            if (!currentUsername && user?.name) {
              currentUsername = user.name.split('(')[0].trim();
            }
            
            const isMatchByUsername = postUsername && currentUsername && 
                                      postUsername.trim() === currentUsername.trim();
            
            // user_id 또는 username 중 하나라도 일치하면 작성자로 인정
            const isAuthor = isMatchById || isMatchByUsername;
            
            console.log('🔍 작성자 권한 확인:', {
              postUserId,
              currentUserId,
              numericPostUserId,
              numericCurrentUserId,
              isMatchById,
              postUsername,
              currentUsername,
              isMatchByUsername,
              isAuthor
            });
            
            if (!isAuthor) {
              console.error('❌ 작성자가 아닙니다. 수정 권한이 없습니다.');
              alert("본인이 작성한 게시글만 수정할 수 있습니다.");
              navigate("/mentoring");
              return;
            }
            
            // 일시 정보 처리: event_date/event_start_time 우선, 없으면 event_datetime, 마지막으로 기존 필드
            let dateValue = "";
            let startTimeValue = "";
            let endTimeValue = "";
            
            if (apiPost.event_date && apiPost.event_start_time) {
              // 백엔드에서 event_date와 event_start_time을 보낸 경우
              dateValue = apiPost.event_date;
              startTimeValue = apiPost.event_start_time;
              endTimeValue = apiPost.event_end_time || "";
              console.log('✅ event_date/event_start_time 사용:', { dateValue, startTimeValue, endTimeValue });
            } else if (apiPost.event_datetime) {
              // event_datetime이 있는 경우
              dateValue = toDateInput(apiPost.event_datetime);
              startTimeValue = toTimeInput(apiPost.event_datetime);
              console.log('✅ event_datetime 사용:', { dateValue, startTimeValue });
            } else if (apiPost.date && apiPost.startTime) {
              // 기존 date/startTime 필드 사용
              dateValue = apiPost.date;
              startTimeValue = apiPost.startTime;
              endTimeValue = apiPost.endTime || "";
              console.log('✅ date/startTime 사용:', { dateValue, startTimeValue, endTimeValue });
            } else if (apiPost.created_at) {
              // created_at 사용 (fallback)
              dateValue = toDateInput(apiPost.created_at);
              startTimeValue = toTimeInput(apiPost.created_at);
              console.log('⚠️ created_at 사용 (fallback):', { dateValue, startTimeValue });
            }
            
            found = {
              id: apiPost.id ?? apiPost.post_id ?? effectiveId,
              post_id: apiPost.post_id ?? apiPost.id ?? effectiveId,
              date: dateValue,
              startTime: startTimeValue,
              endTime: endTimeValue,
              title: apiPost.title || "",
              content: apiPost.content || apiPost.body || "",
              category: apiPost.category,
              stroke: apiPost.stroke,
              location: apiPost.location,
              region: apiPost.region,
              author: apiPost.author ?? apiPost.username,
              username: apiPost.username ?? apiPost.author,
              event_datetime: apiPost.event_datetime,
              event_date: apiPost.event_date,
              event_start_time: apiPost.event_start_time,
              event_end_time: apiPost.event_end_time,
              created_at: apiPost.created_at,
              dateText: apiPost.dateText,
            };
            
            effectiveId = found.id ?? found.post_id ?? effectiveId;
            console.log('✅ 서버에서 로드한 게시글:', found);
          }
        } catch (err) {
          console.warn('⚠️ 서버에서 게시글 조회 실패, 로컬 스토리지 확인:', err);
          
          // 서버 조회 실패 시 로컬 스토리지에서 찾기 (폴백)
      const raw = localStorage.getItem("posts_v1");
      const parsed = raw ? JSON.parse(raw) : [];
          
          if (effectiveId) {
            found = parsed.find((p) => (p.id ?? p.post_id) === effectiveId);
            if (found) {
              console.log('📱 로컬 스토리지에서 찾은 게시글:', found);
            }
          }
        }

        // 3) 여전히 찾지 못했고 id도 없으면 경고 후 종료
        if (!found && !effectiveId) {
          console.error('❌ 게시글 ID가 없습니다. URL을 확인해주세요.');
          alert("수정할 게시글 ID가 없습니다. 목록에서 수정 버튼을 클릭해주세요.");
          navigate("/mentoring");
        return;
      }

        // 4) 게시글을 찾지 못한 경우
      if (!found) {
          console.error('❌ 게시글을 찾을 수 없습니다. ID:', effectiveId);
          alert("해당 게시글을 찾을 수 없습니다. 목록으로 돌아갑니다.");
          navigate("/mentoring");
        return;
      }

        // populate form with 최신 데이터 (서버에서 받은 데이터 또는 로컬 폴백)
        const finalId = found.post_id ?? found.id ?? effectiveId;
        const finalPostId = found.post_id ?? finalId;
        
        // 폼에 최신 데이터 설정 (서버에서 받은 최신 내용 반영)
        // event_end_time이 있으면 우선 사용
        const finalEndTime = found.endTime || found.event_end_time || "";
        console.log('📅 폼에 설정할 일시 데이터:', {
          'date': found.date || found.event_date || "",
          'startTime': found.startTime || found.event_start_time || "",
          'endTime': finalEndTime,
          'found.endTime': found.endTime,
          'found.event_end_time': found.event_end_time
        });
        
        setDate(found.date || found.event_date || "");
        setStartTime(found.startTime || found.event_start_time || "");
        setEndTime(finalEndTime);
      setTitle(found.title || "");
        setContent(found.content || found.body || "");
        
        // original에 최신 데이터 포함 (수정된 내용 반영)
        const originalData = { 
          ...found, 
          id: finalId, 
          post_id: finalPostId 
        };
        setOriginal(originalData);
        
        console.log('✅ 게시글 로드 완료 (최신 데이터):', { 
          finalId, 
          finalPostId,
          'found.post_id': found.post_id,
          'found.id': found.id,
          '제목': found.title,
          '내용': found.content?.substring(0, 50) + '...',
          '일시': found.date + ' ' + found.startTime,
          originalData,
          '전체 found 객체': found
        });
        console.log('✅ original state에 설정됨:', originalData);
      setLoading(false);
    } catch (e) {
        console.error('❌ 데이터 로드 오류:', e);
        alert("데이터를 불러오던 중 오류가 발생했습니다. 목록으로 돌아갑니다.");
      setLoading(false);
        navigate("/mentoring");
    }
    };
    load();
  }, [id, navigate]);

  async function handleSave(e) {
    e.preventDefault();
    console.log('🔵 ========== handleSave 함수 호출됨 ==========');
    console.log('🔵 original 상태:', original);
    console.log('🔵 id 상태:', id);
    console.log('🔵 date:', date);
    console.log('🔵 title:', title);
    
    // post_id 우선 사용 (실제 백엔드는 post_id를 사용함)
    const effectiveId = original?.post_id ?? original?.id ?? id;
    console.log('💾 수정 저장 시도:', { 
      effectiveId, 
      'original.post_id': original?.post_id,
      'original.id': original?.id,
      'url id': id,
      original 
    });
    
    if (!effectiveId) {
      console.error('❌ 수정할 게시글 ID가 없습니다.');
      console.error('❌ 디버깅 정보:', { 
        'original 존재': !!original,
        'original.post_id': original?.post_id,
        'original.id': original?.id,
        'id (URL)': id 
      });
      alert("수정할 게시글 ID가 없습니다. 페이지를 새로고침해주세요.");
      return;
    }
    if (!date) {
      console.error('❌ 날짜가 입력되지 않음');
      alert("날짜를 입력하세요.");
      return;
    }
    if (!title.trim()) {
      console.error('❌ 제목이 입력되지 않음');
      alert("제목을 입력하세요.");
      return;
    }

    try {
      // 사용자가 선택한 일시를 event_datetime으로 생성
      const eventDateTime = date && startTime 
        ? new Date(`${date}T${startTime}:00`).toISOString()
        : (original?.event_datetime || undefined);
      
      // 제목과 내용에서 종목과 지역 자동 추출
      const fullText = `${title.trim()} ${content.trim()}`;
      const extractedStroke = extractSwimmingStroke(fullText);
      const extractedRegion = extractRegion(fullText);
      
      // GPT 분류도 시도 (있으면 우선 사용)
      let finalStroke = extractedStroke;
      let finalRegion = extractedRegion;
      
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const classifyResponse = await fetch(`${API_CONFIG.BASE_URL}/api/posts/classify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ title: title.trim(), content: content.trim() })
        });
        
        if (classifyResponse.ok) {
          const classification = await classifyResponse.json();
          finalStroke = classification.stroke || extractedStroke;
          finalRegion = classification.region || extractedRegion;
          console.log('✅ GPT 분류 결과:', { stroke: finalStroke, region: finalRegion });
        }
      } catch (err) {
        console.warn('⚠️ GPT 분류 실패, 키워드 추출 사용:', err);
      }
      
      console.log('📅 수정할 일시 정보:', {
        date,
        startTime,
        endTime,
        '생성된 eventDateTime': eventDateTime,
        'original.event_datetime': original?.event_datetime,
        'eventDateTime 변환 결과': eventDateTime ? new Date(eventDateTime).toLocaleString('ko-KR') : '없음'
      });
      
      console.log('🏷️ 추출된 분류 정보:', {
        'extractedStroke': extractedStroke,
        'extractedRegion': extractedRegion,
        'finalStroke': finalStroke,
        'finalRegion': finalRegion
      });

      // 현재 로그인한 사용자 ID 가져오기
      const currentUserId = user?.id || user?.userId || user?.user_id || 
                          sessionStorage.getItem(AUTH_CONFIG.USER_ID_KEY) || 
                          localStorage.getItem(AUTH_CONFIG.USER_ID_KEY);
      
      // 백엔드로 전송할 데이터 (요청한 형식 + 분류 정보 + userId)
      const updatedPost = {
        title: title.trim(),
        content: content.trim(),
        event_date: date, // 사용자가 선택한 날짜 (YYYY-MM-DD)
        event_start_time: startTime, // 사용자가 선택한 시작 시간 (HH:mm)
        event_end_time: endTime || undefined, // 사용자가 선택한 종료 시간 (HH:mm, 선택사항)
        // 제목/내용에서 추출한 종목과 지역 정보 (변경 반영)
        category: finalStroke, // 수영 종목
        stroke: finalStroke, // 수영 종목 (동일)
        region: finalRegion, // 지역
        location: finalRegion !== "기타" ? finalRegion : (original?.location ?? original?.region), // 지역 (location 필드명)
        currentUserId: currentUserId, // 현재 사용자 ID (권한 체크용)
        userId: currentUserId, // 현재 사용자 ID (권한 체크용)
      };

      console.log('📤 수정 요청에 포함된 데이터:', updatedPost);

      // API를 통한 게시글 수정 (PUT /api/posts/:id)
      let apiSucceeded = false;
      try {
        console.log('📡 API 수정 요청:', effectiveId, updatedPost);
        const response = await postsAPI.updatePost(effectiveId, updatedPost);
        console.log('📥 API 수정 응답:', response);
        apiSucceeded = true;
        console.log('✅ API를 통한 게시글 수정 성공');
      } catch (apiError) {
        console.error('❌ API 수정 실패:', apiError);
        console.error('❌ 에러 상세:', {
          message: apiError.message,
          stack: apiError.stack,
          error: apiError
        });
        console.warn('로컬 저장으로 폴백 시도');
      }

      if (apiSucceeded) {
        console.log('🔄 목록 새로고침 시작...');
        await loadPosts(); // 목록을 서버 데이터로 재로딩 (중복/가짜 항목 방지)
        console.log('✅ 목록 새로고침 완료');
      } else {
        // PostForm 로컬 저장 업데이트 (오프라인 폴백)
        const newPosts = posts.map((p) => ((p.id ?? p.post_id) === effectiveId ? { ...p, ...updatedPost } : p));
      setPosts(newPosts);
      localStorage.setItem("posts_v1", JSON.stringify(newPosts));
        // 멘토링 시스템 전체 동기화 (로컬 전용)
      syncPostFormData();
      }

      alert("수정이 저장되었습니다.");
      // 수정된 게시글 ID를 함께 전달하여 상세 페이지도 새로고침 가능하도록
      navigate("/mentoring", { 
        state: { 
          refresh: true,
          updatedPostId: effectiveId 
        } 
      });
    } catch (error) {
      console.error("게시글 수정 중 오류 발생:", error);
      alert("게시글 수정 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }

  // 삭제 기능 (수정 버튼 옆)
  async function handleDelete() {
    console.log('🔴 ========== handleDelete 함수 호출됨 ==========');
    console.log('🔴 original 상태:', original);
    console.log('🔴 id 상태:', id);
    
    // 현재 로그인한 사용자 확인
    const currentUserId = user?.id || user?.userId || user?.user_id || 
                        sessionStorage.getItem(AUTH_CONFIG.USER_ID_KEY) || 
                        localStorage.getItem(AUTH_CONFIG.USER_ID_KEY);
    
    if (!currentUserId) {
      console.error('❌ 로그인한 사용자 정보가 없습니다.');
      alert("로그인이 필요합니다.");
      return;
    }
    
    // post_id 우선 사용 (실제 백엔드는 post_id를 사용함)
    const effectiveId = original?.post_id ?? original?.id ?? id;
    console.log('🗑️ 삭제 시도:', { 
      effectiveId,
      'original.post_id': original?.post_id,
      'original.id': original?.id,
      'url id': id,
      original 
    });
    
    if (!effectiveId) {
      console.error('❌ 삭제할 게시글 ID가 없습니다.');
      console.error('❌ 디버깅 정보:', { 
        'original 존재': !!original,
        'original.post_id': original?.post_id,
        'original.id': original?.id,
        'id (URL)': id 
      });
      alert("삭제할 게시글 ID가 없습니다. 페이지를 새로고침해주세요.");
      return;
    }
    
    // 작성자 권한 확인 (user_id와 username 모두 확인)
    const postUserId = original?.user_id || original?.userId || original?.author_id;
    const numericCurrentUserId = Number(currentUserId);
    const numericPostUserId = Number(postUserId);
    
    // user_id로 비교
    const isMatchById = String(numericPostUserId) === String(numericCurrentUserId);
    
    // username으로도 비교 (user_id가 일치하지 않을 때 대체 방법)
    let postUsername = original?.username || original?.author;
    // 괄호가 있으면 제거 (예: 'hhj03(사용자)' -> 'hhj03')
    if (postUsername) {
      postUsername = postUsername.split('(')[0].trim();
    }
    
    let currentUsername = user?.username;
    // username이 없으면 name에서 괄호 앞 부분만 추출
    if (!currentUsername && user?.name) {
      currentUsername = user.name.split('(')[0].trim();
    }
    
    const isMatchByUsername = postUsername && currentUsername && 
                              postUsername.trim() === currentUsername.trim();
    
    // user_id 또는 username 중 하나라도 일치하면 작성자로 인정
    const isAuthor = isMatchById || isMatchByUsername;
    
    console.log('🔍 삭제 권한 확인:', {
      postUserId,
      currentUserId,
      numericPostUserId,
      numericCurrentUserId,
      isMatchById,
      postUsername,
      currentUsername,
      isMatchByUsername,
      isAuthor
    });
    
    if (!isAuthor) {
      console.error('❌ 작성자가 아닙니다. 삭제 권한이 없습니다.');
      alert("본인이 작성한 게시글만 삭제할 수 있습니다.");
      return;
    }

    if (!confirm("정말 이 게시글을 삭제하시겠습니까?")) return;
    
    try {
      // 서버 삭제 시도
      let apiSucceeded = false;
      try {
        // 삭제 요청 시 userId 포함
        const deleteData = {
          currentUserId: currentUserId,
          userId: currentUserId
        };
        console.log('📡 API 삭제 요청:', effectiveId, deleteData);
        const response = await postsAPI.deletePost(effectiveId, deleteData);
        console.log('📥 API 삭제 응답:', response);
        apiSucceeded = true;
        console.log('✅ API를 통한 게시글 삭제 성공');
      } catch (apiError) {
        console.error('❌ API 삭제 실패:', apiError);
        console.error('❌ 에러 상세:', {
          message: apiError.message,
          stack: apiError.stack,
          error: apiError
        });
        console.warn('로컬 삭제로 폴백 시도');
      }

      if (apiSucceeded) {
        await loadPosts();
      } else {
        // 로컬 저장소 삭제 (오프라인 폴백)
        const newPosts = posts.filter((p) => (p.id ?? p.post_id) !== effectiveId);
      setPosts(newPosts);
      localStorage.setItem("posts_v1", JSON.stringify(newPosts));
        // 전체 동기화 (로컬 전용)
      syncPostFormData();
      }
      
      alert("게시글이 삭제되었습니다.");
      navigate("/mentoring", { state: { refresh: true } });
    } catch (error) {
      console.error("게시글 삭제 중 오류 발생:", error);
      alert("게시글 삭제 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <TopNav />
        <div className="max-w-screen-xl mx-auto">
          <main className="px-6">
            <div className="mt-8 text-center text-slate-500">로딩 중...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      <div className="max-w-screen-xl mx-auto">
        <main className="px-6">
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">게시글 수정</h2>
              </div>
              {/* 취소/삭제 버튼 제거 */}
            </div>

            {/* 상단 탭(전체/종목/지역) 제거 */}

            {/* Form area */}
            <form onSubmit={handleSave} className="mt-6 max-w-3xl">
              <div className="border rounded p-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-1 text-sm" htmlFor="edit-date">일시:</label>
                  <div className="col-span-11 flex gap-3">
                    <input
                      id="edit-date"
                      name="date"
                      type="date"
                      className="border px-2 py-1 rounded w-48"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                    <input
                      id="edit-start-time"
                      name="startTime"
                      type="time"
                      className="border px-2 py-1 rounded w-36"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                    <input
                      id="edit-end-time"
                      name="endTime"
                      type="time"
                      className="border px-2 py-1 rounded w-36"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>

                  <label className="col-span-1 text-sm" htmlFor="edit-title">제목:</label>
                  <div className="col-span-11">
                    <input
                      id="edit-title"
                      name="title"
                      type="text"
                      placeholder="제목을 입력하세요"
                      className="w-full border px-3 py-2 rounded"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <label className="col-span-1 text-sm" htmlFor="edit-content">내용:</label>
                  <div className="col-span-11">
                    <textarea
                      id="edit-content"
                      name="content"
                      placeholder="내용을 입력하세요"
                      className="w-full border px-3 py-2 rounded h-28 resize-none"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>

                  <div className="col-span-11 col-start-2 flex justify-end gap-2">
                    <button type="button" onClick={handleDelete} className="px-4 py-2 border border-red-500 text-red-600 rounded">삭제</button>
                    <button type="submit" className="px-4 py-2 bg-[#5b39b8] text-white rounded">수정</button>
                  </div>
                </div>
              </div>
            </form>
            {/* 하단 첨부/에디터 영역 제거 */}
          </section>
        </main>
      </div>
    </div>
  );
}
