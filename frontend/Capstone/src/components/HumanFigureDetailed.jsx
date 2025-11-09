// src/components/HumanFigureDetailed.jsx
// 의학적 인체 도해(전면/후면 간이 SVG). 전달된 키만 강조합니다.

export default function HumanFigureDetailed({
  view = "front", // 'front' | 'back'
  highlights = [],
  highlightColor = "#7c3aed",
  baseColor = "#e5e7eb",
}) {
  const active = new Set(highlights);
  const get = (key) => (active.has(key) ? highlightColor : baseColor);

  return view === "back" ? (
    <BackSVG get={get} />
  ) : (
    <FrontSVG get={get} />
  );
}

function FrontSVG({ get }) {
  return (
    <svg viewBox="0 0 280 600" className="w-full max-w-[380px] h-auto" xmlns="http://www.w3.org/2000/svg">
      {/* 베이스(전면) – 더 자연스러운 인체 비율과 피부 톤 */}
      <g fill="#f5d0c5" stroke="#9ca3af" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round">
        {/* 머리 - 더 자연스러운 타원형 */}
        <ellipse cx="140" cy="55" rx="28" ry="32" />
        {/* 머리카락 */}
        <path d="M112 35 C112 25, 125 20, 140 20 C155 20, 168 25, 168 35 C168 45, 155 50, 140 50 C125 50, 112 45, 112 35 Z" fill="#8b4513" />
        {/* 목 - 더 자연스러운 곡선 */}
        <path d="M125 85 C125 95, 130 100, 140 100 C150 100, 155 95, 155 85 L155 105 C155 115, 150 120, 140 120 C130 120, 125 115, 125 105 Z" />
        {/* 상체 - 더 자연스러운 어깨와 허리 라인 */}
        <path d="M85 105 C85 95, 105 90, 140 90 C175 90, 195 95, 195 105 L195 200 C195 220, 180 235, 140 235 C100 235, 85 220, 85 200 Z" />
        {/* 골반 - 더 자연스러운 곡선 */}
        <path d="M105 235 C105 255, 120 270, 140 270 C160 270, 175 255, 175 235 L175 250 C175 270, 160 285, 140 285 C120 285, 105 270, 105 250 Z" />
        {/* 좌/우 팔 - 더 자연스러운 근육 라인 */}
        <path d="M50 140 C50 120, 65 110, 80 115 C90 118, 95 130, 95 145 L95 230 C95 245, 85 255, 70 255 C55 255, 50 240, 50 225 Z" />
        <path d="M230 140 C230 120, 215 110, 200 115 C190 118, 185 130, 185 145 L185 230 C185 245, 195 255, 210 255 C225 255, 230 240, 230 225 Z" />
        {/* 좌/우 허벅지 - 더 자연스러운 근육 라인 */}
        <path d="M80 295 C75 340, 75 375, 85 420 C90 445, 100 465, 115 470 C130 475, 135 450, 135 420 L135 300 C135 285, 125 280, 115 280 C100 280, 85 285, 80 295 Z" />
        <path d="M200 295 C205 340, 205 375, 195 420 C190 445, 180 465, 165 470 C150 475, 145 450, 145 420 L145 300 C145 285, 155 280, 165 280 C180 280, 195 285, 200 295 Z" />
        {/* 종아리/하퇴 - 더 자연스러운 근육 라인 */}
        <path d="M85 420 C80 450, 80 485, 85 520 C90 535, 100 550, 115 555 C130 560, 135 545, 135 530 L135 420 Z" />
        <path d="M195 420 C200 450, 200 485, 195 520 C190 535, 180 550, 165 555 C150 560, 145 545, 145 530 L145 420 Z" />
        {/* 발 */}
        <ellipse cx="110" cy="575" rx="15" ry="8" fill="#f5d0c5" stroke="#9ca3af" strokeWidth="1.2" />
        <ellipse cx="170" cy="575" rx="15" ry="8" fill="#f5d0c5" stroke="#9ca3af" strokeWidth="1.2" />
      </g>

      {/* 얼굴 디테일 */}
      <g fill="#333" stroke="none">
        {/* 눈 */}
        <ellipse cx="130" cy="50" rx="3" ry="4" />
        <ellipse cx="150" cy="50" rx="3" ry="4" />
        {/* 코 */}
        <ellipse cx="140" cy="60" rx="2" ry="3" />
        {/* 입 */}
        <path d="M135 68 C135 70, 137 72, 140 72 C143 72, 145 70, 145 68" stroke="#333" strokeWidth="1" fill="none" />
      </g>

      {/* 전면 근육 레이어 - 더 자연스러운 곡선 */}
      <path id="front_chest" d="M100 110 C100 105, 120 100, 140 100 C160 100, 180 105, 180 110 L180 140 C180 150, 170 160, 140 160 C110 160, 100 150, 100 140 Z" fill={get("chest")} />
      <path id="front_abs" d="M120 200 C120 195, 130 190, 140 190 C150 190, 160 195, 160 200 L160 270 C160 280, 150 290, 140 290 C130 290, 120 280, 120 270 Z" fill={get("abs")} />
      <path id="front_obliques_l" d="M100 200 C95 220, 95 250, 100 270 C105 280, 115 285, 120 280 L120 200 Z" fill={get("obliques")} />
      <path id="front_obliques_r" d="M180 200 C185 220, 185 250, 180 270 C175 280, 165 285, 160 280 L160 200 Z" fill={get("obliques")} />

      <ellipse id="front_shoulders_l" cx="70" cy="125" rx="20" ry="15" fill={get("shoulders")} />
      <ellipse id="front_shoulders_r" cx="210" cy="125" rx="20" ry="15" fill={get("shoulders")} />

      <path id="front_biceps_l" d="M60 150 C55 160, 55 200, 60 220 C65 230, 75 235, 80 230 L80 150 Z" fill={get("biceps")} />
      <path id="front_biceps_r" d="M220 150 C225 160, 225 200, 220 220 C215 230, 205 235, 200 230 L200 150 Z" fill={get("biceps")} />

      <path id="front_forearms_l" d="M70 220 C65 230, 65 250, 70 260 C75 270, 85 275, 90 270 L90 220 Z" fill={get("forearms")} />
      <path id="front_forearms_r" d="M210 220 C215 230, 215 250, 210 260 C205 270, 195 275, 190 270 L190 220 Z" fill={get("forearms")} />

      <path id="front_quads_l" d="M90 300 C85 320, 85 380, 90 400 C95 420, 105 430, 115 425 L115 300 Z" fill={get("quads")} />
      <path id="front_quads_r" d="M190 300 C195 320, 195 380, 190 400 C185 420, 175 430, 165 425 L165 300 Z" fill={get("quads")} />

      <path id="front_adductors" d="M125 300 C120 320, 120 350, 125 370 C130 380, 140 385, 150 380 L150 300 Z" fill={get("adductors")} />

      <path id="front_tibialis_l" d="M90 420 C85 440, 85 460, 90 470 C95 480, 105 485, 115 480 L115 420 Z" fill={get("tibialis")} />
      <path id="front_tibialis_r" d="M190 420 C195 440, 195 460, 190 470 C185 480, 175 485, 165 480 L165 420 Z" fill={get("tibialis")} />

      <path id="front_calves_l" d="M90 470 C85 490, 85 520, 90 540 C95 550, 105 555, 115 550 L115 470 Z" fill={get("calves")} />
      <path id="front_calves_r" d="M190 470 C195 490, 195 520, 190 540 C185 550, 175 555, 165 550 L165 470 Z" fill={get("calves")} />
    </svg>
  );
}

