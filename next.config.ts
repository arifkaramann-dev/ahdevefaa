import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['127.0.0.1', '8328-iegnngv7m09inspz38cxs-9c971288.sg2.manus.computer'],
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), geolocation=()' }
    ] }, { source: '/api/:path*', headers: [
      { key: 'Cache-Control', value: 'private, no-store, max-age=0' }
    ] }];
  }
};
export default config;
