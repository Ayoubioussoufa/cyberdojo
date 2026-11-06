import type { NextConfig } from "next";

// A static site: no server, so it can be hosted anywhere or opened from `out/`.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: { root: __dirname },
};

export default nextConfig;
