import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_GATEWAY_INTERNAL_URL || "http://localhost:3000"}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/shop",
        destination: process.env.NEXT_PUBLIC_SHOP_URL || "https://shop.oriyoninternational.com",
        permanent: false,
      },
      {
        source: "/store",
        destination: process.env.NEXT_PUBLIC_SHOP_URL || "https://shop.oriyoninternational.com",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
