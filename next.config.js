/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // Pexels 코디 이미지
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        // OpenWeatherMap 날씨 아이콘
        protocol: 'https',
        hostname: 'openweathermap.org',
      },
    ],
  },
};

module.exports = nextConfig;