import { NextResponse } from 'next/server';

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

    const apiKey =
      process.env.PEXELS_API_KEY ||
      process.env.NEXT_PUBLIC_PEXELS_API_KEY;

    if (!apiKey) {
      console.error('[images] Pexels API 키 환경변수가 없습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류 (Pexels API 키 없음)' },
        { status: 500 }
      );
    }

    // 콤마로 구분된 키워드 배열에서 랜덤으로 하나 선택
    const keywordList    = keyword.split(',').map((k) => k.trim()).filter(Boolean);
    const selectedKeyword = keywordList[Math.floor(Math.random() * keywordList.length)];
    const randomPage      = Math.floor(Math.random() * 3) + 1; // 1~3 페이지 랜덤

    console.log(`[Pexels 요청] 후보=${keywordList.length}개 → 선택="${selectedKeyword}" page=${randomPage}`);

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(selectedKeyword)}&per_page=20&page=${randomPage}`;

    const res = await fetch(url, {
      headers: { Authorization: apiKey },
      signal:  AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      if (res.status === 401) {
        return NextResponse.json(
          { error: 'Pexels API 키가 유효하지 않습니다.' },
          { status: 401 }
        );
      }
      throw new Error(`Pexels 서버 오류: HTTP ${res.status}`);
    }

    const data   = await res.json();
    const photos = data?.photos ?? [];
    console.log(`[Pexels 응답] 사진 수=${photos.length}`);

    if (photos.length === 0) {
      return NextResponse.json({ images: [] });
    }

    // 세로형 비율(height/width >= 1.5) 필터 → portrait src 사용
    const filtered = photos.filter((p) => p.height / p.width >= 1.5);
    console.log(`[Pexels 필터] 전체=${photos.length} → 세로형=${filtered.length}`);

    const pool = filtered.length > 0 ? filtered : photos.filter((p) => p.height >= 300);
    if (pool.length === 0) return NextResponse.json({ images: [] });

    const randomImages = [...pool]
      .sort(() => 0.5 - Math.random())
      .slice(0, 5)
      .map((p) => p.src.portrait || p.src.large);

    console.log(`[Pexels 완료] 최종 선택=${randomImages.length}장`);

    return NextResponse.json({ images: randomImages });

  } catch (error) {
    console.error('[images error]', error.message);

    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Pexels API 응답 시간이 초과되었습니다.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: '이미지를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}