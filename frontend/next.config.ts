import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy /api/* to Django in development.
  // In production, set INTERNAL_API_URL to the real backend URL.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.INTERNAL_API_URL ?? "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
