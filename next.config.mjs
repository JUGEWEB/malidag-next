/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // 🚀 Skip Next.js optimizer, serve images directly
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.malidag.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
        pathname: "/coins/images/**",
      },
    ],
  },
};

export default nextConfig;
