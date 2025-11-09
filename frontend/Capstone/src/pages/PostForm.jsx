import React, { useEffect, useState } from "react";
import { usePosts } from "../store/posts.jsx";
import { useUser } from "../store/user.jsx";
import { useNavigate } from "react-router-dom";
import { API_CONFIG, AUTH_CONFIG } from "../config/environment.js";
import TopNav from "../components/TopNav";

const TABS = ["전체", "종목", "지역"];

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
  "서울": ["서울", "강남", "강북", "강동", "강서", "송파", "서초", "마포", "용산", "영등포"],
  "경기": ["경기", "수원", "성남", "의정부", "안양", "부천", "광명", "평택", "과천", "오산", "시흥", "군포", "의왕", "하남", "용인", "파주", "이천", "안성", "김포", "화성", "광주", "여주", "양평", "고양", "의정부", "동두천", "가평", "연천", "기흥", "수원역"],
  "인천": ["인천", "부평", "계양", "서구", "동구", "남구", "중구", "연수", "남동", "옹진"],
  "부산": ["부산", "해운대", "사하", "금정", "강서", "북구", "사상", "동래", "연제", "수영", "남구", "중구", "서구", "영도", "동구", "부산진"],
  "대구": ["대구", "수성", "달서", "달성", "북구", "서구", "남구", "중구", "동구"],
  "광주": ["광주", "서구", "남구", "북구", "동구", "광산"],
  "대전": ["대전", "유성", "대덕", "서구", "중구", "동구"],
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

