import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  rewrites() {
    return [
      { source: "/api/:path*", destination: `${process.env.API_URL}/:path*` },
    ];
  },
};

export default nextConfig;
