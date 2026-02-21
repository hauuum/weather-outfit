import { NextResponse } from 'next/server';
import axios from 'axios';
import { SEOUL_GU_LIST, SEOUL_GU_GRID } from '@/constants/seoul';

const normalize = (str) => str.replace('구', '').trim();

// ─────────────────────────────────────────────────────────────
// 기상청 초단기실황 base_date / base_time 계산 (KST 기준)
// - 매시 정시에 생성, 10분 이후 호출 가능
// - 서버가 UTC로 동작할 경우에도 KST(+9)로 보정
// ─────────────────────────────────────────────────────────────
function getBaseDateTime() {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kst = new Date(now.getTime() + kstOffset);

  // 10분 미만이면 이전 시각 사용 (데이터 미생성 방지)
  if (kst.getUTCMinutes() < 10) {
    kst.setUTCHours(kst.getUTCHours() - 1);
  }

  const pad   = (n) => String(n).padStart(2, '0');
  const year  = kst.getUTCFullYear();
  const month = pad(kst.getUTCMonth() + 1);
  const day   = pad(kst.getUTCDate());
  const hour  = pad(kst.getUTCHours());

  return {
    base_date: `${year}${month}${day}`,
    base_time: `${hour}00`,
  };
}

function getPtyLabel(pty) {
  const map = { 0: '없음', 1: '비', 2: '비/눈', 3: '눈', 5: '빗방울', 6: '빗방울/눈날림', 7: '눈날림' };
  return map[Number(pty)] ?? '없음';
}

function getWeatherDescription(pty, t1h) {
  if (Number(pty) !== 0) return getPtyLabel(pty);
  const temp = Number(t1h);
  if (temp >= 28) return '맑고 더움';
  if (temp >= 20) return '맑음';
  if (temp >= 10) return '맑고 선선함';
  return '맑고 쌀쌀함';
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const guName = searchParams.get('gu') || '';

    if (!guName) {
      return NextResponse.json(
        { error: '구 이름을 입력해주세요. (예: ?gu=강서구)' },
        { status: 400 }
      );
    }

    const validGu = SEOUL_GU_LIST.find(
      (gu) => normalize(gu) === normalize(guName)
    );
    if (!validGu) {
      return NextResponse.json(
        { error: `'${guName}'은(는) 유효한 서울시 구 이름이 아닙니다.` },
        { status: 400 }
      );
    }

    const apiKey = process.env.KMA_API_KEY;
    if (!apiKey) {
      console.error('[weather] KMA_API_KEY 환경변수가 없습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류 (API 키 없음)' },
        { status: 500 }
      );
    }

    const grid = SEOUL_GU_GRID[validGu];
    if (!grid) {
      return NextResponse.json(
        { error: `'${validGu}'의 격자 좌표를 찾을 수 없습니다.` },
        { status: 404 }
      );
    }

    const { base_date, base_time } = getBaseDateTime();
    console.log(`[KMA 요청] gu=${validGu} nx=${grid.nx} ny=${grid.ny} date=${base_date} time=${base_time}`);

    // ── 핵심 수정: serviceKey 이중 인코딩 방지 ──────────────────
    // axios params 사용 시 serviceKey가 이중 인코딩되어 인증 실패(500) 발생.
    // decodeURIComponent로 디코딩 후 URL 문자열에 직접 삽입합니다.
    const decodedKey = decodeURIComponent(apiKey);
    const endpoint   = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';
    const qs = [
      `serviceKey=${encodeURIComponent(decodedKey)}`,
      `numOfRows=10`,
      `pageNo=1`,
      `dataType=JSON`,
      `base_date=${base_date}`,
      `base_time=${base_time}`,
      `nx=${grid.nx}`,
      `ny=${grid.ny}`,
    ].join('&');

    const response = await axios.get(`${endpoint}?${qs}`, { timeout: 8000 });

    const resultCode = response.data?.response?.header?.resultCode;
    const resultMsg  = response.data?.response?.header?.resultMsg ?? '';
    console.log(`[KMA 응답] code=${resultCode} msg=${resultMsg}`);

    if (resultCode !== '00') {
      console.error(`[KMA 오류] code=${resultCode} msg=${resultMsg}`);
      return NextResponse.json(
        { error: `기상청 API 오류 (${resultCode}): ${resultMsg}` },
        { status: 502 }
      );
    }

    const items = response.data?.response?.body?.items?.item ?? [];
    if (items.length === 0) {
      return NextResponse.json(
        { error: '기상청 API에서 데이터를 받아오지 못했습니다.' },
        { status: 404 }
      );
    }

    const getValue = (cat) =>
      items.find((i) => i.category === cat)?.obsrValue ?? null;

    const t1h = getValue('T1H');
    const reh = getValue('REH');
    const wsd = getValue('WSD');
    const pty = getValue('PTY');
    const rn1 = getValue('RN1');

    console.log(`[KMA 파싱] T1H=${t1h} REH=${reh} WSD=${wsd} PTY=${pty} RN1=${rn1}`);

    return NextResponse.json({
      cityName:      `서울시 ${validGu}`,
      temp:          t1h !== null ? parseFloat(Number(t1h).toFixed(1)) : null,
      humidity:      reh !== null ? Number(reh) : null,
      windSpeed:     wsd !== null ? parseFloat(Number(wsd).toFixed(1)) : null,
      ptyCode:       pty !== null ? Number(pty) : 0,
      ptyLabel:      getPtyLabel(pty ?? 0),
      precipitation: rn1,
      description:   getWeatherDescription(pty ?? 0, t1h ?? 15),
      baseDate:      base_date,
      baseTime:      base_time,
    });

  } catch (error) {
    console.error('[weather error]', error.message);
    console.error('[상세]', error.response?.status, JSON.stringify(error.response?.data));

    if (error.code === 'ECONNABORTED') {
      return NextResponse.json(
        { error: '기상청 API 응답 시간이 초과되었습니다.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: '날씨 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}