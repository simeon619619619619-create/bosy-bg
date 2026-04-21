import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bosy.bg',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/en',
        destination: '/',
        permanent: true,
      },
      {
        source: '/home.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/contact',
        destination: '/contacts',
        permanent: true,
      },
      // /products/* → canonical routes
      {
        source: '/products',
        destination: '/shop',
        permanent: true,
      },
      {
        source: '/products/:slug((?!.*\\.).+)',
        destination: '/product/:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
