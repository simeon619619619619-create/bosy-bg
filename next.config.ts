import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
    ];
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/home.html',
      },
    ];
  },
};

export default nextConfig;
