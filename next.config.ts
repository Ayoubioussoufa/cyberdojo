import type { NextConfig } from "next";

/** The desktop app (scripts/desktop.ts) ships the site as a self-contained server, built apart from the website's. */
const desktop = process.env.NEXT_PUBLIC_CYBERDOJO_DESKTOP === "1";

// Pages are still pre-rendered at build time. The server exists for /api: accounts and saved progress.
const nextConfig: NextConfig = {
  ...(desktop ? { output: "standalone" as const, distDir: ".next-desktop" } : {}),
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: { root: __dirname },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
