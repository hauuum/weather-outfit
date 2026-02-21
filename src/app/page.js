'use client';

import { useState, useCallback } from 'react';
import SearchBar from '@/components/SearchBar';
import WeatherCard from '@/components/WeatherCard';
import { SEOUL_GU_LIST } from '@/constants/seoul';
import "./page.css";

// ─────────────────────────────────────────────────────────────
// 코디 가이드 — 컴포넌트 외부 순수 함수 + 상수 테이블
// 렌더링마다 재생성되지 않음
//
// PTY 코드: 0=없음, 1=비, 2=비/눈, 3=눈, 5=빗방울, 6=빗방울/눈날림, 7=눈날림
// ─────────────────────────────────────────────────────────────
const RAIN_GUIDE = [
  { minTemp: 20,       desc: '비가 내리고 있어요. 가벼운 우비나 방수 재킷, 우산을 꼭 챙기세요.',   keyword: ['raincoat umbrella rainy day outfit', 'rain jacket street style', 'waterproof outfit rainy']          },
  { minTemp: 12,       desc: '비가 오는 선선한 날씨입니다. 트렌치코트와 방수 부츠를 추천해요.',     keyword: ['trench coat rain boots rainy outfit', 'rainy day trench coat style', 'rain boots fashion']         },
  { minTemp: -Infinity, desc: '비가 오고 쌀쌀합니다. 방수 패딩과 레인부츠로 완벽 대비하세요.',     keyword: ['waterproof puffer jacket rain boots', 'cold rainy weather outfit', 'rain parka winter style']         },
];

const SNOW_GUIDE = [
  { minTemp: 0,         desc: '눈이 내리고 있어요! 방수 부츠와 두꺼운 코트로 따뜻하게 입으세요.',  keyword: ['snow boots winter coat snowy day outfit', 'snowy weather fashion', 'winter snow street style']     },
  { minTemp: -Infinity, desc: '눈이 내리는 강추위입니다. 방한 패딩, 방수 부츠, 목도리, 장갑, 귀마개로 완무장하세요.', keyword: ['heavy snow puffer jacket winter boots scarf gloves earmuffs', 'extreme cold winter outfit', 'winter parka scarf gloves style'] },
];

const CLEAR_GUIDE = [
  { minTemp: 28,        desc: '무더운 날씨입니다. 시원한 민소매나 반바지를 추천해요.',              keyword: ['summer street fashion', 'hot weather casual outfit', 'summer minimal style']                       },
  { minTemp: 23,        desc: '반팔 티셔츠를 입기 딱 좋은 날씨예요.',                              keyword: ['casual summer style', 'tshirt street fashion', 'summer day outfit']                         },
  { minTemp: 20,        desc: '얇은 셔츠나 가디건을 걸치면 좋습니다.',                              keyword: ['light spring layering', 'cardigan spring outfit', 'spring casual fashion']                       },
  { minTemp: 17,        desc: '야상점퍼나 맨투맨/후드티가 잘 어울리는 기온이에요.',                  keyword: ['windbreaker street style', 'casual fall hoodie fashion', 'field Jacket look', 'field coat style']                               },
  { minTemp: 12,        desc: '가죽 자켓이나 트렌치코트, 항공점퍼를 추천해요.',                     keyword: ['trench coat look', 'jacket autumn street style', 'leather jacket casual outfit', 'bomber Jacket style']                            },
  { minTemp: 9,         desc: '쌀쌀해요. 코트나 경량 패딩을 준비하세요.',                           keyword: ['light puffer jacket', 'quilted jacket street style', 'autumn coat fashion']                         },
  { minTemp: 5,         desc: '추운 날씨입니다. 코트와 보온 내의를 챙기세요.',                      keyword: ['winter wool coat', 'coat scarf winter fashion', 'warm winter layering style']                            },
  { minTemp: 0,         desc: '많이 춥습니다. 두꺼운 패딩에 목도리와 장갑을 꼭 챙기세요.',         keyword: ['winter puffer jacket scarf gloves beanie', 'cold weather puffer coat style', 'winter beanie scarf outfit']    },
  { minTemp: -Infinity, desc: '영하의 강추위입니다! 두꺼운 패딩, 방한 모자, 목도리, 장갑, 귀마개까지 완벽히 챙기세요.', keyword: ['extreme cold weather outfit scarf gloves earmuffs winter hat', 'freezing cold winter parka style', 'heavy winter coat hat gloves fashion'] },
];

function getOutfitGuide(temp, ptyCode = 0) {
  const t   = Number(temp);
  const pty = Number(ptyCode);

  // 비+눈 계열 (2, 6) — 단일 케이스
  if (pty === 2 || pty === 6) return {
    desc:    '비와 눈이 섞여 내리고 있어요. 방수 코트, 레인부츠, 우산을 모두 챙기세요.',
    keyword: ['waterproof winter coat rain snow boots umbrella', 'sleet weather outfit', 'rain snow winter fashion'],
  };

  let table;
  if      (pty === 1 || pty === 5) table = RAIN_GUIDE;   // 비/빗방울
  else if (pty === 3 || pty === 7) table = SNOW_GUIDE;   // 눈/눈날림
  else                             table = CLEAR_GUIDE;  // 강수 없음

  return table.find((row) => t >= row.minTemp) ?? table[table.length - 1];
}

