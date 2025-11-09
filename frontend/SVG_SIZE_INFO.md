# SVG 및 베이스 이미지 크기 정보

## SVG 파일 viewBox 정보

### 전면 (Front)
- **freeA.svg**: viewBox="0 0 488 627" (width="488" height="627")
- **backA.svg**: viewBox="0 0 331 627" (width="331" height="627")
- **breaststrokeA.svg**: viewBox="0 0 331 872" (width="331" height="872")
- **butterflyA.svg**: viewBox="0 0 331 909" (width="331" height="909")

### 후면 (Back)
- **freeB.svg**: viewBox="0 0 413 430" (width="413" height="430")
- **backB.svg**: viewBox="0 0 250 538" (width="250" height="538")
- **breaststrokeB.svg**: viewBox="0 0 324 779" (width="324" height="779")
- **butterflyB.svg**: viewBox="0 0 324 626" (width="324" height="626")

## 문제점

**중요**: 각 SVG 파일의 viewBox가 서로 다릅니다! 

- 전면 SVG들:
  - freeA: 488 x 627
  - backA: 331 x 627
  - breaststrokeA: 331 x 872
  - butterflyA: 331 x 909

- 후면 SVG들:
  - freeB: 413 x 430
  - backB: 250 x 538
  - breaststrokeB: 324 x 779
  - butterflyB: 324 x 626

**베이스 PNG 이미지 (baseA.png, baseB.png)의 실제 픽셀 크기를 확인해야 합니다.**

브라우저 콘솔에서 다음을 실행하여 확인:
```javascript
const imgA = new Image();
imgA.src = '/src/svgs/baseA.png';
imgA.onload = () => console.log('baseA.png:', imgA.naturalWidth, 'x', imgA.naturalHeight);

const imgB = new Image();
imgB.src = '/src/svgs/baseB.png';
imgB.onload = () => console.log('baseB.png:', imgB.naturalWidth, 'x', imgB.naturalHeight);
```

## 해결 방법

베이스 이미지와 SVG 파일의 viewBox가 일치해야 정확히 겹칠 수 있습니다.
현재 코드는 이미지의 실제 렌더링 크기를 측정하여 SVG를 맞추고 있으므로, 
브라우저 콘솔에서 출력되는 크기 정보를 확인하여 문제를 진단할 수 있습니다.






