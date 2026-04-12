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
    ];
  },
};

export default nextConfig;
