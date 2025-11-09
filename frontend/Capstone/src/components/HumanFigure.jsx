// src/components/HumanFigure.jsx
// 정밀한 인체 SVG. props.highlights 배열에 전달된 키를 강조 색으로 채웁니다.
export default function HumanFigure({ highlights = [], highlightColor = "#7c3aed" }) {
  const active = new Set(highlights);
  const get = (key, fallback = "#e5e7eb") => (active.has(key) ? highlightColor : fallback);

  return (
    <svg
      viewBox="0 0 240 560"
      className="w-full max-w-[340px] h-auto"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="human muscle figure"
    >
      {/* 베이스 윤곽선 */}
      <g fill="#111827" opacity="0.95">
        <path d="M111 16c-11 2-19 11-22 22-2 7-2 13-2 20v8h66v-8c0-7 0-13-2-20-3-11-11-20-22-22-6-1-12-1-18 0z"/>
        <rect x="76" y="80" width="88" height="120" rx="24"/>
        <rect x="92" y="200" width="56" height="110" rx="20"/>
        <rect x="64" y="310" width="44" height="140" rx="18"/>
        <rect x="132" y="310" width="44" height="140" rx="18"/>
        <rect x="66" y="450" width="40" height="100" rx="18"/>
        <rect x="134" y="450" width="40" height="100" rx="18"/>
        <rect x="28" y="100" width="32" height="120" rx="14"/>
        <rect x="180" y="100" width="32" height="120" rx="14"/>
      </g>

      {/* 근육 레이어 (부위별 id) */}
      {/* 승모근 */}
      <path id="traps" d="M92 80h56l-28 22z" fill={get("traps")} />

      {/* 어깨 */}
      <circle id="shoulders_l" cx="60" cy="110" r="22" fill={get("shoulders")} />
      <circle id="shoulders_r" cx="180" cy="110" r="22" fill={get("shoulders")} />

      {/* 삼두근 */}
      <rect id="triceps_l" x="28" y="140" width="20" height="70" rx="10" fill={get("triceps")} />
      <rect id="triceps_r" x="192" y="140" width="20" height="70" rx="10" fill={get("triceps")} />

      {/* 광배근 */}
      <path id="lats_l" d="M76 120c-10 22-12 48-8 72l32-30-24-42z" fill={get("lats")} />
      <path id="lats_r" d="M164 120c10 22 12 48 8 72l-32-30 24-42z" fill={get("lats")} />

      {/* 흉근 */}
      <rect id="chest" x="88" y="96" width="64" height="38" rx="10" fill={get("chest", "#f3f4f6")} />

      {/* 코어 */}
      <rect id="core" x="100" y="200" width="40" height="80" rx="14" fill={get("core")} />

      {/* 둔근 */}
      <rect id="glutes_l" x="88" y="290" width="26" height="26" rx="10" fill={get("glutes")} />
      <rect id="glutes_r" x="126" y="290" width="26" height="26" rx="10" fill={get("glutes")} />

      {/* 내전근 */}
      <rect id="adductors" x="104" y="318" width="32" height="40" rx="10" fill={get("adductors")} />

      {/* 대퇴사두근 */}
      <rect id="quads_l" x="70" y="322" width="30" height="76" rx="12" fill={get("quads")} />
      <rect id="quads_r" x="140" y="322" width="30" height="76" rx="12" fill={get("quads")} />

      {/* 햄스트링 */}
      <rect id="hamstrings_l" x="70" y="398" width="30" height="44" rx="10" fill={get("hamstrings")} />
      <rect id="hamstrings_r" x="140" y="398" width="30" height="44" rx="10" fill={get("hamstrings")} />

      {/* 종아리 */}
      <rect id="calves_l" x="70" y="470" width="30" height="60" rx="10" fill={get("calves", "#e5e7eb")} />
      <rect id="calves_r" x="140" y="470" width="30" height="60" rx="10" fill={get("calves", "#e5e7eb")} />
    </svg>
  );
}













