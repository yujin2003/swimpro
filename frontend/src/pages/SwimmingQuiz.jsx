import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import { quizAPI, handleAPIError } from "../services/api";

const quizPool = [
  { q: "올림픽에서 자유형 100m 세계 기록은?", options: ["44초", "45초", "46초", "47초"], answer: "46초" },
  { q: "수영에서 접영의 영문 명칭은?", options: ["Butterfly", "Freestyle", "Backstroke", "Breaststroke"], answer: "Butterfly" },
  { q: "수영에서 킥판은 주로 어떤 훈련에 사용될까?", options: ["상체", "하체", "호흡", "자세"], answer: "하체" },
  { q: "올림픽 수영 경기장의 길이는?", options: ["25m", "33m", "50m", "100m"], answer: "50m" },
  { q: "평영에서 팔 동작은 몇 단계로 나뉘나?", options: ["2단계", "3단계", "4단계", "5단계"], answer: "3단계" },
  { q: "배영에서 출발은 어디서 시작될까?", options: ["물속", "스타트대 위", "물 밖", "점프대"], answer: "물속" },
  { q: "자유형에서 가장 중요한 기술은?", options: ["킥", "호흡", "스트로크", "턴"], answer: "스트로크" },
  { q: "수영모자는 왜 쓸까?", options: ["속도 향상", "머리 보호", "시야 확보", "체온 유지"], answer: "속도 향상" },
  { q: "세계 수영 연맹의 약자는?", options: ["FINA", "FIFA", "FIBA", "FIG"], answer: "FINA" },
  { q: "평영에서 다리 동작은 어떤 모양?", options: ["돌고래", "개구리", "물개", "새"], answer: "개구리" },
];