function BackSVG({ get }) {
  return (
    <svg viewBox="0 0 280 600" className="w-full max-w-[380px] h-auto" xmlns="http://www.w3.org/2000/svg">
      {/* 베이스(후면) – 더 자연스러운 인체 비율과 피부 톤 */}
      <g fill="#f5d0c5" stroke="#9ca3af" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round">
        {/* 머리 - 더 자연스러운 타원형 */}
        <ellipse cx="140" cy="55" rx="28" ry="32" />
        {/* 머리카락 */}
        <path d="M112 35 C112 25, 125 20, 140 20 C155 20, 168 25, 168 35 C168 45, 155 50, 140 50 C125 50, 112 45, 112 35 Z" fill="#8b4513" />
        {/* 목 - 더 자연스러운 곡선 */}
        <path d="M125 85 C125 95, 130 100, 140 100 C150 100, 155 95, 155 85 L155 105 C155 115, 150 120, 140 120 C130 120, 125 115, 125 105 Z" />
        {/* 등/허리 외곽 - 더 자연스러운 곡선 */}
        <path d="M85 105 C85 95, 105 90, 140 90 C175 90, 195 95, 195 105 L195 200 C195 220, 180 235, 140 235 C100 235, 85 220, 85 200 Z" />
        {/* 골반 - 더 자연스러운 곡선 */}
        <path d="M105 235 C105 255, 120 270, 140 270 C160 270, 175 255, 175 235 L175 250 C175 270, 160 285, 140 285 C120 285, 105 270, 105 250 Z" />
        {/* 팔 뒤쪽 - 더 자연스러운 근육 라인 */}
        <path d="M50 140 C50 120, 65 110, 80 115 C90 118, 95 130, 95 145 L95 230 C95 245, 85 255, 70 255 C55 255, 50 240, 50 225 Z" />
        <path d="M230 140 C230 120, 215 110, 200 115 C190 118, 185 130, 185 145 L185 230 C185 245, 195 255, 210 255 C225 255, 230 240, 230 225 Z" />
        {/* 허벅지 뒤쪽 - 더 자연스러운 근육 라인 */}
        <path d="M80 295 C75 340, 75 375, 85 420 C90 445, 100 465, 115 470 C130 475, 135 450, 135 420 L135 300 C135 285, 125 280, 115 280 C100 280, 85 285, 80 295 Z" />
        <path d="M200 295 C205 340, 205 375, 195 420 C190 445, 180 465, 165 470 C150 475, 145 450, 145 420 L145 300 C145 285, 155 280, 165 280 C180 280, 195 285, 200 295 Z" />
        {/* 종아리 뒤쪽 - 더 자연스러운 근육 라인 */}
        <path d="M85 420 C80 450, 80 485, 85 520 C90 535, 100 550, 115 555 C130 560, 135 545, 135 530 L135 420 Z" />
        <path d="M195 420 C200 450, 200 485, 195 520 C190 535, 180 550, 165 555 C150 560, 145 545, 145 530 L145 420 Z" />
        {/* 발 */}
        <ellipse cx="110" cy="575" rx="15" ry="8" fill="#f5d0c5" stroke="#9ca3af" strokeWidth="1.2" />
        <ellipse cx="170" cy="575" rx="15" ry="8" fill="#f5d0c5" stroke="#9ca3af" strokeWidth="1.2" />
      </g>

      {/* 후면 근육 레이어 - 더 자연스러운 곡선 */}
      <path id="back_traps" d="M100 100 C100 95, 120 90, 140 90 C160 90, 180 95, 180 100 L180 130 C180 140, 170 150, 140 150 C110 150, 100 140, 100 130 Z" fill={get("traps")} />
      <ellipse id="back_rearDelts_l" cx="70" cy="125" rx="18" ry="12" fill={get("rearDelts")} />
      <ellipse id="back_rearDelts_r" cx="210" cy="125" rx="18" ry="12" fill={get("rearDelts")} />

      <path id="back_lats_l" d="M85 130 C80 150, 80 180, 85 210 C90 230, 100 240, 110 235 L110 130 Z" fill={get("lats")} />
      <path id="back_lats_r" d="M195 130 C200 150, 200 180, 195 210 C190 230, 180 240, 170 235 L170 130 Z" fill={get("lats")} />

      <path id="back_erectors" d="M120 200 C115 210, 115 280, 120 290 C125 300, 135 305, 140 300 C145 305, 155 300, 160 290 C165 280, 165 210, 160 200 L140 200 Z" fill={get("erectors")} />

      <path id="back_triceps_l" d="M60 150 C55 160, 55 200, 60 220 C65 230, 75 235, 80 230 L80 150 Z" fill={get("triceps")} />
      <path id="back_triceps_r" d="M220 150 C225 160, 225 200, 220 220 C215 230, 205 235, 200 230 L200 150 Z" fill={get("triceps")} />

      <path id="back_forearms_l" d="M70 220 C65 230, 65 250, 70 260 C75 270, 85 275, 90 270 L90 220 Z" fill={get("forearms")} />
      <path id="back_forearms_r" d="M210 220 C215 230, 215 250, 210 260 C205 270, 195 275, 190 270 L190 220 Z" fill={get("forearms")} />

      <ellipse id="back_glutes_l" cx="115" cy="300" rx="20" ry="15" fill={get("glutes")} />
      <ellipse id="back_glutes_r" cx="165" cy="300" rx="20" ry="15" fill={get("glutes")} />

      <path id="back_hams_l" d="M90 300 C85 320, 85 380, 90 400 C95 420, 105 430, 115 425 L115 300 Z" fill={get("hamstrings")} />
      <path id="back_hams_r" d="M190 300 C195 320, 195 380, 190 400 C185 420, 175 430, 165 425 L165 300 Z" fill={get("hamstrings")} />

      <path id="back_calves_l" d="M90 470 C85 490, 85 520, 90 540 C95 550, 105 555, 115 550 L115 470 Z" fill={get("calves")} />
      <path id="back_calves_r" d="M190 470 C195 490, 195 520, 190 540 C185 550, 175 555, 165 550 L165 470 Z" fill={get("calves")} />
    </svg>
  );
}


