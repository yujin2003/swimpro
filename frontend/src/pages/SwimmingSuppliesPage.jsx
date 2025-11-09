import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";

// 수영복 종류별 데이터 정의
const SWIMWEAR_TYPES = {
  women: [
    {
      id: 'women-one-piece',
      name: '원피스형 (One-piece)',
      description: '가장 일반적이고 실내 수영장 기본 복장',
      features: '어깨 끈이 고정되어 움직임이 안정적, 초보자에게 추천',
      pros: [
        '안정적인 움직임으로 초보자에게 적합',
        '실내 수영장에서 가장 일반적으로 사용',
        '체형 보완 효과가 좋음'
      ],
      cons: [
        '디자인 선택의 폭이 제한적일 수 있음',
        '일부 사용자는 착용감이 불편할 수 있음'
      ],
      recommended: [
        '수영 초보자',
        '실내 수영장 이용자',
        '안정적인 움직임을 원하는 분'
      ],
      link: 'https://www.arena.co.kr/product/list.html?cate_no=239'
    },
    {
      id: 'women-semi-open-back',
      name: '세미 오픈백 (Semi Open-back)',
      description: '등 부분이 부분적으로 트여 있는 형태',
      features: '디자인이 다양하고 착용감이 편안함',
      pros: [
        '다양한 디자인 선택 가능',
        '착용감이 편안하고 자유로움',
        '어깨 움직임에 제약이 적음'
      ],
      cons: [
        '일부 사용자는 어깨 끈이 불편할 수 있음',
        '초보자는 착용이 어려울 수 있음'
      ],
      recommended: [
        '디자인을 중시하는 분',
        '편안한 착용감을 원하는 분',
        '중급 이상 수영자'
      ],
      link: 'https://www.arena.co.kr/product/list.html?cate_no=239'
    },
    {
      id: 'women-open-back',
      name: '오픈백 / 크로스백 (Open-back / Cross-back)',
      description: '등 부분이 크게 트여있거나 X자형 스트랩',
      features: '어깨 움직임이 자유로워 훈련용으로 적합',
      pros: [
        '어깨 움직임이 매우 자유로움',
        '훈련용으로 최적화된 디자인',
        '속도 향상에 도움'
      ],
      cons: [
        '초보자는 착용이 어려울 수 있음',
        '어깨 끈이 미끄러질 수 있음'
      ],
      recommended: [
        '경기 준비 수영자',
        '훈련용 수영복을 찾는 분',
        '고급 수영자'
      ],
      link: 'https://www.arena.co.kr/product/list.html?cate_no=239'
    },
    {
      id: 'women-high-cut',
      name: '하이컷형 (High-cut)',
      description: '허벅지 절개선이 높은 디자인',
      features: '다리 움직임이 편하고 속도 향상에 도움',
      pros: [
        '다리 움직임이 매우 편함',
        '수저항 감소로 속도 향상',
        '경기용으로 적합'
      ],
      cons: [
        '일부 사용자는 노출이 많다고 느낄 수 있음',
        '초보자에게는 부담스러울 수 있음'
      ],
      recommended: [
        '경기 수영자',
        '속도 향상을 원하는 분',
        '고급 수영자'
      ],
      link: 'https://www.arena.co.kr/product/list.html?cate_no=239'
    },
    {
      id: 'women-rashguard-leggings',
      name: '래시가드 + 레깅스형',
      description: '상·하의 분리형으로 피부 보호 중심',
      features: '자외선 차단, 체형 보완에 좋음 (초보자나 여성 선호 많음)',
      pros: [
        '자외선 차단 효과 우수',
        '체형 보완에 도움',
        '초보자에게 친화적',
        '상하의 분리로 선택의 폭이 넓음'
      ],
      cons: [
        '수저항이 다소 증가할 수 있음',
        '경기용으로는 부적합'
      ],
      recommended: [
        '초보자',
        '자외선 차단이 필요한 분',
        '체형 보완을 원하는 분',
        '레저 수영을 즐기는 분'
      ],
      link: 'https://www.arena.co.kr/product/list.html?cate_no=239'
    }
  ],
  men: [
    {
      id: 'men-briefs',
      name: '삼각형 (Briefs)',
      description: '전통적인 수영복 형태',
      features: '저항이 적고 경기용으로 많이 사용됨',
      pros: [
        '수저항이 가장 적음',
        '경기용으로 최적화',
        '전통적인 디자인으로 널리 사용'
      ],
      cons: [
        '일부 사용자는 노출이 많다고 느낄 수 있음',
        '초보자에게는 부담스러울 수 있음'
      ],
      recommended: [
        '경기 수영자',
        '속도 향상을 원하는 분',
        '전문 수영 선수'
      ],
      link: 'https://www.arena.co.kr/product/list.html?cate_no=239'
    },
    {
      id: 'men-trunks',
      name: '사각형 (Trunks / Square-cut)',
      description: '짧은 반바지 형태',
      features: '실내 수영장 일반용으로 가장 흔함',
      pros: [
        '실내 수영장에서 가장 일반적',
        '착용감이 편안함',
        '초보자에게 적합',
        '다양한 디자인 선택 가능'
      ],
      cons: [
        '수저항이 삼각형보다 다소 높음',
        '경기용으로는 부적합'
      ],
      recommended: [
        '수영 초보자',
        '실내 수영장 이용자',
        '일반 수영 애호가'
      ],
      link: 'https://www.arena.co.kr/product/list.html?cate_no=239'
    },
    {
      id: 'men-jammer',
      name: '반신형 (Jammer)',
      description: '허벅지 중간까지 오는 압박형',
      features: '경기용 또는 훈련용, 근육 지지와 수저항 감소 효과',
      pros: [
        '근육 지지 효과 우수',
        '수저항 감소로 속도 향상',
        '경기용 및 훈련용으로 적합',
        '압박 효과로 피로 감소'
      ],
      cons: [
        '초보자에게는 다소 불편할 수 있음',
        '가격이 상대적으로 높을 수 있음'
      ],
      recommended: [
        '경기 준비 수영자',
        '훈련용 수영복을 찾는 분',
        '근육 지지가 필요한 분'
      ],
      link: 'https://www.arena.co.kr/product/list.html?cate_no=239'
    },
    {
      id: 'men-rashguard-shorts',
      name: '래시가드 + 숏팬츠형',
      description: '상체 보호와 편안함 중심',
      features: '초보자나 체형 보완 목적, 실내보다는 레저용에 가까움',
      pros: [
        '자외선 차단 효과 우수',
        '체형 보완에 도움',
        '초보자에게 친화적',
        '상하의 분리로 선택의 폭이 넓음'
      ],
      cons: [
        '수저항이 다소 증가할 수 있음',
        '경기용으로는 부적합',
        '실내 수영장에서는 덜 사용됨'
      ],
      recommended: [
        '초보자',
        '자외선 차단이 필요한 분',
        '체형 보완을 원하는 분',
        '레저 수영을 즐기는 분'
      ],
      link: 'https://www.arena.co.kr/product/list.html?cate_no=239'
    }
  ]
};

