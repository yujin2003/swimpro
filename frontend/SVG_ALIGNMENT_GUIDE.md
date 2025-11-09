# SVG 정렬 문제 해결 가이드

## 현재 적용된 해결 방법

코드에서 이미지의 실제 렌더링된 크기와 위치를 `getBoundingClientRect()`로 측정하여 SVG를 정확히 같은 위치에 배치하도록 수정했습니다.

## 추가 해결 방법들

### 방법 1: 피그마에서 SVG 재내보내기 (가장 확실한 방법)

1. **피그마에서 회색 인체 모형 이미지를 엽니다** (이것이 기준이 됩니다)

2. **인체 모형 위에 빨간 근육 SVG 조각들을 정확한 위치에 배치합니다**

3. **중요**: 근육 조각들만 선택해서 내보내지 마세요!

4. **대신, 다음을 수행하세요:**
   - 인체 모형과 **크기가 똑같은 투명한 사각형**을 하나 만듭니다 (또는 'Slice' 도구 사용)
   - 이 **투명한 사각형과 모든 빨간 근육 조각들**을 하나의 **그룹(Group)**으로 묶습니다
   - 이 **그룹**을 통째로 SVG로 내보내기(Export) 합니다 (예: `freestyle-front.svg`)

5. **결과**: 새로 만든 SVG 파일은 인체 모형과 크기가 정확히 같고, 근육들은 올바른 위치에 있고, 나머지 영역은 투명합니다.

### 방법 2: 개발자 도구로 미세 조정

브라우저 개발자 도구(F12)를 열고:

1. **Elements 탭**에서 SVG wrapper div를 찾습니다
2. **Styles 패널**에서 `top`, `left`, `width`, `height` 값을 확인합니다
3. **Console**에서 다음 코드를 실행하여 미세 조정:

```javascript
// SVG wrapper 요소 찾기
const svgWrapper = document.querySelector('[ref="svgWrapperRef"]') || 
                   document.querySelector('div[style*="zIndex: 2"]');

// 미세 조정 (필요한 값으로 변경)
svgWrapper.style.top = '0px';      // 위/아래 조정
svgWrapper.style.left = '0px';     // 좌/우 조정
svgWrapper.style.width = '310px';  // 너비 조정
svgWrapper.style.height = '600px'; // 높이 조정
```

### 방법 3: CSS transform으로 미세 조정

코드에서 SVG wrapper에 `transform` 속성을 추가하여 미세 조정:

```jsx
<div
  ref={svgWrapperRef}
  style={{
    ...svgStyle,
    zIndex: 2,
    pointerEvents: 'auto',
    overflow: 'hidden',
    transform: 'translate(0px, 0px)', // 미세 조정: translate(Xpx, Ypx)
  }}
>
```

### 방법 4: SVG 파일 자체 수정

SVG 파일을 직접 열어서:

1. `<svg>` 태그의 `viewBox` 속성을 확인
2. 베이스 이미지의 원본 크기와 일치하도록 `viewBox` 수정
3. 예: 베이스 이미지가 587x1135이면 `viewBox="0 0 587 1135"`로 설정

## 디버깅 팁

### 현재 이미지와 SVG 크기 확인

브라우저 콘솔에서 다음 코드 실행:

```javascript
const img = document.querySelector('img[alt="기본 인체 모형"]');
const svg = document.querySelector('svg');

console.log('이미지 원본 크기:', img.naturalWidth, 'x', img.naturalHeight);
console.log('이미지 표시 크기:', img.offsetWidth, 'x', img.offsetHeight);
console.log('이미지 위치:', img.getBoundingClientRect());

if (svg) {
  console.log('SVG viewBox:', svg.getAttribute('viewBox'));
  console.log('SVG 표시 크기:', svg.offsetWidth, 'x', svg.offsetHeight);
  console.log('SVG 위치:', svg.getBoundingClientRect());
}
```

### 시각적 확인

임시로 SVG에 테두리를 추가하여 위치 확인:

```jsx
<div
  ref={svgWrapperRef}
  style={{
    ...svgStyle,
    zIndex: 2,
    border: '2px solid red', // 임시 테두리
  }}
>
```

## 권장 사항

**가장 확실한 방법은 방법 1 (피그마에서 재내보내기)입니다.** 
이렇게 하면 SVG 파일 자체가 올바른 크기와 위치 정보를 포함하게 되어, 코드에서 복잡한 조정이 필요 없습니다.