// ─────────────────────────────────────────────────────────────
// 초기 상태
// ─────────────────────────────────────────────────────────────
const INITIAL_STATE = {
  weatherData:  null,
  outfit:       null,
  images:       [],
  loading:      false,
  weatherError: '',
  imageError:   '',
};

export default function Home() {
  const [weatherData,  setWeatherData]  = useState(INITIAL_STATE.weatherData);
  const [outfit,       setOutfit]       = useState(INITIAL_STATE.outfit);
  const [images,       setImages]       = useState(INITIAL_STATE.images);
  const [loading,      setLoading]      = useState(INITIAL_STATE.loading);
  const [weatherError, setWeatherError] = useState(INITIAL_STATE.weatherError);
  const [imageError,   setImageError]   = useState(INITIAL_STATE.imageError);
  const [resetKey,     setResetKey]     = useState(0);

  // 초기화
  const handleReset = useCallback(() => {
    setWeatherData(INITIAL_STATE.weatherData);
    setOutfit(INITIAL_STATE.outfit);
    setImages(INITIAL_STATE.images);
    setLoading(INITIAL_STATE.loading);
    setWeatherError(INITIAL_STATE.weatherError);
    setImageError(INITIAL_STATE.imageError);
    setResetKey((k) => k + 1); // SearchBar 언마운트/재마운트 → 입력창 초기화
  }, []);

  const handleSearch = useCallback(async (userInput) => {
    // 빈 입력 체크
    if (!userInput?.trim()) {
      alert('서울시 자치구를 검색해주세요.');
      return;
    }

    // 유효한 구 이름 검증
    const targetGu = SEOUL_GU_LIST.find(
      (gu) => userInput.includes(gu) || userInput.includes(gu.replace('구', ''))
    );
    if (!targetGu) {
      setWeatherError('서울시의 구 단위를 정확히 입력해주세요. (예: 강서구)');
      return;
    }

    // 검색 시작 및 상태 초기화
    setWeatherError('');
    setImageError('');
    setLoading(true);
    setWeatherData(null);
    setImages([]);

    let guide;
    try {
      // 날씨 데이터 fetch
      const weatherRes = await fetch(`/api/weather?gu=${encodeURIComponent(targetGu)}`);
      if (!weatherRes.ok) {
        const err = await weatherRes.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${weatherRes.status}`);
      }
      const data = await weatherRes.json();

      guide = getOutfitGuide(data.temp, data.ptyCode);

      setWeatherData(data);
      setOutfit(guide);

    } catch (err) {
      console.error('[날씨 오류]', err.message);
      setWeatherError(err.message ?? '날씨 데이터를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.');
      setLoading(false);
      return; // 날씨 실패 시 이미지 fetch 불필요
    }

    try {
      // 코디 이미지 fetch, 랜덤으로 선택택
      const keywordParam = Array.isArray(guide.keyword)
        ? guide.keyword.join(',')
        : guide.keyword;
      const imageRes = await fetch(`/api/images?keyword=${encodeURIComponent(keywordParam)}`);
      if (!imageRes.ok) throw new Error(`HTTP ${imageRes.status}`);

      const { images: fetchedImages = [] } = await imageRes.json();

      if (fetchedImages.length === 0) setImageError('추천 이미지를 불러오지 못했습니다.');
      setImages(fetchedImages);

    } catch (err) {
      console.error('[이미지 오류]', err.message);
      setImageError('코디 이미지를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false); // loading 해제는 항상 finally에서만 처리
    }
  }, []);

  const hasResult = weatherData || weatherError || imageError;

  return (
    <main className="relative overflow-hidden min-h-screen flex flex-col items-center py-12 px-4 font-sans text-slate-900">
      <div className="relative z-2 text-center mb-6">
        <h1 className="flex items-center justify-center text-4xl font-black tracking-tight uppercase gap-2">
          <span className='balloon relative p-3.5 text-xl'>서울시</span><span className="">날씨어때</span>
        </h1>
        <p className="text-slate-500 text-base mt-8 font-medium">
          실시간 서울시 날씨 데이터 기반 추천 옷차림
        </p>
      </div>

      {/* 검색창 + 리셋 버튼 */}
      <div className="relative z-2 inputFild block sm:grid w-full max-w-2xl items-center justify-center gap-2">
        <div className="flex">
          <SearchBar key={resetKey} onSearch={handleSearch} />
        </div>

        {/* 결과가 있을 때만 리셋 버튼 표시 */}
        {hasResult && (
          <button
            onClick={handleReset}
            className="b-reset flex-shrink-0 flex w-full sm:w-auto items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-200 font-bold text-slate-600 font-semibold transition-all duration-200 active:scale-95 mt-2 sm:mt-0"
            aria-label="검색 초기화"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>초기화</span>
          </button>
        )}
      </div>

      {/* 날씨 에러 메시지 */}
      {weatherError && (
        <p className="relative z-2 mt-4 text-red-500 text-base font-medium p-2 sm:p-0 backdrop-blur-md sm:backdrop-filter-none">{weatherError}</p>
      )}

      {loading ? (
        <div className="mt-20 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-base">데이터를 불러오는 중...</p>
        </div>
      ) : (
        <>
          <WeatherCard weatherData={weatherData} outfit={outfit} images={images} />
          {imageError && weatherData && (
            <p className="mt-2 text-amber-500 text-xs font-medium">{imageError}</p>
          )}
        </>
      )}
    </main>
  );
}