// 기본 API URL (백엔드 서버 주소)
// ngrok 주소 사용 (외부 접근 가능)
const API_BASE_URL = 'https://yasuko-bulletless-trudi.ngrok-free.dev';
// 로컬 서버 사용 (ngrok이 실행되지 않은 경우)
// const API_BASE_URL = 'http://localhost:3001';

// API 요청 헬퍼 함수 (api.js와 유사한 패턴)
async function fetchProducts() {
  const url = `${API_BASE_URL}/api/products`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  };
  
  console.log('📦 제품 목록 API 호출:', url);
  
  // 타임아웃 설정 (5초로 단축)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('📦 API 응답 상태:', response.status, response.ok);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '응답 본문을 읽을 수 없습니다');
      console.error('❌ API 응답 오류:', response.status, errorText);
      
      if (response.status === 404) {
        throw new Error('제품 목록 API를 찾을 수 없습니다. 백엔드 서버를 확인해주세요.');
      } else if (response.status === 500) {
        throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        throw new Error(`제품 목록을 불러오는데 실패했습니다 (${response.status})`);
      }
    }
    
    const data = await response.json();
    console.log('✅ 제품 목록 수신:', Array.isArray(data) ? `${data.length}개` : '배열 아님', data);
    
    // 백엔드 응답 데이터 상세 확인
    if (Array.isArray(data) && data.length > 0) {
      console.log('📦 백엔드 응답 첫 번째 제품 전체 데이터:', JSON.stringify(data[0], null, 2));
      console.log('📦 백엔드 응답 첫 번째 제품 image 필드:', data[0].image);
      console.log('📦 백엔드 응답 첫 번째 제품의 모든 키:', Object.keys(data[0]));
      
      // 모든 제품의 image 필드 확인
      const imagePaths = data.map(p => ({ name: p.name, image: p.image }));
      console.log('📦 백엔드 응답 모든 제품의 image 필드:', imagePaths);
    }
    
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (err.name === 'AbortError') {
      console.error('❌ API 요청 타임아웃:', err);
      throw new Error('서버 응답이 너무 오래 걸립니다. 네트워크 연결을 확인해주세요.');
    }
    
    throw err;
  }
}

