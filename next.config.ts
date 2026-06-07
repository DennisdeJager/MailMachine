import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres"],
  async rewrites() {
    const apiBaseUrl = process.env.API_BASE_URL?.replace(/\/$/, "");

    if (!apiBaseUrl) {
      return [];
    }

    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${apiBaseUrl}/api/:path*`
        }
      ]
    };
  }
};

export default nextConfig;
