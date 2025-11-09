import { useState, useRef, useEffect } from "react";
import { swimmingAPI } from './services/api.js';
import TopNav from './components/TopNav.jsx';
// PNG 파일은 일반 이미지로 import
import baseA from './svgs/baseA.png';
import baseB from './svgs/baseB.png';
// SVG 파일은 React 컴포넌트로 import (?react suffix 사용)
import FreeA from './svgs/freestyleA.svg?react';
import FreeB from './svgs/freestyleB.svg?react';
import BackA from './svgs/backA.svg?react';
import BackB from './svgs/backB.svg?react';
import BreaststrokeA from './svgs/breaststrokeA.svg?react';
import BreaststrokeB from './svgs/breaststrokeB.svg?react';
import ButterflyA from './svgs/butterflyA.svg?react';
import ButterflyB from './svgs/butterflyB.svg?react';

// Fallback 데이터 (API 실패 시 사용)
const FALLBACK_STROKES = {
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

/**
 * SwimmingStrokeInfo
 * - 기본 베이스 인체 모형 (회색) + 영법별 근육 SVG (빨간색) 겹쳐서 표시
 * - 각 근육 클릭 시 정보 표시
 * - Tabs: 자유형, 배영, 평영, 접영
 * - Figure view toggle: 전면/후면
 *
 * ◻ TailwindCSS required
 */
export default function SwimmingStrokeInfo() {
  // API 데이터를 저장할 state (fallback 데이터로 초기화)
  const [STROKES, setSTROKES] = useState(FALLBACK_STROKES);
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [useFallback, setUseFallback] = useState(false); // fallback 사용 여부

  const tabs = ["freestyle","backstroke","breaststroke","butterfly"];
  const [stroke, setStroke] = useState("freestyle");
  const [view, setView] = useState("front");

  // API 호출 로직 (useEffect)
  useEffect(() => {
    // 페이지가 열릴 때 백엔드에서 수영 종목 정보를 가져옴
    swimmingAPI.getSwimTypes()
      .then(data => {
        console.log('✅ 수영 종목 정보 로드 성공:', data);
        console.log('📊 원본 데이터 타입:', typeof data);
        console.log('📊 원본 데이터 키:', Object.keys(data || {}));
        
        if (data && Object.keys(data).length > 0) {
          // 각 종목의 데이터 구조 확인 및 정규화
          const normalizedData = {};
          Object.keys(data).forEach(key => {
            const strokeData = data[key];
            console.log(`📋 종목 "${key}" 원본 데이터:`, strokeData);
            
            normalizedData[key] = {
              stroke_name: strokeData.stroke_name || key,
              // 백엔드에서 소문자로 오는 경우도 처리 (titlekor -> titleKor)
              titleKor: strokeData.titleKor || strokeData.titlekor || '',
              titleEng: strokeData.titleEng || strokeData.titleeng || '',
              muscles: Array.isArray(strokeData.muscles) ? strokeData.muscles : (strokeData.muscles ? [strokeData.muscles] : []),
              pros: Array.isArray(strokeData.pros) ? strokeData.pros : (strokeData.pros ? [strokeData.pros] : []),
              cons: Array.isArray(strokeData.cons) ? strokeData.cons : (strokeData.cons ? [strokeData.cons] : []),
              rec: Array.isArray(strokeData.rec) ? strokeData.rec : (strokeData.rec ? [strokeData.rec] : []),
              highlight: strokeData.highlight || { front: [], back: [] },
            };
            
            console.log(`✅ 종목 "${key}" 정규화 완료:`, normalizedData[key]);
          });
          console.log('📋 전체 정규화된 데이터:', normalizedData);
          setSTROKES(normalizedData); // 백엔드에서 받은 객체를 state에 저장
          setUseFallback(false);
        } else {
          console.warn('⚠️ API 응답이 비어있습니다. Fallback 데이터 사용');
          setSTROKES(FALLBACK_STROKES);
          setUseFallback(true);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("❌ 수영 정보 로드 실패:", err);
        console.error("에러 상세:", {
          message: err.message,
          stack: err.stack,
        });
        console.warn('⚠️ Fallback 데이터 사용');
        setSTROKES(FALLBACK_STROKES);
        setUseFallback(true);
        setLoading(false);
      });
  }, []); // 빈 배열: 페이지 로드 시 1번만 실행

  // state에 저장된 API 데이터로 작동 (fallback 포함)
  const data = STROKES[stroke];

  // 디버깅: 현재 데이터 확인 (조건부 렌더링 전에 hooks 호출)
  useEffect(() => {
    console.log('🔍 현재 선택된 종목:', stroke);
    console.log('🔍 STROKES 객체:', STROKES);
    console.log('🔍 현재 데이터:', data);
    if (data) {
      console.log('🔍 데이터 내용:', {
        titleKor: data.titleKor,
        muscles: data.muscles,
        pros: data.pros,
        cons: data.cons,
        rec: data.rec,
      });
    }
  }, [stroke, STROKES, data]);

  // 로딩 처리
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 p-6">
        <div className="text-center py-20">
          <div className="text-xl font-semibold text-zinc-700">수영 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }
  
  // 데이터가 없으면 에러 표시
  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-100 p-6">
        <div className="text-center py-20">
          <div className="text-xl font-semibold text-red-600 mb-2">데이터를 찾을 수 없습니다.</div>
          <div className="text-sm text-zinc-600 mt-2">선택된 종목: {stroke}</div>
          <div className="text-sm text-zinc-600">사용 가능한 종목: {Object.keys(STROKES).join(', ')}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <TopNav />
      <div className="p-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-center text-4xl font-extrabold text-zinc-900">수영 종목 정보</h1>
        
        {/* Fallback 데이터 사용 시 경고 배너 */}
        {useFallback && (
          <div className="mx-auto mt-4 max-w-2xl rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <span>⚠️</span>
              <span>백엔드 서버 연결에 실패하여 기본 데이터를 표시합니다.</span>
            </div>
          </div>
        )}

        {/* segmented tabs */}
        <div className="mx-auto mt-6 max-w-2xl rounded-full bg-zinc-200 p-1">
          <div className="grid grid-cols-4 gap-1">
            {tabs.map((k) => (
              <button
                key={k}
                onClick={() => setStroke(k)}
                className={
                  "rounded-full px-5 py-2 text-sm font-semibold transition " +
                  (stroke === k ? "bg-indigo-600 text-white shadow" : "text-zinc-700 hover:bg-white")
                }
              >
                {STROKES[k].titleKor}
              </button>
            ))}
          </div>
        </div>

        {/* main card */}
        <div className="mt-8 rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          {/* 인체 모형을 가운데로 배치 */}
            <div className="flex flex-col items-center">
              {/* view toggle */}
              <div className="mb-4 flex gap-2">
                {(["front","back"]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={
                      "rounded-full px-3 py-1 text-xs font-semibold transition " +
                      (view === v ? "bg-indigo-600 text-white" : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300")
                    }
                  >
                    {v === "front" ? "전면" : "후면"}
                  </button>
                ))}
              </div>

              {/* 사용 안내 문구 */}
              <div className="mb-4 text-center">
                <p className="text-sm text-zinc-600">
                  <span className="font-semibold text-indigo-600">빨간색 근육</span>을 
                  <span className="font-semibold text-indigo-600"> 클릭</span>하면 상세 정보를 확인할 수 있습니다
                </p>
              </div>

            <StrokeDiagram 
              stroke={stroke} 
              view={view}
              data={data}
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, items, color = "indigo" }) {
  const dot = {
    indigo: "bg-indigo-600",
    emerald: "bg-emerald-600",
    rose: "bg-rose-600",
  }[color];
  
  // 디버깅: 전달받은 데이터 확인
  console.log(`📝 Section "${title}":`, {
    items,
    isArray: Array.isArray(items),
    length: items?.length,
    type: typeof items,
  });
  
  // items가 배열이 아니거나 비어있을 경우 처리
  if (!items || !Array.isArray(items) || items.length === 0) {
    console.warn(`⚠️ Section "${title}"에 데이터가 없습니다:`, items);
    return (
      <div className="mt-6">
        <h3 className="text-[15px] font-semibold text-indigo-800">{title}</h3>
        <p className="mt-2 text-sm text-zinc-500">데이터가 없습니다.</p>
      </div>
    );
  }
  
  return (
    <div className="mt-6">
      <h3 className="text-[15px] font-semibold text-indigo-800">{title}</h3>
      <ul className="mt-2 space-y-2 text-[15px] leading-6">
        {items.map((t, i) => {
          // 각 항목이 문자열인지 확인
          const text = typeof t === 'string' ? t : String(t || '');
          return (
          <li key={i} className="flex gap-3">
            <span className={`mt-2 h-1.5 w-1.5 flex-none rounded-full ${dot}`} />
              <span className="flex-1 text-zinc-800">{text}</span>
          </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------- SVG DIAGRAM (기본 베이스 + 근육 오버레이) ----------------

function StrokeDiagram({ stroke, view, data }) {
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [showPopup1, setShowPopup1] = useState(true); // 팝업1 표시 여부
  const [showPopup2, setShowPopup2] = useState(true); // 팝업2 표시 여부
  const [hoveredMuscle, setHoveredMuscle] = useState(false); // 호버된 근육 (boolean)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 }); // 호버 위치
  // 영법별 SVG 컴포넌트 매핑
  const strokeComponents = {
    freestyle: {
      front: FreeA,
      back: FreeB,
    },
    backstroke: {
      front: BackA,
      back: BackB,
    },
    breaststroke: {
      front: BreaststrokeA,
      back: BreaststrokeB,
    },
    butterfly: {
      front: ButterflyA,
      back: ButterflyB,
    },
  };

  // 현재 선택된 영법과 뷰에 맞는 컴포넌트
  const baseImageSrc = view === 'front' ? baseA : baseB;
  const MuscleOverlay = strokeComponents[stroke]?.[view] || FreeA;
  
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const svgWrapperRef = useRef(null);
  const [svgStyle, setSvgStyle] = useState({
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    opacity: 0, // 초기에는 투명하게, 위치 조정 후 표시
  });

  // 근육 이름 매핑 (SVG 요소의 id나 class와 매칭)
  const muscleNameMap = {
    // 자유형
    'shoulders': '삼각근(어깨)',
    'delts': '삼각근(어깨)',
    'lats': '광배근(등)',
    'core': '복직근(코어)',
    'quads': '대퇴사두근(허벅지 앞)',
    'calves': '종아리',
    'glutes': '둔근',
    'hams': '햄스트링',
    // 배영
    'traps': '승모근',
    // 평영
    'adductors': '내전근',
    'chest': '가슴',
    'triceps': '삼두근',
    // 접영
    'forearms': '전완',
  };

  // 클릭 핸들러
  const handleMuscleClick = (e) => {
    e.stopPropagation();
    
    // 클릭 위치에 따라 근육 선택
    if (data?.muscles && data.muscles.length > 0) {
      const clickY = e.clientY;
      const svgRect = svgWrapperRef.current?.getBoundingClientRect();
      let muscleName = null;
      
      if (svgRect) {
        const relativeY = (clickY - svgRect.top) / svgRect.height;
        // 상단: 어깨/등, 중간: 코어, 하단: 다리
        if (relativeY < 0.3) {
          muscleName = data.muscles.find(m => m.includes('어깨') || m.includes('등') || m.includes('삼각') || m.includes('광배')) || data.muscles[0];
        } else if (relativeY < 0.6) {
          muscleName = data.muscles.find(m => m.includes('코어') || m.includes('복직')) || data.muscles[1] || data.muscles[0];
        } else {
          muscleName = data.muscles.find(m => m.includes('허벅지') || m.includes('다리') || m.includes('대퇴')) || data.muscles[data.muscles.length - 1] || data.muscles[0];
        }
      } else {
        muscleName = data.muscles[0];
      }
      
      if (muscleName) {
        setSelectedMuscle(muscleName);
        setPopupPosition({
          x: e.clientX,
          y: e.clientY,
        });
        // 팝업 표시 상태 초기화
        setShowPopup1(true);
        setShowPopup2(true);
      }
    }
  };

  // 팝업 닫기 (모두 닫기)
  const closeAllPopups = () => {
    setSelectedMuscle(null);
    setShowPopup1(false);
    setShowPopup2(false);
  };

  // 팝업1만 닫기
  const closePopup1 = () => {
    setShowPopup1(false);
  };

  // 팝업2만 닫기
  const closePopup2 = () => {
    setShowPopup2(false);
  };

  useEffect(() => {
    const updateOverlayPosition = () => {
      const container = containerRef.current;
      const img = imgRef.current;
      const svgElement = svgWrapperRef.current?.querySelector('svg');
      
      if (!container || !img) return;
      
      // SVG가 아직 렌더링되지 않았으면 잠시 후 다시 시도
      if (!svgElement) {
        setTimeout(updateOverlayPosition, 100);
        return;
      }
      
      const checkAndUpdate = () => {
        if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
          return;
        }

            // 이미지의 실제 렌더링된 크기와 위치를 정확히 측정
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                // 공통 wrapper 찾기 (이미지와 SVG의 부모)
                const commonWrapper = img.parentElement;
                if (!commonWrapper) return;
                
                const imgRect = img.getBoundingClientRect();
                const wrapperRect = commonWrapper.getBoundingClientRect();
                
                // 이미지의 실제 표시 크기 (더 정확한 측정)
                const imgDisplayWidth = imgRect.width;
                const imgDisplayHeight = imgRect.height;
                
                // 이미지의 실제 위치 (공통 wrapper 기준, 더 정확한 측정)
                const imgLeft = imgRect.left - wrapperRect.left;
                const imgTop = imgRect.top - wrapperRect.top;
                
                // 디버깅 로그
                console.log(`[${stroke}-${view}] 이미지 위치:`, {
                  left: imgLeft.toFixed(2),
                  top: imgTop.toFixed(2),
                  width: imgDisplayWidth.toFixed(2),
                  height: imgDisplayHeight.toFixed(2),
                  naturalWidth: img.naturalWidth,
                  naturalHeight: img.naturalHeight,
                });
                
                // SVG 오버레이를 이미지와 정확히 같은 크기와 위치에 배치
                setSvgStyle({
                  width: `${imgDisplayWidth}px`,
                  height: `${imgDisplayHeight}px`,
                  left: `${imgLeft}px`,
                  top: `${imgTop}px`,
                  opacity: 1, // 위치 조정 후 표시
                });

                // SVG를 이미지와 정확히 같은 크기로 표시
                svgElement.style.width = '100%';
                svgElement.style.height = '100%';
                svgElement.style.display = 'block';
                
                // SVG의 원본 viewBox를 확인
                let originalViewBox = svgElement.getAttribute('data-original-viewbox');
                
                if (!originalViewBox) {
                  // 원본 viewBox가 없으면 현재 viewBox 또는 width/height에서 가져오기
                  let currentViewBox = svgElement.getAttribute('viewBox');
                  if (!currentViewBox) {
                    const svgWidth = parseFloat(svgElement.getAttribute('width') || '488');
                    const svgHeight = parseFloat(svgElement.getAttribute('height') || '627');
                    currentViewBox = `0 0 ${svgWidth} ${svgHeight}`;
                  }
                  originalViewBox = currentViewBox;
                  // 원본 viewBox를 data 속성에 저장
                  svgElement.setAttribute('data-original-viewbox', originalViewBox);
                }
                
                const [vx, vy, vw, vh] = originalViewBox.split(/\s+/).map(Number);
                
                // 이미지 크기
                const targetWidth = img.naturalWidth;
                const targetHeight = img.naturalHeight;
                
                // SVG viewBox를 이미지 크기로 설정
                svgElement.setAttribute('viewBox', `0 0 ${targetWidth} ${targetHeight}`);
                
                // 스케일 비율 계산 (원본 viewBox 기준)
                const scaleX = targetWidth / vw;
                const scaleY = targetHeight / vh;
                
                // 실제 렌더링된 SVG wrapper 크기 확인
                const svgWrapperWidth = svgWrapperRef.current?.offsetWidth || 0;
                const svgWrapperHeight = svgWrapperRef.current?.offsetHeight || 0;
                
                console.log(`[${stroke}-${view}] SVG 설정:`, {
                  원본viewBox: originalViewBox,
                  SVG크기: `${vw}x${vh}`,
                  이미지크기: `${targetWidth}x${targetHeight}`,
                  이미지표시크기: `${imgDisplayWidth.toFixed(2)}x${imgDisplayHeight.toFixed(2)}`,
                  SVGwrapper크기: `${svgWrapperWidth.toFixed(2)}x${svgWrapperHeight.toFixed(2)}`,
                  스케일: `scale(${scaleX.toFixed(6)}, ${scaleY.toFixed(6)})`,
                });
                
                // SVG 내부 요소를 <g>로 감싸고 transform scale 적용
                let scaleGroup = svgElement.querySelector('g[data-scaled="true"]');
                
                if (!scaleGroup) {
                  // 새로운 그룹 생성
                  scaleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                  scaleGroup.setAttribute('data-scaled', 'true');
                  
                  // 모든 자식 요소를 그룹으로 이동 (기존 scaleGroup 제외)
                  const children = Array.from(svgElement.children);
                  children.forEach(child => {
                    if (child.tagName !== 'g' || child.getAttribute('data-scaled') !== 'true') {
                      scaleGroup.appendChild(child);
                    }
                  });
                  
                  if (scaleGroup.children.length > 0) {
                    svgElement.appendChild(scaleGroup);
                  }
                }
                
                // transform scale 적용 (원본 viewBox 기준으로 계산)
                scaleGroup.setAttribute('transform', `scale(${scaleX.toFixed(6)}, ${scaleY.toFixed(6)})`);
                
                // preserveAspectRatio를 'none'으로 설정하여 wrapper를 정확히 채움
                svgElement.setAttribute('preserveAspectRatio', 'none');
                
                // SVG 요소 자체의 스타일도 확인
                svgElement.style.margin = '0';
                svgElement.style.padding = '0';
                svgElement.style.border = 'none';
                svgElement.style.outline = 'none';
                
                // SVG wrapper 위치 확인
                requestAnimationFrame(() => {
                  const svgWrapperRect = svgWrapperRef.current?.getBoundingClientRect();
                  if (svgWrapperRect) {
                    console.log(`[${stroke}-${view}] SVG wrapper 위치:`, {
                      left: Math.round(svgWrapperRect.left - wrapperRect.left),
                      top: Math.round(svgWrapperRect.top - wrapperRect.top),
                      width: Math.round(svgWrapperRect.width),
                      height: Math.round(svgWrapperRect.height),
                    });
                  }
                });

                // SVG 내부의 모든 path와 g 요소에 클릭 이벤트만 추가 (호버는 wrapper에서 처리)
                const allPaths = svgElement.querySelectorAll('path, g, circle, rect, ellipse');
                allPaths.forEach((path) => {
                  // 클릭 핸들러 함수 생성
                  const clickHandler = (e) => {
                    e.stopPropagation();
                    handleMuscleClick(e);
                  };
                  
                  // 기존 이벤트 리스너 제거 (중복 방지)
                  path.removeEventListener('click', clickHandler);
                  
                  // 새 이벤트 리스너 추가 (클릭만)
                  path.addEventListener('click', clickHandler);
                  
                  // 커서 스타일 추가
                  path.style.cursor = 'pointer';
                });
              });
            });
      };

      if (img.complete) {
        checkAndUpdate();
      } else {
        img.addEventListener('load', checkAndUpdate, { once: true });
      }
    };

    const timer1 = setTimeout(updateOverlayPosition, 50);
    const timer2 = setTimeout(updateOverlayPosition, 200);
    const timer3 = setTimeout(updateOverlayPosition, 500);
    const timer4 = setTimeout(updateOverlayPosition, 1000);
    
    updateOverlayPosition();
    
    const handleResize = () => {
      setTimeout(updateOverlayPosition, 100);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      window.removeEventListener('resize', handleResize);
    };
  }, [baseImageSrc, stroke, view]);

  // 인체 모형의 위치와 크기 계산 (팝업 위치 조정용)
  const [diagramBounds, setDiagramBounds] = useState({ left: 0, top: 0, right: 0, bottom: 0 });

  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDiagramBounds({
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
        });
      }
    };
    updateBounds();
    window.addEventListener('resize', updateBounds);
    window.addEventListener('scroll', updateBounds);
    return () => {
      window.removeEventListener('resize', updateBounds);
      window.removeEventListener('scroll', updateBounds);
    };
  }, [stroke, view]);

  return (
    <div 
      ref={containerRef}
      className="relative" 
      style={{ 
        position: 'relative', // 부모 기준점
        width: '500px',    // 무대 크기
        height: '600px',   // 무대 크기
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 공통 wrapper - 이미지와 SVG를 정확히 같은 위치에 배치 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* 1. 기본 베이스 인체 모형 (PNG) */}
        <img 
          ref={imgRef}
          src={baseImageSrc} 
          alt="기본 인체 모형" 
          style={{ 
            position: 'absolute',
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        {/* 2. 빨간색 근육 SVG 오버레이 - 이미지와 정확히 같은 크기와 위치로 배치 */}
        <div
          ref={svgWrapperRef}
          onClick={handleMuscleClick}
          onMouseEnter={(e) => {
            setHoveredMuscle(true);
            setHoverPosition({ x: e.clientX, y: e.clientY });
          }}
          onMouseLeave={() => {
            setHoveredMuscle(null);
          }}
          onMouseMove={(e) => {
            if (hoveredMuscle) {
              setHoverPosition({ x: e.clientX, y: e.clientY });
            }
          }}
          style={{
            position: 'absolute',
            ...svgStyle,
            zIndex: 2,
            pointerEvents: 'auto',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: hoveredMuscle ? 'transform 0.3s ease' : 'transform 0.3s ease',
            transform: hoveredMuscle ? 'scale(1.05)' : 'scale(1)',
            transformOrigin: 'center',
          }}
        >
          <MuscleOverlay 
            style={{ 
              width: '100%',
              height: '100%',
              display: 'block',
              transition: hoveredMuscle ? 'filter 0.3s ease' : 'filter 0.3s ease',
              filter: hoveredMuscle ? 'brightness(1.1)' : 'brightness(1)',
            }}
          />
        </div>
      </div>

      {/* 호버 안내 문구 */}
      {hoveredMuscle && (
        <div
          className="fixed z-50 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium shadow-lg pointer-events-none"
          style={{
            left: `${hoverPosition.x + 15}px`,
            top: `${hoverPosition.y - 40}px`,
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
          }}
        >
          💡 클릭하여 상세 정보 보기
        </div>
      )}

      {/* 팝업 배경 (클릭 시 모두 닫기) */}
      {selectedMuscle && (showPopup1 || showPopup2) && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={closeAllPopups}
        />
      )}

      {/* 팝업창 1: 운동 자극 부위 + 추천 대상 */}
      {selectedMuscle && data && showPopup1 && (
        <div
          className="fixed z-50 rounded-xl bg-white shadow-lg border border-gray-200"
          style={{
            // 인체 모형 왼쪽에 배치 (인체 모형을 가리지 않도록 충분히 떨어뜨림)
            left: `${Math.max(20, diagramBounds.left - 340)}px`,
            top: `${Math.max(20, diagramBounds.top)}px`,
            width: '320px',
            maxHeight: '70vh',
            overflow: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 relative">
            {/* 닫기 버튼 */}
            <button
              onClick={closePopup1}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg"
            >
              ✕
            </button>

            {/* 운동 자극 부위 */}
            {data.muscles && data.muscles.length > 0 && (
              <div className="mb-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">운동 자극 부위</h4>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  {data.muscles.map((muscle, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                      <span>{muscle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 추천 대상 */}
            {data.rec && data.rec.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">추천 대상</h4>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  {data.rec.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0"></span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 팝업창 2: 장점 + 단점 */}
      {selectedMuscle && data && showPopup2 && (
        <div
          className="fixed z-50 rounded-xl bg-white shadow-lg border border-gray-200"
          style={{
            // 인체 모형 오른쪽에 배치 (인체 모형을 가리지 않음)
            left: `${Math.min(window.innerWidth - 340, diagramBounds.right + 20)}px`,
            top: `${Math.max(20, diagramBounds.top)}px`,
            width: '320px',
            maxHeight: '70vh',
            overflow: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 relative">
            {/* 닫기 버튼 */}
            <button
              onClick={closePopup2}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg"
            >
              ✕
            </button>

            {/* 자유형 이미지 (자유형일 때만 표시) */}
            {stroke === 'freestyle' && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img 
                  src="/freestyle.jpg" 
                  alt="자유형 수영" 
                  className="w-full h-40 object-cover"
                />
              </div>
            )}

            {/* 배영 이미지 (배영일 때만 표시) */}
            {stroke === 'backstroke' && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img 
                  src="/backstroke.jpg" 
                  alt="배영 수영" 
                  className="w-full h-40 object-cover"
                />
              </div>
            )}

            {/* 평영 이미지 (평영일 때만 표시) */}
            {stroke === 'breaststroke' && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img 
                  src="/breaststroke.jpg" 
                  alt="평영 수영" 
                  className="w-full h-40 object-cover"
                />
              </div>
            )}

            {/* 접영 이미지 (접영일 때만 표시) */}
            {stroke === 'butterfly' && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img 
                  src="/butterfly.jpg" 
                  alt="접영 수영" 
                  className="w-full h-40 object-cover"
                />
              </div>
            )}

            {/* 장점 */}
            {data.pros && data.pros.length > 0 && (
              <div className="mb-5">
                <h4 className="text-sm font-semibold text-emerald-700 mb-2">장점</h4>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  {data.pros.map((pro, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 단점 */}
            {data.cons && data.cons.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-rose-700 mb-2">단점</h4>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  {data.cons.map((con, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 flex-shrink-0"></span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}