// 제품 상세 정보 불러오기 API 함수
async function fetchProductDetail(productId) {
  const url = `${API_BASE_URL}/api/products/${productId}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  };
  
  console.log('📦 제품 상세 정보 API 호출:', url);
  
  // 타임아웃 설정 (5초)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('📦 제품 상세 API 응답 상태:', response.status, response.ok);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '응답 본문을 읽을 수 없습니다');
      console.error('❌ 제품 상세 API 응답 오류:', response.status, errorText);
      
      if (response.status === 404) {
        throw new Error('제품을 찾을 수 없습니다.');
      } else if (response.status === 500) {
        throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        throw new Error(`제품 상세 정보를 불러오는데 실패했습니다 (${response.status})`);
      }
    }
    
    const data = await response.json();
    console.log('✅ 제품 상세 정보 수신:', data);
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (err.name === 'AbortError') {
      console.error('❌ 제품 상세 API 요청 타임아웃:', err);
      throw new Error('서버 응답이 너무 오래 걸립니다. 네트워크 연결을 확인해주세요.');
    }
    
    throw err;
  }
}

export default function SwimmingSuppliesPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true); // 초기값을 true로 변경 (로딩 상태 표시)
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false); // 제품 상세 정보 로딩 상태
  
  console.log('🛍️ SwimmingSuppliesPage 컴포넌트 마운트됨');

  // 백엔드 API에서 제품 목록 불러오기 (비동기로 처리)
  useEffect(() => {
    let isMounted = true; // 컴포넌트가 언마운트되지 않았는지 확인
    
    // 제품 목록 로드
    const loadProducts = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);
        
        console.log('📦 제품 목록 로드 시작...');
        const data = await fetchProducts();
        
        if (!isMounted) return; // 컴포넌트가 언마운트된 경우 업데이트하지 않음
        
        // 응답이 배열인지 확인
        if (Array.isArray(data)) {
          console.log('📦 제품 데이터 샘플:', data[0]);
          console.log('📦 첫 번째 제품의 모든 키:', Object.keys(data[0] || {}));
          console.log('📦 첫 번째 제품 이미지 경로:', data[0]?.image);
          console.log('📦 모든 제품의 이미지 경로:', data.map(p => ({ name: p.name, image: p.image })));
          console.log('📦 첫 번째 제품 shortDescription:', data[0]?.shortDescription);
          console.log('📦 첫 번째 제품 description:', data[0]?.description);
          console.log('📦 첫 번째 제품 전체 데이터:', JSON.stringify(data[0], null, 2));
          
          // 제품 이름에 따라 이미지 경로 매핑 (백엔드에서 image 필드가 없을 경우 대비)
          const imageMap = {
            'Swimming Cap': '/swimming-cap.jpg',
            'Goggles': '/goggles.jpg',
            'Swimming Bag': '/swimming-bag.jpg',
            'Auxiliary Equipment': '/auxiliary-equipment.jpg',
            'One-piece': '/one-piece.jpg',
            'Open-back / Cross-back': '/open-back-cross-back.jpg',
            'Briefs': '/briefs.jpg',
            'Trunks / Square-cut': '/trunks.jpg',
            'Jammer': '/jammer.jpg',
            'Rash guard': '/rashguard.jpg',
            'Women Swimwear': '/women-swimwear.jpg',
            'Men Swimwear': '/men-swimwear.jpg'
          };
          
          // 한글 파일명을 영문 파일명으로 매핑
          const koreanToEnglishImageMap = {
            '/수영모.jpg': '/swimming-cap.jpg',
            '/수경.jpg': '/goggles.jpg',
            '/수영 가방.jpg': '/swimming-bag.jpg',
            '/수영 용품.jpg': '/auxiliary-equipment.jpg',
            '/수영 용품.jpeg': '/auxiliary-equipment.jpg',
            '/원피스.jpg': '/one-piece.jpg',
            '/오픈백_크로스백.jpg': '/open-back-cross-back.jpg',
            '/삼각형.jpg': '/briefs.jpg',
            '/사각형.jpg': '/trunks.jpg',
            '/반신형.jpg': '/jammer.jpg',
            '/남자 래시가드.jpg': '/rashguard.jpg'
          };
          
          // 제품 데이터에 image 필드 추가 및 shortDescription 정규화
          const enrichedData = data.map(product => {
            // 백엔드에서 온 image 경로 확인
            let imagePath = product.image;
            
            // 한글 파일명인 경우 영문 파일명으로 변환
            if (imagePath && koreanToEnglishImageMap[imagePath]) {
              imagePath = koreanToEnglishImageMap[imagePath];
              console.log(`🔄 이미지 경로 변환: ${product.image} → ${imagePath}`);
            }
            
            // image 필드가 없거나 빈 문자열인 경우 제품 이름으로 매핑
            if (!imagePath || imagePath === '') {
              imagePath = imageMap[product.name] || '/swimming-cap.jpg';
            }
            
            return {
              ...product,
              image: imagePath,
              shortDescription: product.shortDescription || product.shortdescription || ''
            };
          });
          
          console.log('📦 이미지 경로 매핑 후 첫 번째 제품:', enrichedData[0]);
          setProducts(enrichedData);
          console.log('✅ 제품 목록 설정 완료:', enrichedData.length, '개');
        } else if (data && Array.isArray(data.products)) {
          // products 필드가 있는 경우
          setProducts(data.products);
          console.log('✅ 제품 목록 설정 완료 (products 필드):', data.products.length, '개');
        } else if (data && data.data && Array.isArray(data.data)) {
          // data 필드가 있는 경우
          setProducts(data.data);
          console.log('✅ 제품 목록 설정 완료 (data 필드):', data.data.length, '개');
        } else {
          console.warn('⚠️ 예상과 다른 응답 형식:', data);
          setProducts([]);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('❌ 제품 목록 로드 실패:', err);
        const errorMessage = err.message || '제품 목록을 불러오는 중 오류가 발생했습니다.';
        setError(errorMessage);
        setProducts([]); // 에러 발생 시 빈 배열로 설정하여 무한 로딩 방지
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();
    
    // 클린업 함수
    return () => {
      isMounted = false;
    };
  }, []);

  // 제품 클릭 핸들러 - API로 상세 정보 불러오기
  const handleProductClick = async (productId) => {
    try {
      setSelectedLoading(true);
      setError(null);
      
      console.log('🔍 제품 상세 정보 불러오기 시작:', productId);
      const productDetail = await fetchProductDetail(productId);
      
      console.log('✅ 제품 상세 정보 로드 완료:', productDetail);
      
      // 이미지 경로 매핑 (제품 목록과 동일한 로직)
      const imageMap = {
        'Swimming Cap': '/swimming-cap.jpg',
        'Goggles': '/goggles.jpg',
        'Swimming Bag': '/swimming-bag.jpg',
        'Auxiliary Equipment': '/auxiliary-equipment.jpg',
        'One-piece': '/one-piece.jpg',
        'Open-back / Cross-back': '/open-back-cross-back.jpg',
        'Briefs': '/briefs.jpg',
        'Trunks / Square-cut': '/trunks.jpg',
        'Jammer': '/jammer.jpg',
        'Rash guard': '/rashguard.jpg',
        'Women Swimwear': '/women-swimwear.jpg',
        'Men Swimwear': '/men-swimwear.jpg'
      };
      
      const koreanToEnglishImageMap = {
        '/수영모.jpg': '/swimming-cap.jpg',
        '/수경.jpg': '/goggles.jpg',
        '/수영 가방.jpg': '/swimming-bag.jpg',
        '/수영 용품.jpg': '/auxiliary-equipment.jpg',
        '/수영 용품.jpeg': '/auxiliary-equipment.jpg',
        '/원피스.jpg': '/one-piece.jpg',
        '/오픈백_크로스백.jpg': '/open-back-cross-back.jpg',
        '/삼각형.jpg': '/briefs.jpg',
        '/사각형.jpg': '/trunks.jpg',
        '/반신형.jpg': '/jammer.jpg',
        '/남자 래시가드.jpg': '/rashguard.jpg'
      };
      
      // 이미지 경로 변환
      let imagePath = productDetail.image;
      if (imagePath && koreanToEnglishImageMap[imagePath]) {
        imagePath = koreanToEnglishImageMap[imagePath];
        console.log(`🔄 제품 상세 이미지 경로 변환: ${productDetail.image} → ${imagePath}`);
      }
      if (!imagePath || imagePath === '') {
        imagePath = imageMap[productDetail.name] || '/swimming-cap.jpg';
      }
      
      // Goggles의 경우 링크를 강제로 올바른 값으로 설정
      if (productDetail.name === "Goggles") {
        productDetail.link = "https://www.arena.co.kr/product/list.html?cate_no=239";
        console.log('🔧 Goggles 링크 수정:', productDetail.link);
      }
      
      // 이미지 경로가 적용된 제품 상세 정보 설정
      const enrichedProductDetail = {
        ...productDetail,
        image: imagePath
      };
      
      console.log('🔗 제품 링크 확인:', {
        productId,
        productName: enrichedProductDetail.name,
        link: enrichedProductDetail.link,
        image: enrichedProductDetail.image,
        fullData: enrichedProductDetail
      });
      setSelected(enrichedProductDetail);
    } catch (err) {
      console.error('❌ 제품 상세 정보 로드 실패:', err);
      alert(err.message || '제품 상세 정보를 불러오는 중 오류가 발생했습니다.');
      setSelected(null);
    } finally {
      setSelectedLoading(false);
    }
  };

  // 컴포넌트 렌더링 확인 로그
  console.log('🛍️ SwimmingSuppliesPage 렌더링:', { loading, error, productsCount: products.length });

  // 수영복 제품 필터링 (Women/Men Swimwear만 제외)
  const swimwearProducts = products.filter(p => 
    p.name === 'Women Swimwear' || p.name === 'Men Swimwear'
  );
  
  // Women/Men Swimwear를 제외한 모든 제품 표시
  const otherProducts = products.filter(p => 
    p.name !== 'Women Swimwear' && p.name !== 'Men Swimwear'
  );

  // 수영복 종류 클릭 핸들러
  const handleSwimwearClick = (swimwear) => {
    setSelected({
      ...swimwear,
      image: swimwearProducts[0]?.image || '/women-swimwear.jpg' // 기본 이미지
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-gray-800">
      <TopNav />

      {/* Product Grid - 반응형 3열 고정 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && !error && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">제품 목록을 불러오는 중...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center max-w-md">
              <p className="text-red-600 mb-4 text-lg font-semibold">❌ {error}</p>
              <p className="text-gray-500 mb-4 text-sm">
                백엔드 서버를 확인하거나 잠시 후 다시 시도해주세요.
              </p>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  window.location.reload();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}
        
        {!loading && !error && products.length === 0 && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <p className="text-gray-600 text-lg mb-2">등록된 제품이 없습니다.</p>
              <p className="text-gray-400 text-sm">새로운 제품이 추가되면 표시됩니다.</p>
            </div>
          </div>
        )}
        
        {!loading && !error && products.length > 0 && (
        <>
          {/* 기타 제품 섹션 */}
          {otherProducts.length > 0 && (
            <div className="mb-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherProducts.map((product, index) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer transform hover:-translate-y-2 hover:scale-105"
                    style={{
                      background: `linear-gradient(145deg, 
                        ${index % 3 === 0 ? '#ffffff' : 
                          index % 3 === 1 ? '#fafbff' : '#f8fafc'}, 
                        ${index % 3 === 0 ? '#f1f5f9' : 
                          index % 3 === 1 ? '#f0f4ff' : '#f1f5f9'})`
                    }}
                  >
                    {/* 상단 액센트 바 - 색상 제거 */}
                    <div className="h-1 w-full bg-gray-200"></div>
                    
                    {/* 상품 이미지 영역 */}
                    <div className="relative w-full h-60 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                      {/* 배경 장식 */}
                      <div className="absolute inset-0 opacity-5">
                        <div className={`absolute top-4 right-4 w-32 h-32 rounded-full ${
                          index % 3 === 0 ? 'bg-blue-500' :
                          index % 3 === 1 ? 'bg-emerald-500' :
                          'bg-rose-500'
                        }`}></div>
                        <div className={`absolute bottom-4 left-4 w-24 h-24 rounded-full ${
                          index % 3 === 0 ? 'bg-indigo-500' :
                          index % 3 === 1 ? 'bg-teal-500' :
                          'bg-pink-500'
                        }`}></div>
                      </div>
                      
                      <img
                        src={product.image || '/swimming-cap.jpg'}
                        alt={product.name}
                        className="relative z-10 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          console.error('❌ 이미지 로드 실패:', product.name, '원본 경로:', product.image, '대체 이미지로 변경');
                          if (e.target.src !== window.location.origin + '/swimming-cap.jpg') {
                            e.target.src = '/swimming-cap.jpg'; // 기본 이미지로 대체
                          }
                        }}
                        onLoad={() => {
                          if (product.image) {
                            console.log('✅ 이미지 로드 성공:', product.name, '경로:', product.image);
                          } else {
                            console.warn('⚠️ 기본 이미지 사용:', product.name, '원본 image 필드:', product.image);
                          }
                        }}
                      />
                      
                      {/* 호버 시 미묘한 오버레이 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>

                    {/* 상품명 영역 */}
                    <div className="relative p-4">
                      <h3 className="text-lg font-bold text-gray-900 text-center group-hover:text-blue-600 transition-colors duration-300 mb-2">
                        {product.name}
                      </h3>
                      
                      {/* 설명 문구 */}
                      {(product.shortDescription || product.shortdescription) && (
                        <p className="text-sm text-gray-600 text-center leading-relaxed mb-2 px-2">
                          {product.shortDescription || product.shortdescription}
                        </p>
                      )}
                      
                      {/* 하단 액센트 라인 - 색상 제거 */}
                      <div className="h-0.5 w-12 mx-auto rounded-full bg-gray-300"></div>
                    </div>
                    
                    {/* 코너 장식 */}
                    <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                      index % 3 === 0 ? 'bg-blue-400' :
                      index % 3 === 1 ? 'bg-emerald-400' :
                      'bg-rose-400'
                    } opacity-60`}></div>
                    <div className={`absolute bottom-4 left-4 w-2 h-2 rounded-full ${
                      index % 3 === 0 ? 'bg-indigo-400' :
                      index % 3 === 1 ? 'bg-teal-400' :
                      'bg-pink-400'
                    } opacity-40`}></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
        )}
      </main>

      {/* Product Detail Modal - 기존 기능 유지 */}
      {(selected || selectedLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full p-2 transition-colors"
              onClick={() => {
                setSelected(null);
                setSelectedLoading(false);
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {selectedLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">제품 상세 정보를 불러오는 중...</p>
                </div>
              </div>
            ) : selected ? (
            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* Product Image */}
              <div className="space-y-4">
                <img
                  src={selected.image || '/one-piece.jpg'}
                  alt={selected.name}
                  className="w-full h-96 object-cover rounded-xl"
                  onError={(e) => {
                    console.error('❌ 모달 이미지 로드 실패:', selected.name, '경로:', selected.image);
                    // 제품 이름에 따라 적절한 이미지 사용
                    if (selected.name === 'One-piece') {
                      e.target.src = '/one-piece.jpg';
                    } else if (selected.name === 'Open-back / Cross-back') {
                      e.target.src = '/open-back-cross-back.jpg';
                    } else if (selected.name === 'Briefs') {
                      e.target.src = '/briefs.jpg';
                    } else if (selected.name === 'Trunks / Square-cut') {
                      e.target.src = '/trunks.jpg';
                    } else if (selected.name === 'Jammer') {
                      e.target.src = '/jammer.jpg';
                    } else if (selected.name === 'Rash guard') {
                      e.target.src = '/rashguard.jpg';
                    } else {
                      e.target.src = '/swimming-cap.jpg';
                    }
                  }}
                  onLoad={() => {
                    console.log('✅ 모달 이미지 로드 성공:', selected.name, '경로:', selected.image);
                  }}
                />
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {selected.name}
                  </h1>
                </div>

                {selected.description && !selected.pros && (
                  <div className="border-t border-b border-gray-200 py-6">
                    <p className="text-gray-700 leading-relaxed">
                      {selected.description}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {selected.pros && Array.isArray(selected.pros) && selected.pros.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">장점 ✅</h3>
                      <ul className="space-y-1">
                        {selected.pros.map((pro, i) => (
                          <li key={i} className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selected.cons && Array.isArray(selected.cons) && selected.cons.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">단점 ⚠️</h3>
                      <ul className="space-y-1">
                        {selected.cons.map((con, i) => (
                          <li key={i} className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 text-orange-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selected.recommended && Array.isArray(selected.recommended) && selected.recommended.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">추천 대상 👤</h3>
                      <ul className="space-y-1">
                        {selected.recommended.map((rec, i) => (
                          <li key={i} className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 text-indigo-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selected.description && (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="font-semibold text-gray-900 mb-2">설명</h3>
                      <p className="text-sm text-gray-600">{selected.description}</p>
                      {selected.features && (
                        <p className="text-xs text-gray-500 mt-2 italic">{selected.features}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-4 pt-6">
            <a
              href={selected.name === "Goggles" ? "https://www.arena.co.kr/product/list.html?cate_no=239" : (selected.link || "#")}
              target="_blank"
              rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium text-center transition-colors"
                    onClick={(e) => {
                      const finalLink = selected.name === "Goggles" ? "https://www.arena.co.kr/product/list.html?cate_no=239" : (selected.link || "#");
                      console.log('🔗 구매하러 가기 클릭:', {
                        productName: selected.name,
                        originalLink: selected.link,
                        finalLink: finalLink
                      });
                      if (!finalLink || finalLink === "#") {
                        e.preventDefault();
                        alert('구매 링크가 설정되지 않았습니다.');
                      }
                    }}
            >
              구매하러 가기 →
            </a>
                </div>
              </div>
            </div>
              ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

