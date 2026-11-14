import type { NextConfig } from "next";

/** The desktop app (scripts/desktop.ts) ships the site as a self-contained server, built apart from the website's. */
const desktop = process.env.NEXT_PUBLIC_CYBERDOJO_DESKTOP === "1";

/**
 * What a page may load. Everything comes from the site itself: fonts are bundled, and outside
 * addresses are only ever links. Next.js writes its bootstrap as inline scripts on pre-rendered
 * pages, where a per-request nonce isn't possible, so inline scripts stay allowed; the policy
 * still stops scripts, styles and data from other origins, plugins, framing, form posts
 * elsewhere and <base> rewrites. Production only: the dev server's live reload needs eval.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");
const production = process.env.NODE_ENV === "production";

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
          ...(production ? [{ key: "Content-Security-Policy", value: CSP }] : []),
        ],
      },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