export default function SwimmingQuiz() {
  const [quizSet, setQuizSet] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [grade, setGrade] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API에서 퀴즈 데이터 가져오기
  const startQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎯 퀴즈 시작 API 호출');
      console.log('🎯 API URL:', 'http://localhost:3001/api/quiz/start');
      
      const response = await quizAPI.startQuiz();
      console.log('🎯 퀴즈 API 응답:', response);
      console.log('🎯 응답 타입:', typeof response);
      console.log('🎯 응답 구조:', JSON.stringify(response, null, 2));
      
      if (response && response.quizzes) {
        // 백엔드 데이터 구조에 맞게 변환
        const quizData = response.quizzes.map(quiz => ({
          id: quiz.quiz_id,
          q: quiz.question,
          options: quiz.options,
          answer: null // 정답은 백엔드에서 제외하고 보냄
        }));
        
        setQuizSet(quizData);
        setCurrentQuestion(0);
        setAnswers({});
        setScore(null);
        setGrade("");
        setShowResult(false);
        console.log('✅ 퀴즈 데이터 로드 완료:', quizData.length, '개 문제');
      } else {
        // API에서 데이터를 받지 못한 경우 로컬 데이터 사용
        console.log('⚠️ API 데이터 없음, 로컬 데이터 사용');
        const randomQuiz = [...quizPool].sort(() => 0.5 - Math.random()).slice(0, 6);
        setQuizSet(randomQuiz);
        setCurrentQuestion(0);
        setAnswers({});
        setScore(null);
        setGrade("");
        setShowResult(false);
      }
    } catch (err) {
      console.error('❌ 퀴즈 시작 실패:', err);
      setError(handleAPIError(err));
      
      // 에러 발생 시 로컬 데이터 사용
      console.log('⚠️ 에러 발생, 로컬 데이터 사용');
      const randomQuiz = [...quizPool].sort(() => 0.5 - Math.random()).slice(0, 6);
      setQuizSet(randomQuiz);
      setCurrentQuestion(0);
      setAnswers({});
      setScore(null);
      setGrade("");
      setShowResult(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startQuiz();
  }, []);

  const handleAnswer = (option) => {
    console.log('🎯 답안 선택:', option, '현재 문제:', currentQuestion);
    setAnswers({ ...answers, [currentQuestion]: option });
    console.log('🎯 업데이트된 답안:', { ...answers, [currentQuestion]: option });
  };

  const handleNext = async () => {
    console.log('🎯 다음 버튼 클릭!', '현재 문제:', currentQuestion, '총 문제:', quizSet.length);
    console.log('🎯 현재 답안:', answers[currentQuestion]);
    
    if (currentQuestion < quizSet.length - 1) {
      console.log('🎯 다음 문제로 이동');
      setCurrentQuestion(currentQuestion + 1);
    } else {
      console.log('🎯 마지막 문제 - 결과 처리 시작');
      
      // 먼저 로컬 계산으로 기본 결과 설정 (고정)
      let correct = 0;
      quizSet.forEach((q, i) => {
        if (answers[i] === q.answer) correct++;
      });
      setScore(correct);
      if (correct >= 5) setGrade("🏅 상 (Excellent!)");
      else if (correct >= 3) setGrade("🥈 중 (Good Job!)");
      else setGrade("🥉 하 (Try Again!)");
      
      // 결과 페이지 먼저 표시 (고정)
      setShowResult(true);
      console.log('🎯 결과 페이지 표시 설정 완료 - showResult: true');
      
      // 백엔드 API 호출 (선택사항 - 고정)
      try {
        console.log('🎯 퀴즈 결과 API 제출 시도');
        
        const submitData = {
          answers: quizSet.map((quiz, index) => ({
            quizId: quiz.id,
            selectedOption: answers[index] || null
          }))
        };
        
        console.log('🎯 제출할 데이터:', submitData);
        const response = await quizAPI.submitQuiz(submitData);
        console.log('🎯 퀴즈 제출 응답:', response);
        
        // 백엔드 응답이 있으면 업데이트 (고정)
        if (response && response.correctCount !== undefined) {
          console.log('✅ 백엔드 결과로 업데이트:', response);
          setScore(response.correctCount);
          setGrade(response.rank);
        }
      } catch (err) {
        console.error('❌ 퀴즈 제출 실패 (로컬 결과 유지):', err);
        // 에러가 발생해도 이미 로컬 결과가 표시됨 (고정)
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // 새로운 퀴즈 시작 (고정)
  const generateQuiz = () => {
    console.log('🎯 새로운 퀴즈 시작');
    setShowResult(false);
    setCurrentQuestion(0);
    setAnswers({});
    setScore(null);
    setGrade("");
    startQuiz();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <TopNav />

      {/* Quiz Content */}
      <div className="flex flex-col items-center py-8 px-4">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🏊‍♀️ 수영 퀴즈 🏊‍♂️
          </h2>
          <p className="text-gray-600 text-lg">수영에 대한 지식을 테스트해보세요!</p>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="w-full max-w-2xl text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">퀴즈를 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="w-full max-w-2xl text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-600 mb-4">⚠️ {error}</p>
              <button 
                onClick={startQuiz}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {!loading && !error && !showResult && quizSet.length > 0 && (
          <div className="w-full max-w-2xl">
            {/* 진행률 바 */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">진행률</span>
                <span className="text-sm font-medium text-gray-600">
                  {currentQuestion + 1} / {quizSet.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${((currentQuestion + 1) / quizSet.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* 현재 문제 */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-bold text-lg mb-4">
                  {currentQuestion + 1}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 leading-relaxed">
                  {quizSet[currentQuestion]?.q}
                </h3>
              </div>

              <div className="space-y-4">
                {quizSet[currentQuestion]?.options.map((opt, index) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    className={`w-full py-4 px-6 rounded-2xl text-left transition-all duration-300 transform hover:scale-105 ${
                      answers[currentQuestion] === opt
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                        : "bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                        answers[currentQuestion] === opt
                          ? "border-white"
                          : "border-gray-300"
                      }`}>
                        {answers[currentQuestion] === opt && (
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="font-medium">{opt}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* 네비게이션 버튼 */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← 이전
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={answers[currentQuestion] === undefined || answers[currentQuestion] === null}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {currentQuestion === quizSet.length - 1 ? "결과 보기" : "다음 →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 결과 화면 */}
        {showResult && (
          <div className="w-full max-w-2xl">
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
              <div className="mb-8">
                <div className="text-6xl mb-4">
                  {score >= 5 ? "🏆" : score >= 3 ? "🥈" : "🥉"}
                </div>
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  퀴즈 완료!
                </h3>
                <p className="text-2xl font-bold text-gray-800 mb-2">
                  점수: {score} / {quizSet.length}
                </p>
                <p className="text-xl text-gray-600 mb-6">{grade}</p>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">정답률</h4>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-1000"
                      style={{ width: `${(score / quizSet.length) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {Math.round((score / quizSet.length) * 100)}% 정답
                  </p>
                </div>
              </div>
              
              <button
                onClick={generateQuiz}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🆕 새로운 퀴즈 시작
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
