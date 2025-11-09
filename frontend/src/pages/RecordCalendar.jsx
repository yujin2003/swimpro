import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { logsAPI } from "../services/api.js";
import TopNav from "../components/TopNav";

export default function RecordCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [form, setForm] = useState({ time: "", distance: "", best: "", note: "" });
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 컴포넌트가 마운트될 때 현재 월의 기록 불러오기
  useEffect(() => {
    const loadMonthlyRecords = async () => {
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        
        console.log('📅 초기 로딩: 현재 월 기록 불러오기 시작', { year, month });
        const data = await logsAPI.getCalendar(year, month);
        
        console.log('📅 백엔드에서 받은 기록 데이터:', data);
        
        // 날짜 키 형식 변환 (백엔드가 { dateKey: { time, distance, best, note } } 형식으로 반환)
        const normalizedRecords = {};
        
        // 객체인 경우 처리 (백엔드는 객체를 반환)
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          if (Object.keys(data).length === 0) {
            console.log('⚠️ 기록 없음, 빈 객체로 시작');
            setRecords({});
            return;
          }
          
          // 백엔드가 { dateKey: { time, distance, best, note } } 형식으로 반환
          Object.keys(data).forEach(dateKey => {
            let normalizedKey = dateKey;
            // YYYY-MM-DD 형식이면 toDateString() 형식으로 변환
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
              const date = new Date(dateKey + 'T00:00:00');
              normalizedKey = date.toDateString();
            }
            // 이미 toDateString() 형식이면 그대로 사용
            normalizedRecords[normalizedKey] = data[dateKey];
          });
        }
        // 배열인 경우 처리
        else if (Array.isArray(data)) {
          if (data.length === 0) {
            console.log('⚠️ 기록 없음, 빈 객체로 시작');
            setRecords({});
            return;
          }
          
          // 배열의 첫 번째 항목이 문자열인지 확인 (날짜 문자열 배열인 경우)
          const firstItem = data[0];
          if (typeof firstItem === 'string') {
            // 날짜 문자열 배열인 경우: 각 날짜별로 상세 기록을 가져와야 함
            console.log('📅 날짜 문자열 배열 수신, 각 날짜별 상세 기록 가져오기:', data.length, '개');
            
            // 모든 날짜의 상세 기록을 병렬로 가져오기
            const recordPromises = data.map(async (dateStr) => {
              try {
                const record = await logsAPI.getDateRecord(dateStr);
                return { dateKey: dateStr, record };
              } catch (err) {
                // 404는 기록이 없는 경우 (무시)
                if (err.message && err.message.includes('404')) {
                  return null;
                }
                console.warn('⚠️ 날짜별 기록 가져오기 실패:', dateStr, err);
                return null;
              }
            });
            
            const recordResults = await Promise.all(recordPromises);
            recordResults.forEach((result) => {
              if (result && result.record) {
                let normalizedKey = result.dateKey;
                // YYYY-MM-DD 형식이면 변환
                if (/^\d{4}-\d{2}-\d{2}$/.test(result.dateKey)) {
                  const date = new Date(result.dateKey + 'T00:00:00');
                  normalizedKey = date.toDateString();
                }
                normalizedRecords[normalizedKey] = result.record;
              }
            });
          } else if (firstItem && typeof firstItem === 'object' && firstItem.date) {
            // 객체 배열인 경우 (기존 처리)
            data.forEach((item) => {
              if (item && item.date) {
                let normalizedKey = item.date;
                if (/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
                  const date = new Date(item.date + 'T00:00:00');
                  normalizedKey = date.toDateString();
                }
                normalizedRecords[normalizedKey] = {
                  time: item.time || '',
                  distance: item.distance || '',
                  best: item.best || '',
                  note: item.note || ''
                };
              }
            });
          }
        }
        
        console.log('📅 정규화된 records:', normalizedRecords);
        console.log('📅 기록된 날짜 개수:', Object.keys(normalizedRecords).length);
        
        // records 상태 설정
        setRecords(normalizedRecords);
        console.log('✅ 현재 월 기록 로드 완료:', Object.keys(normalizedRecords).length, '개');
      } catch (err) {
        console.error('❌ 기록 불러오기 실패:', err);
        setRecords({}); // 에러 발생 시 빈 객체로 시작
      }
    };

    loadMonthlyRecords();
  }, [currentMonth]); // currentMonth가 변경될 때마다 API 호출

  // 날짜가 변경될 때 해당 날짜의 기록 불러오기 (백엔드 API 사용)
  useEffect(() => {
    const loadDateRecord = async () => {
    const dateKey = selectedDate.toDateString();
      
      try {
        console.log('📅 GET /api/logs/date/:date 호출 시작:', dateKey);
        const record = await logsAPI.getDateRecord(dateKey);
        console.log('📅 날짜별 기록 수신:', record);
        
        // 폼에 데이터 설정
        setForm(record);
        
        // records 상태도 업데이트 (초록색 표시를 위해)
        setRecords(prev => ({
          ...prev,
          [dateKey]: record
        }));
      } catch (err) {
        // 404는 정상 (기록이 없는 경우)
        if (err.message && err.message.includes('404')) {
          console.log('📅 기록 없음 (정상):', dateKey);
          setForm({ time: "", distance: "", best: "", note: "" });
    } else {
          console.error('❌ 날짜별 기록 불러오기 실패:', err);
      setForm({ time: "", distance: "", best: "", note: "" });
    }
      }
    };

    loadDateRecord();
  }, [selectedDate]);

  const handleSave = async () => {
    const dateKey = selectedDate.toDateString();
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📅 POST /api/logs 호출 시작:', { date: dateKey, ...form });
      await logsAPI.saveRecord({
        date: dateKey,
        time: form.time,
        distance: form.distance,
        best: form.best,
        note: form.note
      });
      
      // 로컬 상태도 즉시 업데이트 (함수형 업데이트 사용하여 확실히 반영)
      const savedRecord = {
        time: form.time || '',
        distance: form.distance || '',
        best: form.best || '',
        note: form.note || ''
      };
      
      // 상태를 즉시 업데이트하고 강제 리렌더링 보장
      setRecords(prev => {
        const updated = {
          ...prev,
          [dateKey]: savedRecord
        };
        console.log('✅ records 상태 업데이트 (저장 후):', {
          dateKey,
          prevKeys: Object.keys(prev),
          prevCount: Object.keys(prev).length,
          prevHasRecord: !!(prev[dateKey]?.time || prev[dateKey]?.distance || prev[dateKey]?.best || prev[dateKey]?.note),
          updatedKeys: Object.keys(updated),
          updatedCount: Object.keys(updated).length,
          record: updated[dateKey],
          hasRecord: !!(updated[dateKey].time || updated[dateKey].distance || updated[dateKey].best || updated[dateKey].note)
        });
        
        return updated;
      });
      
      // 저장 후 현재 월의 기록 다시 불러오기 (백엔드와 동기화)
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        console.log('📅 저장 후 현재 월 기록 재로드:', { year, month });
        const reloadData = await logsAPI.getCalendar(year, month);
        console.log('📅 재로드된 데이터:', reloadData);
        
        // 날짜 키 형식 변환
        const normalizedRecords = {};
        
        if (reloadData && typeof reloadData === 'object' && !Array.isArray(reloadData)) {
          // 백엔드는 객체를 반환 { dateKey: { time, distance, best, note } }
          Object.keys(reloadData).forEach(dateKey => {
            let normalizedKey = dateKey;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
              const date = new Date(dateKey + 'T00:00:00');
              normalizedKey = date.toDateString();
            }
            normalizedRecords[normalizedKey] = reloadData[dateKey];
          });
        } else if (Array.isArray(reloadData)) {
          // 배열인 경우
          if (reloadData.length > 0) {
            const firstItem = reloadData[0];
            if (typeof firstItem === 'string') {
              // 날짜 문자열 배열인 경우: 각 날짜별로 상세 기록을 가져와야 함
              console.log('📅 저장 후: 날짜 문자열 배열 수신, 각 날짜별 상세 기록 가져오기');
              const recordPromises = reloadData.map(async (dateStr) => {
                try {
                  const record = await logsAPI.getDateRecord(dateStr);
                  return { dateKey: dateStr, record };
                } catch (err) {
                  if (err.message && err.message.includes('404')) {
                    return null;
                  }
                  return null;
                }
              });
              const recordResults = await Promise.all(recordPromises);
              recordResults.forEach((result) => {
                if (result && result.record) {
                  let normalizedKey = result.dateKey;
                  if (/^\d{4}-\d{2}-\d{2}$/.test(result.dateKey)) {
                    const date = new Date(result.dateKey + 'T00:00:00');
                    normalizedKey = date.toDateString();
                  }
                  normalizedRecords[normalizedKey] = result.record;
                }
              });
            } else if (firstItem && typeof firstItem === 'object' && firstItem.date) {
              // 객체 배열인 경우
              reloadData.forEach((item) => {
                if (item && item.date) {
                  let normalizedKey = item.date;
                  if (/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
                    const date = new Date(item.date + 'T00:00:00');
                    normalizedKey = date.toDateString();
                  }
                  normalizedRecords[normalizedKey] = {
                    time: item.time || '',
                    distance: item.distance || '',
                    best: item.best || '',
                    note: item.note || ''
                  };
                }
              });
            }
          }
        }
        
        // records 상태 업데이트 (저장된 기록 포함)
        setRecords(normalizedRecords);
        console.log('✅ 저장 후 기록 재로드 완료:', Object.keys(normalizedRecords).length, '개');
      } catch (reloadErr) {
        console.warn('⚠️ 저장 후 재로드 실패:', reloadErr);
        // 에러가 발생해도 이미 로컬 상태에 저장되어 있으므로 문제없음
      }
      
      console.log('✅ 기록 저장 완료, records 상태 업데이트됨');
    alert("기록이 저장되었습니다!");
    } catch (err) {
      console.error('❌ 기록 저장 실패:', err);
      setError(err.message || '기록 저장에 실패했습니다.');
      alert(`기록 저장 실패: ${err.message || '알 수 없는 오류가 발생했습니다.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(new Date(e.target.value));
  };

  // 특정 날짜에 기록이 있는지 확인
  const hasRecord = (date) => {
    if (!date) return false;
    
    const dateKey = date.toDateString();
    const record = records[dateKey];
    
    const hasValidRecord = record && 
           (record.time || record.distance || record.best || record.note);
    
    // 디버깅 로그 (10월 31일만 또는 저장 후)
    if (date.getDate() === 31 && date.getMonth() === 9) { // 10월은 0-based이므로 9
      console.log('🔍 hasRecord 체크 (10월 31일):', {
        date: dateKey,
        recordsKeys: Object.keys(records),
        hasRecord: !!record,
        recordContent: record,
        hasValidRecord: hasValidRecord,
        recordsState: records
      });
    }
    
    return hasValidRecord;
  };

  // 달력 생성 함수들
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // 이전 달의 빈 칸들
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      days.push(date);
    }

    return days;
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return date && date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">수영 기록 관리</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">⚠️ {error}</p>
          </div>
        )}
        
        <div className="flex gap-8">
          {/* Left side - Calendar */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">달력</h2>
              
              {/* 달력 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={goToPreviousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-lg font-semibold">
                  {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                </h3>
                <button 
                  onClick={goToNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* 달력 날짜들 */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((date, index) => {
                  // 매번 최신 records 상태를 참조하도록 함수 내에서 직접 체크
                  const dateHasRecord = date ? (() => {
                    const dateKey = date.toDateString();
                    const record = records[dateKey];
                    return !!(record && (record.time || record.distance || record.best || record.note));
                  })() : false;
                  
                  return (
                  <div key={index} className="aspect-square">
                    {date ? (
                      <button
                        onClick={() => handleDateClick(date)}
                        className={`w-full h-full rounded-lg text-sm font-medium transition-all duration-200 ${
                          isSelected(date)
                            ? 'bg-purple-600 text-white shadow-lg'
                            : isToday(date)
                            ? 'bg-blue-100 text-blue-600 border-2 border-blue-300'
                              : dateHasRecord
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {date.getDate()}
                          {dateHasRecord && !isSelected(date) && (
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mx-auto mt-1"></div>
                        )}
                      </button>
                    ) : (
                      <div className="w-full h-full"></div>
                    )}
                  </div>
                  );
                })}
              </div>

              {/* 선택된 날짜 정보 */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-2">
                  선택된 날짜: {selectedDate.toLocaleDateString('ko-KR')}
                </p>
                {hasRecord(selectedDate) ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium">기록이 있는 날짜</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <span className="text-gray-500">기록이 없는 날짜</span>
                  </div>
                )}
              </div>
              
              {/* 기록 통계 */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">기록 통계</h3>
                <p className="text-blue-600 text-sm">
                  총 기록된 날짜: {Object.keys(records).filter(key => hasRecord(new Date(key))).length}일
                </p>
              </div>

              {/* 범례 */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">범례</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span className="text-gray-600">기록이 있는 날짜</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
                    <span className="text-gray-600">오늘</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-600 rounded"></div>
                    <span className="text-gray-600">선택된 날짜</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Record input */}
          <div className="w-96">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">수영 기록</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="record-time">
                    총 수영 시간
                  </label>
                  <input
                    id="record-time"
                    name="time"
                    type="text"
                    value={form.time}
                    onChange={(e) => setForm({...form, time: e.target.value})}
                    placeholder="시간"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="record-distance">
                    총 수영 거리
                  </label>
                  <input
                    id="record-distance"
                    name="distance"
                    type="text"
                    value={form.distance}
                    onChange={(e) => setForm({...form, distance: e.target.value})}
                    placeholder="거리"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="record-best">
                    최고기록
                  </label>
                  <input
                    id="record-best"
                    name="best"
                    type="text"
                    value={form.best}
                    onChange={(e) => setForm({...form, best: e.target.value})}
                    placeholder="타이머"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="record-note">
                    한줄 일기
                  </label>
                  <textarea
                    id="record-note"
                    name="note"
                    value={form.note}
                    onChange={(e) => setForm({...form, note: e.target.value})}
                    placeholder="내용을 작성하세요."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleSave}
                    className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? '저장 중...' : '저장하기'}
                  </button>
                  {hasRecord(selectedDate) && (
                    <button 
                          onClick={async () => {
                        const dateKey = selectedDate.toDateString();
                        
                        try {
                          setLoading(true);
                          setError(null);
                          
                          console.log('📅 DELETE /api/logs/date/:date 호출 시작:', dateKey);
                          await logsAPI.deleteRecord(dateKey);
                          
                          // 로컬 상태도 업데이트
                          setRecords(prev => {
                            const newRecords = { ...prev };
                        delete newRecords[dateKey];
                            return newRecords;
                          });
                          
                        setForm({ time: "", distance: "", best: "", note: "" });
                          
                          console.log('✅ 기록 삭제 완료');
                        alert("기록이 삭제되었습니다!");
                        } catch (err) {
                          console.error('❌ 기록 삭제 실패:', err);
                          setError(err.message || '기록 삭제에 실패했습니다.');
                          alert(`기록 삭제 실패: ${err.message || '알 수 없는 오류가 발생했습니다.'}`);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                      disabled={loading}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}