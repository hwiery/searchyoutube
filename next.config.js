/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['i.ytimg.com', 'yt3.ggpht.com', 'yt3.googleusercontent.com'],
  },
  // 빌드 시 경고 무시
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 정적 내보내기 비활성화
  output: 'standalone',
  // 사전 렌더링 비활성화
  experimental: {
    missingSuspenseWithCSRBailout: false
  },
  // 정적 내보내기 비활성화
  reactStrictMode: false,
};

module.exports = nextConfig; 