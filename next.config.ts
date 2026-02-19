import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // This ** means "allow everything"
      },
    ],
  },
};

export default nextConfig;