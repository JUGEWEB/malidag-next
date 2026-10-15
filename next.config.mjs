/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false,

    formats: ["image/avif", "image/webp"],

    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.malidag.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.malidag.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
    ],

    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;