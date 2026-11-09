/**
 * Language routing. "/fr/..." is the French site and passes through. Any other
 * page path is rewritten onto the "en" segment, so English addresses keep no
 * prefix. "/en/..." redirects to the address without it, so each page has one
 * English URL. Someone who picked French with the switch and opens an English
 * address in the browser is sent to the French page.
 */
import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE } from "@/i18n/lang";

/** A browser opening a page, not a client-side navigation, prefetch or JSON fetch. */
const opensPage = (req: NextRequest) =>
  req.method === "GET" && !req.headers.has("rsc") && !req.headers.has("next-router-prefetch") && (req.headers.get("accept") ?? "").includes("text/html");

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/fr" || pathname.startsWith("/fr/")) return NextResponse.next();
  const url = req.nextUrl.clone();
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (req.cookies.get(LANG_COOKIE)?.value === "fr" && opensPage(req)) {
    url.pathname = `/fr${pathname}`;
    return NextResponse.redirect(url, 307);
  }
  url.pathname = `/en${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api/|_next/|favicon\\.ico$|.*\\.(?:css|js|map|woff2?|png|jpe?g|gif|svg|ico|txt|webmanifest|xml)$).*)"],
};
