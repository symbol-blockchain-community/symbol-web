const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [],
  publicExcludes: ['!**/*'],
  buildExcludes: [() => true],
  fallbacks: false,
  cacheStartUrl: false,
});

const nextConfig = withPWA({
  i18n: {
    locales: ['en', 'ja', 'ko', 'zh', 'zh-hant-tw'],
    defaultLocale: 'en',
    localeDetection: false,
  },
  images: {
    domains: ['cms.symbol-community.com'],
  },
  compiler: {
    emotion: true,
  },
  reactStrictMode: true,
});

module.exports = nextConfig;
