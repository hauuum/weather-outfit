import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || '';

    if (!keyword) {
      return NextResponse.json(
        { error: '검색 키워드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // PEXELS_API_KEY와 NEXT_PUBLIC_PEXELS_API_KEY 둘 다 허용합니다.
    const apiKey =
      process.env.PEXELS_API_KEY ||
      process.env.NEXT_PUBLIC_PEXELS_API_KEY;

    if (!apiKey) {
      console.error('[images] Pexels API 키 환경변수가 없습니다. (PEXELS_API_KEY 또는 NEXT_PUBLIC_PEXELS_API_KEY)');
      return NextResponse.json(
        { error: '서버 설정 오류 (Pexels API 키 없음)' },
        { status: 500 }
      );
    }

    // 콤마로 구분된 키워드 배열에서 랜덤으로 하나 선택
    const keywordList = keyword.split(',').map((k) => k.trim()).filter(Boolean);
    const selectedKeyword = keywordList[Math.floor(Math.random() * keywordList.length)];

    console.log(`[Pexels 요청] 후보=${keywordList.length}개 → 선택="${selectedKeyword}"`);

    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: {
        query:    selectedKeyword,
        per_page: 20,
        page:     Math.floor(Math.random() * 3) + 1, // 1~3 페이지 랜덤
      },
      headers: { Authorization: apiKey },
      timeout: 8000,
    });

    const photos = response.data?.photos;
    console.log(`[Pexels 응답] 사진 수=${photos?.length ?? 0}`);

    if (!photos || photos.length === 0) {
      return NextResponse.json({ images: [] });
    }

    // ── 이미지 필터링 ────────────────────────────────────────
    // 원본 비율 유지 리사이즈라 가로 사진은 height가 300px 미만으로 줄어들 수 있음.
    // 가로가 200px 너비로 표시 시 height가 300px 이상
    // 항상 세로형 이미지로 제공
    const filteredPhotos = photos.filter((p) => {
      const aspectRatio = p.height / p.width;
      return aspectRatio >= 1.5; // height >= width * 1.5 → 세로형 이미지지
    });

    console.log(`[Pexels 필터] 전체=${photos.length}장 → 세로형(비율≥1.5)=${filteredPhotos.length}장`);

    if (filteredPhotos.length === 0) {
      console.log('[Pexels] 세로형 이미지가 없습니다. 전체에서 선택합니다.');

      const fallback = photos.filter((p) => p.height >= 300);
      if (fallback.length === 0) return NextResponse.json({ images: [] });

      const fallbackImages = [...fallback]
        .sort(() => 0.5 - Math.random())
        .slice(0, 5)
        .map((p) => p.src.portrait || p.src.large);

      return NextResponse.json({ images: fallbackImages });
    }

    // 랜덤 셔플 후 5장 추출
    const randomImages = [...filteredPhotos]
      .sort(() => 0.5 - Math.random())
      .slice(0, 5)
      .map((p) => p.src.portrait || p.src.large);

    return NextResponse.json({ images: randomImages });

  } catch (error) {
    console.error('[images error]', error.message);
    console.error('[상세]', error.response?.status, error.response?.data);

    if (error.code === 'ECONNABORTED') {
      return NextResponse.json(
        { error: 'Pexels API 응답 시간이 초과되었습니다.' },
        { status: 504 }
      );
    }

    // Pexels 인증 실패
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Pexels API 키가 유효하지 않습니다.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '이미지를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}