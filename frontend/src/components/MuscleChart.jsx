import { useState } from 'react';
// PNG 파일은 일반 이미지로 import
import baseA from '../svgs/baseA.png';
import baseB from '../svgs/baseB.png';
// SVG 파일은 React 컴포넌트로 import (?react suffix 사용)
import FreeA from '../svgs/freeA.svg?react';
import FreeB from '../svgs/freeB.svg?react';
import BackA from '../svgs/backA.svg?react';
import BackB from '../svgs/backB.svg?react';
import BreaststrokeA from '../svgs/breaststrokeA.svg?react';
import BreaststrokeB from '../svgs/breaststrokeB.svg?react';
import ButterflyA from '../svgs/butterflyA.svg?react';
import ButterflyB from '../svgs/butterflyB.svg?react';

/**
 * 인터랙티브 SVG 근육 차트 컴포넌트
 * - 기본 베이스 인체와 영법별 근육을 겹쳐서 표시
 * - 영법 선택 버튼으로 전환 가능
 */
export default function MuscleChart() {
  const [selectedStroke, setSelectedStroke] = useState('freestyle');
  const [view, setView] = useState('front'); // 'front' | 'back'

  const strokes = {
    freestyle: {
      name: '자유형',
      front: FreeA,
      back: FreeB,
    },
    backstroke: {
      name: '배영',
      front: BackA,
      back: BackB,
    },
    breaststroke: {
      name: '평영',
      front: BreaststrokeA,
      back: BreaststrokeB,
    },
    butterfly: {
      name: '접영',
      front: ButterflyA,
      back: ButterflyB,
    },
  };

  // 현재 선택된 영법의 이미지/컴포넌트
  const baseImageSrc = view === 'front' ? baseA : baseB;
  const MuscleOverlay = strokes[selectedStroke][view];

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-6">수영 영법 근육 차트</h2>

      {/* 영법 선택 버튼 */}
      <div className="flex justify-center gap-2 mb-6">
        {Object.entries(strokes).map(([key, value]) => (
          <button
            key={key}
            onClick={() => setSelectedStroke(key)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              selectedStroke === key
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {value.name}
          </button>
        ))}
      </div>

      {/* 전면/후면 전환 버튼 */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          onClick={() => setView('front')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            view === 'front'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          전면
        </button>
        <button
          onClick={() => setView('back')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            view === 'back'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          후면
        </button>
      </div>

      {/* 차트 컨테이너 */}
      <div className="relative mx-auto" style={{ width: '500px', height: '600px' }}>
        {/* 기본 베이스 인체 모형 (PNG) */}
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <img 
            src={baseImageSrc} 
            alt="기본 인체 모형" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* 영법별 근육 오버레이 (SVG) */}
        <div className="absolute inset-0" style={{ zIndex: 2 }}>
          <MuscleOverlay className="w-full h-full" />
        </div>
      </div>

      {/* 현재 선택된 영법 정보 */}
      <div className="mt-4 text-center">
        <p className="text-gray-600">
          현재 선택: <span className="font-bold text-indigo-600">{strokes[selectedStroke].name}</span> ({view === 'front' ? '전면' : '후면'})
        </p>
      </div>
    </div>
  );
}