function PostForm() {
  const navigate = useNavigate();
  const { addPost } = usePosts();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("전체");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedStroke, setSelectedStroke] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);

  // 임시 토큰 설정 (개발용)
  useEffect(() => {
    if (!localStorage.getItem('authToken')) {
      localStorage.setItem('authToken', 'test-token');
      console.log('🔑 테스트 토큰이 설정되었습니다.');
    }
  }, []);

  // GPT 분류 API 호출 함수
  const classifyWithGPT = async (title, content) => {
    try {
      setIsClassifying(true);
      
      // 저장된 토큰 가져오기
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ title, content })
      });
      
      if (!response.ok) {
        throw new Error('GPT 분류 API 호출 실패');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('GPT 분류 실패:', error);
      // 실패 시 기존 로직 사용
      const fullText = `${title} ${content}`;
      return {
        stroke: extractSwimmingStroke(fullText),
        region: extractRegion(fullText)
      };
    } finally {
      setIsClassifying(false);
    }
  };


  async function handleSave(e) {
    e.preventDefault();
    // simple validation
    if (!date) return alert("날짜를 입력하세요.");
    if (!title.trim()) return alert("제목을 입력하세요.");

    try {
      // GPT로 분류 수행
      const classification = await classifyWithGPT(title.trim(), content.trim());
      
      // 분류된 결과 사용
      const extractedStroke = classification.stroke || extractSwimmingStroke(`${title.trim()} ${content.trim()}`);
      const extractedRegion = classification.region || extractRegion(`${title.trim()} ${content.trim()}`);

      // event_datetime 생성 (사용자가 선택한 날짜/시간)
      const eventDateTime = date && startTime 
        ? new Date(`${date}T${startTime}:00`).toISOString()
        : undefined;

      console.log('📅 선택한 일시 정보:', {
      date,
      startTime,
      endTime,
        eventDateTime,
        'eventDateTime 변환 결과': eventDateTime ? new Date(eventDateTime).toLocaleString('ko-KR') : '없음'
      });

      // 현재 사용자 ID 가져오기
      const currentUserId = user?.id || user?.userId || user?.user_id ||
                            sessionStorage.getItem(AUTH_CONFIG.USER_ID_KEY) ||
                            localStorage.getItem(AUTH_CONFIG.USER_ID_KEY);
      
      console.log('👤 게시글 작성자 ID:', currentUserId);
      
      // 백엔드로 게시글 저장 (요청한 형식)
      const postData = {
      title: title.trim(),
      content: content.trim(),
        event_date: date, // 사용자가 선택한 날짜 (YYYY-MM-DD)
        event_start_time: startTime, // 사용자가 선택한 시작 시간 (HH:mm)
        event_end_time: endTime || undefined, // 사용자가 선택한 종료 시간 (HH:mm, 선택사항)
        user_id: currentUserId ? Number(currentUserId) : undefined, // 작성자 ID (백엔드에서 사용)
        userId: currentUserId ? Number(currentUserId) : undefined, // 작성자 ID (백엔드에서 사용)
      };

      console.log('📤 백엔드로 전송할 데이터:', postData);

      // 저장된 토큰 가져오기
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        throw new Error('게시글 저장 실패');
      }

      const savedPost = await response.json();
      console.log('✅ 게시글 저장 성공:', savedPost);
      
      // 저장된 게시글의 post_id 추출 (정수형으로 변환)
      const postIdRaw = savedPost.post_id || savedPost.id;
      const postId = Number(postIdRaw); // 정수형으로 명확히 변환
      console.log('📌 저장된 게시글 ID:', postId, '타입:', typeof postId);
      
      // 핵심: post_id를 sessionStorage에 저장 (게시판1 페이지에서 추천 게시글 요청용)
      if (postId && !isNaN(postId)) {
        sessionStorage.setItem('newPostIdForRecommends', postId.toString());
        console.log('💾 sessionStorage에 newPostId 저장:', postId);
      }
    
      // reset form
    setTitle("");
    setContent("");
    setStartTime("");
    setEndTime("");
    setDate("");
    setSelectedStroke("");
    setSelectedRegion("");
      
    alert("저장되었습니다.");
    
    // 멘토링 페이지로 이동
    setTimeout(() => {
      navigate('/mentoring');
    }, 1000);

    } catch (error) {
      console.error('게시글 저장 실패:', error);
      alert('게시글 저장에 실패했습니다. 다시 시도해주세요.');
    }
  }


  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      <div className="max-w-4xl mx-auto">
        <main className="px-4 py-6">
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">게시글 작성</h2>
              </div>
            </div>

            {/* Tabs bar */}
            <div className="mt-6">
              <div className="bg-[#36343f] rounded-sm px-3 py-2 inline-flex gap-2">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`text-white text-sm px-3 py-1 rounded ${activeTab === t ? "bg-[#5b39b8] font-semibold" : "bg-transparent/10"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="mt-6">
              <div className="bg-white border rounded-lg p-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-1 text-sm" htmlFor="post-date">일시:</label>
                  <div className="col-span-11 flex gap-2">
                    <input
                      id="post-date"
                      name="date"
                      type="date"
                      className="flex-1 border px-3 py-2 rounded"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                    <input
                      id="post-start-time"
                      name="startTime"
                      type="time"
                      className="flex-1 border px-3 py-2 rounded"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                    <input
                      id="post-end-time"
                      name="endTime"
                      type="time"
                      className="flex-1 border px-3 py-2 rounded"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>

                  <label className="col-span-1 text-sm" htmlFor="post-title">제목:</label>
                  <div className="col-span-11">
                    <input
                      id="post-title"
                      name="title"
                      type="text"
                      placeholder="제목을 입력하세요"
                      className="w-full border px-3 py-2 rounded"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <label className="col-span-1 text-sm" htmlFor="post-content">내용:</label>
                  <div className="col-span-11">
                    <textarea
                      id="post-content"
                      name="content"
                      placeholder="내용을 입력하세요"
                      className="w-full border px-3 py-2 rounded h-28 resize-none"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>


                  <div className="col-span-11 col-start-2 flex justify-end">
                    <button 
                      type="submit" 
                      className={`px-4 py-2 text-white rounded ${
                        isClassifying 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-[#5b39b8] hover:bg-[#4a2d8a]'
                      }`}
                      disabled={isClassifying}
                    >
                      {isClassifying ? 'GPT 분류 중...' : '저장'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}

export default PostForm;