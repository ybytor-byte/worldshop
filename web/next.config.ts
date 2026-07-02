import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: "https://worldshopbackend-production.up.railway.app",
  },
};

export default nextConfig;
