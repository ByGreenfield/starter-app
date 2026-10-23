import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Pages read the database on every request (bookings change); classic dynamic rendering keeps
  // the template simple. Turn cacheComponents on when a page earns caching.
  cacheComponents: false,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
