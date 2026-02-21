import Image from 'next/image';

const PTY_EMOJI = { 0: '☀️', 1: '🌧️', 2: '🌨️', 3: '❄️', 5: '🌦️', 6: '🌧️', 7: '🌨️' };

const WeatherCard = ({ weatherData, outfit, images }) => {
  if (!weatherData || !outfit) return null;

  const safeImages = Array.isArray(images) ? images : [];
  const temp       = Number(weatherData.temp);
  const ptyEmoji   = PTY_EMOJI[weatherData.ptyCode ?? 0] ?? '🌤️';

  const baseTimeLabel = weatherData.baseTime
    ? `${weatherData.baseTime.slice(0, 2)}:${weatherData.baseTime.slice(2)} 기준`
    : '';

  return (
    <div className="weatherContent relative z-2 w-full max-w-2xl bg-white rounded-[2.5rem] py-8 px-4 sm:px-8 mt-8 shadow-2xl border border-gray-100 animate-fade-in">

	   	{/* 날씨 정보 헤더 */}
		<div className="flex justify-between items-start mb-6 flex-col justify-start sm:flex-row justify-center">
			<div className='w-full sm:w-auto'>
			<h2 className="w-full sm:w-auto text-center sm:text-left text-2xl font-bold text-gray-800">
				{weatherData.cityName ?? '알 수 없는 지역'}
			</h2>

			<div className="flex items-start justify-center sm:justify-start gap-1.5 mt-4 sm:mt-2">
				<span className="text-2xl">{ptyEmoji}</span>
				<p className="flex sm:block text-gray-600 text-base font-semibold gap-1.5">
				{weatherData.description}
				{baseTimeLabel && (
					<span className="block text-gray-400 text-sm mt-1 font-normal">(기상청 실황 {baseTimeLabel})</span>
				)}
				</p>
			</div>
		</div>

        {/* 기온 */}
        <div className="w-full sm:w-auto text-center sm:text-right mt-4 sm:mt-0">
          <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400 handwriting">
            {isNaN(temp) ? '-' : temp}&#8451;
          </span>
        </div>
      </div>

      {/* 상세 날씨 정보 (습도, 풍속, 강수형태) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 flex-col justify-start sm:flex-row justify-center">
        <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
          <p className="text-sm text-slate-500 mb-1">습도</p>
          <p className="text-lg font-bold text-slate-700">
            {weatherData.humidity !== null && weatherData.humidity !== undefined
              ? `${weatherData.humidity}%`
              : '-'}
          </p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
          <p className="text-sm text-slate-500 mb-1">풍속</p>
          <p className="text-lg font-bold text-slate-700">
            {weatherData.windSpeed !== null && weatherData.windSpeed !== undefined
              ? `${weatherData.windSpeed}m/s`
              : '-'}
          </p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
          <p className="text-sm text-slate-500 mb-1">강수형태</p>
          <p className="text-lg font-bold text-slate-700">
            {weatherData.ptyLabel ?? '-'}
          </p>
        </div>
      </div>

      {/* 코디 가이드 */}
      <div className="bg-blue-50 rounded-2xl p-6 mb-8 border border-blue-100">
        <h3 className="text-blue-800 font-bold mb-2 flex items-center gap-2 justify-center sm:justify-start">
        👗 현재 날씨 코디 가이드
        </h3>
        <p className="text-blue-900 text-lg font-medium justify-center sm:justify-start">
          {outfit.desc ?? '추천 코디 정보를 불러오는 중입니다.'}
        </p>
      </div>

      {/* 이미지 갤러리 */}
      <div>
        {safeImages.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] rounded-2xl bg-gray-50 border border-dashed border-gray-200">
            <p className="text-gray-400 text-base">추천 이미지를 준비 중입니다.</p>
          </div>
        ) : (
          <>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
              {safeImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative min-w-[200px] h-[300px] rounded-2xl overflow-hidden snap-center shadow-md flex-shrink-0 bg-gray-100"
                >
                  <Image
                    src={img}
                    alt={`${weatherData.cityName ?? ''} 날씨별 추천 코디 ${idx + 1}`}
                    fill
                    priority={idx === 0}
                    className="object-cover hover:scale-110 transition-transform duration-500"
                    sizes="200px"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-2 text-center">← 가로로 밀어서 더보기 →</p>
          </>
        )}
      </div>
    </div>
  );
};

export default WeatherCard;