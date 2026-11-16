/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {},
  async rewrites() {
    return [
      {
        source: "/docs",
        destination: "/docs",
      },
    ];
  },
};

export default nextConfig;
