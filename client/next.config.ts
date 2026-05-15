import type { NextConfig } from 'next';

const backendProxyTarget = process.env.BACKEND_PROXY_TARGET?.replace(/\/$/, '');

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    if (!backendProxyTarget) {
      return [];
    }
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendProxyTarget}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
