// src/MySwimRoutine.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { swimmingAPI, handleAPIError } from "./services/api.js";
import { useUser } from "./store/user.jsx";
import TopNav from "./components/TopNav.jsx";

export default function MySwimRoutine() {
  const { user, token } = useUser(); // UserProvider에서 사용자 정보 가져오기
  const isLoggedIn = !!user && !!token; // 로그인 상태 확인
  
  const [form, setForm] = useState({
    height: "",
    age: "",
    weight: "",
    skill: "beginner",
    gender: "여",
    pool: "25m",
  });
  
  const [recommendedRoutine, setRecommendedRoutine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  

  const onChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // 루틴 추천 API 호출
  const handleStartRoutine = async () => {
    // 로그인 상태 확인
    if (!isLoggedIn || !token) {
      setError("로그인이 필요합니다. 먼저 로그인해주세요.");
      return;
    }
    
    // 입력 검증
    if (!form.height || !form.age || !form.weight) {
      setError("키, 나이, 몸무게를 모두 입력해주세요.");
      return;
    }
    
    const height = parseInt(form.height);
    const age = parseInt(form.age);
    const weight = parseInt(form.weight);
    
    if (height < 100 || height > 250) {
      setError("키는 100cm ~ 250cm 사이로 입력해주세요.");
      return;
    }
    
    if (age < 5 || age > 100) {
      setError("나이는 5세 ~ 100세 사이로 입력해주세요.");
      return;
    }
    
    if (weight < 20 || weight > 200) {
      setError("몸무게는 20kg ~ 200kg 사이로 입력해주세요.");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // API 연결 테스트 제거 - 바로 루틴 추천 API 호출
      
      const userData = {
        height,
        age,
        weight,
        skill: form.skill,
        gender: form.gender,
        pool: form.pool
      };
      
      console.log('📤 ===== 프론트엔드에서 백엔드로 데이터 전송 =====');
      console.log('📤 전송할 사용자 데이터:', userData);
      console.log('📤 현재 토큰:', localStorage.getItem('authToken'));
      console.log('📤 ================================================');
      
      // POST로 데이터 전송 및 응답 받기
      console.log('📤 POST 요청으로 데이터 전송 및 응답 받기');
      const response = await swimmingAPI.recommendRoutine(userData);
      console.log('📤 POST 응답 완료:', response);
      
      // 🎯 백엔드에서 받은 데이터를 바로 확인
      console.log('🎯 ===== 백엔드에서 받은 데이터 =====');
      console.log('🎯 전체 응답 데이터:', response);
      console.log('🎯 응답이 왔나요?', response ? '✅ 예' : '❌ 아니오');
      console.log('🎯 응답 타입:', Array.isArray(response) ? 'Array' : typeof response);
      console.log('🎯 응답 구조:', Array.isArray(response) ? `Array(${response.length})` : `Object(${Object.keys(response || {}).length})`);
      
      if (response) {
        console.log('🎯 실제 응답 내용:', JSON.stringify(response, null, 2));
        console.log('🎯 userInfo:', response.userInfo);
        console.log('🎯 routine:', response.routine);
        console.log('🎯 generatedAt:', response.generatedAt);
        console.log('🎯 루틴 제목:', response.routine?.title || '❌ 없음');
        console.log('🎯 루틴 설명:', response.routine?.description || '❌ 없음');
        console.log('🎯 운동 개수:', response.routine?.exercises?.length || '❌ 없음');
        console.log('🎯 데이터 수신 성공! ✅');
      } else {
        console.log('🎯 데이터 수신 실패! ❌');
      }
      console.log('🎯 ================================');
      
      if (response) {
        // 백엔드에서 받은 데이터 구조 확인
        console.log('✅ ===== 데이터 구조 분석 =====');
        console.log('✅ 전체 응답:', response);
        console.log('✅ response.routine 존재?', !!response.routine);
        console.log('✅ response.title 존재?', !!response.title);
        console.log('✅ ===========================');
        
        // 데이터 구조에 따라 처리
        const routineData = response.routine || response; // routine이 있으면 사용, 없으면 response 자체 사용
        
        setRecommendedRoutine({
          userInfo: response.userInfo || {},
          routine: routineData,
          generatedAt: response.generatedAt || new Date().toISOString()
        });
        
        console.log('✅ ===== UI 업데이트 완료 =====');
        console.log('✅ 추천 루틴 상태 업데이트 완료');
        console.log('✅ 루틴 제목:', routineData.title);
        console.log('✅ 루틴 설명:', routineData.description);
        console.log('✅ 운동 개수:', routineData.exercises?.length);
        console.log('✅ 전체 routine 객체:', routineData);
        console.log('✅ ===========================');
      } else {
        console.error('❌ 응답이 없습니다:', response);
        setError('백엔드에서 데이터를 받지 못했습니다.');
      }
      
    } catch (err) {
      console.error('❌ 루틴 추천 실패:', err);
      console.error('❌ 에러 상세:', err.message);
      console.error('❌ 에러 스택:', err.stack);
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  // 개선된 추천 메시지 로직
  const recommendation = useMemo(() => {
    const age = parseInt(form.age, 10);
    const height = parseInt(form.height, 10);
    const pool = form.pool;
    const gender = form.gender;

    let headline = "";
    let description = "";
    let routine = [];

    if (age <= 18) {
      headline = "기초 체력 + 기술 교정 루틴";
      description = "젊은 나이의 장점을 살려 기본기를 탄탄히 다지는 루틴입니다.";
      routine = [
        "워밍업: 자유형 200m",
        "기술 연습: 각 영법별 100m씩",
        "체력 강화: 인터벌 트레이닝 400m",
        "쿨다운: 완만한 자유형 200m"
      ];
    } else if (age >= 40) {
      headline = "부상 방지 중심의 저충격 루틴";
      description = "관절에 무리가 가지 않으면서도 효과적인 운동을 위한 루틴입니다.";
      routine = [
        "워밍업: 완만한 자유형 300m",
        "기술 연습: 편안한 영법으로 200m",
        "유산소: 지속적인 자유형 500m",
        "스트레칭: 수중 스트레칭 10분"
      ];
    } else {
      headline = pool === "50m" ? "자유형 100m – 3분 안에 완주하기 도전!" : "자유형 50m – 1분 안에 완주하기 도전!";
      description = "체력과 기술을 균형있게 향상시키는 루틴입니다.";
      routine = [
        "워밍업: 자유형 300m",
        "기술 연습: 각 영법별 150m씩",
        "인터벌: 고강도 400m",
        "쿨다운: 완만한 자유형 200m"
      ];
    }

    return { headline, description, routine };
  }, [form.age, form.height, form.pool, form.gender]);

  return (
    <div className="relative min-h-screen w-full bg-gray-50">
      <TopNav />

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <section className="rounded-3xl bg-white p-10 shadow-sm">
          <h1 className="text-3xl font-extrabold text-indigo-900">
            My Swim Routine
          </h1>
          <p className="mt-2 text-gray-500">
            당신의 키, 나이, 성별, 그리고 수영장 길이를 기반으로 딱 맞는 수영 루틴을 추천해드려요.
          </p>
          
          {!isLoggedIn && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-yellow-600 text-xl mr-2">⚠️</span>
                <div>
                  <p className="text-yellow-800 font-semibold">로그인이 필요합니다</p>
                  <p className="text-yellow-700 text-sm">개인 맞춤 루틴을 받으려면 먼저 로그인해주세요.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* 좌측 폼 */}
            <div className="space-y-6">
              <LabeledInput
                label="키 (cm)"
                name="height"
                type="number"
                value={form.height}
                onChange={onChange}
                placeholder="예: 170"
              />
              <LabeledInput
                label="나이"
                name="age"
                type="number"
                value={form.age}
                onChange={onChange}
                placeholder="예: 25"
              />
              <LabeledInput
                label="몸무게 (kg)"
                name="weight"
                type="number"
                value={form.weight}
                onChange={onChange}
                placeholder="예: 65"
              />
              <LabeledSelect
                label="성별"
                name="gender"
                value={form.gender}
                onChange={onChange}
                options={["여", "남", "기타"]}
              />
              <LabeledSelect
                label="수영 실력"
                name="skill"
                value={form.skill}
                onChange={onChange}
                options={[
                  { value: "beginner", label: "초급 (처음 시작)" },
                  { value: "intermediate", label: "중급 (기본 영법 가능)" },
                  { value: "advanced", label: "고급 (경쟁 수준)" }
                ]}
              />
              <LabeledSelect
                label="수영장 길이"
                name="pool"
                value={form.pool}
                onChange={onChange}
                options={["25m", "50m"]}
              />
            </div>

            {/* 우측 추천 카드 */}
            <aside className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6">
              {!recommendedRoutine ? (
                // 추천 전 기본 화면
                <>
                  <h3 className="text-xl font-extrabold text-indigo-900">개인 맞춤 루틴</h3>
                  <p className="mt-2 text-gray-600">정보를 입력하고 루틴을 추천받아보세요!</p>
                  
                  <div className="mt-6 p-3 bg-white/50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>현재 입력:</strong> {form.height ? `${form.height}cm` : '키 미입력'}, {form.age ? `${form.age}세` : '나이 미입력'}, {form.weight ? `${form.weight}kg` : '몸무게 미입력'}, {form.gender}, {form.pool}
                    </p>
                  </div>
                  
                  <div className="mt-6 flex gap-3">
                    <button 
                      onClick={handleStartRoutine}
                      disabled={loading || !isLoggedIn}
                      className="rounded-full bg-indigo-600 px-5 py-2 text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "추천 중..." : !isLoggedIn ? "로그인 필요" : "루틴 시작"}
                    </button>
                    <Link
                      to="/"
                      className="rounded-full border border-indigo-200 px-5 py-2 text-indigo-700 hover:bg-indigo-100 transition"
                    >
                      홈으로
                    </Link>
                  </div>
                </>
              ) : (
                // 추천 루틴 표시
                <>
                  {/* 타이틀 구간 */}
                  <div className="mb-6 p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg">
                    <h3 className="text-2xl font-bold mb-3 flex items-center">
                      🏊‍♀️ 추천 루틴
                    </h3>
                    <h4 className="text-xl font-semibold leading-relaxed">
                      {recommendedRoutine.routine?.title || '제목 없음'}
                    </h4>
                  </div>

                  {/* Description 구간 */}
                  <div className="mb-6 p-6 bg-white rounded-xl border-l-4 border-blue-500 shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                      📝 루틴 설명
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {recommendedRoutine.routine?.description || '설명 없음'}
                    </p>
                  </div>

                  {/* Steps 구간 */}
                  <div className="mb-6 p-6 bg-white rounded-xl border-l-4 border-green-500 shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      🏃‍♀️ 운동 단계
                    </h3>
                    <div className="space-y-4">
                      {/* 백엔드 steps 배열 표시 */}
                      {(recommendedRoutine.routine?.steps || []).map((step, index) => (
                        <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-800 text-lg leading-relaxed font-medium">
                              {step}
                            </p>
                          </div>
                        </div>
                      )) || <p className="text-gray-500 text-center py-8">운동 단계 정보가 없습니다.</p>}
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button 
                      onClick={() => setRecommendedRoutine(null)}
                      className="rounded-full border border-indigo-200 px-5 py-2 text-indigo-700 hover:bg-indigo-100 transition"
                    >
                      다시 추천받기
                    </button>
                  </div>
                </>
              )}
            </aside>
          </div>
        </section>


        {/* 에러 메시지 */}
        {error && (
          <section className="mt-8 rounded-3xl bg-red-50 p-6 border border-red-200">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-2">⚠️</div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">오류 발생</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setError(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  닫기
                </button>
                {error.includes("로그인이 필요") && (
                  <Link
                    to="/signin"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    로그인하기
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

/** 작은 라벨+입력 컴포넌트 */
function LabeledInput({ label, name, type, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-lg font-bold text-indigo-900">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none ring-indigo-200 transition focus:ring"
      />
    </label>
  );
}

/** 작은 라벨+셀렉트 컴포넌트 */
function LabeledSelect({ label, name, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-lg font-bold text-indigo-900">{label}</span>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 outline-none ring-indigo-200 transition focus:ring"
        >
          {options.map((opt) => (
            <option key={typeof opt === 'object' ? opt.value : opt} value={typeof opt === 'object' ? opt.value : opt}>
              {typeof opt === 'object' ? opt.label : opt}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-gray-400">
          ▾
        </span>
      </div>
    </label>
  );
}
