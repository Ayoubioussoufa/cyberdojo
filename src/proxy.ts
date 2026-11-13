/**
 * The front door, for every page request.
 *
 * Sign-in: the content is for members. Anyone without a live session is sent
 * to the sign-in page, which is the only page open to all. The session is
 * checked against the database, not just for a cookie being present.
 *
 * The desktop app has no sign-in: it lets its own window in and nobody else.
 * See src/server/desktop.ts.
 *
 * Language: "/fr/..." is the French site and passes through. Any other page
 * path is rewritten onto the "en" segment, so English addresses keep no
 * prefix. "/en/..." redirects to the address without it, so each page has one
 * English URL. Someone who picked French with the switch and opens an English
 * address in the browser is sent to the French page.
 */
import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE } from "@/i18n/lang";
import { DESKTOP } from "@/lib/desktop";
import { get } from "@/server/db";
import { DESKTOP_COOKIE, fromAppWindow } from "@/server/desktop";

/** A browser opening a page, not a client-side navigation, prefetch or JSON fetch. */
const opensPage = (req: NextRequest) =>
  req.method === "GET" && !req.headers.has("rsc") && !req.headers.has("next-router-prefetch") && (req.headers.get("accept") ?? "").includes("text/html");

/** Pages anyone can open on the website: signing in, and getting the desktop app. */
const OPEN = /^\/(signin|download)(\/|$)/;
const REMEMBER_MS = 60_000;

/** Sessions seen as valid in the last minute, so moving between pages doesn't ask the database each time. */
const slot = globalThis as { __cyberdojoSeen?: Map<string, number> };
const seen = () => (slot.__cyberdojoSeen ??= new Map());

async function signedIn(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("__Host-cyberdojo")?.value ?? req.cookies.get("cyberdojo")?.value;
  if (!token || token.length > 200) return false;
  const hash = createHash("sha256").update(token).digest("hex");
  const now = Date.now();
  const cache = seen();
  if ((cache.get(hash) ?? 0) > now) return true;
  try {
    const row = await get("SELECT 1 FROM sessions WHERE token_hash = ? AND expires_at > ?", hash, now);
    if (!row) return false;
  } catch (e) {
    // The database can't be reached: nobody gets in, and the sign-in page will say so.
    console.error("gate:", e);
    return false;
  }
  if (cache.size > 5_000) cache.clear();
  cache.set(hash, now + REMEMBER_MS);
  return true;
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const url = req.nextUrl.clone();
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  const french = pathname === "/fr" || pathname.startsWith("/fr/");
  const bare = french ? pathname.slice(3) || "/" : pathname;
  const wantsFrench = french || req.cookies.get(LANG_COOKIE)?.value === "fr";

  if (DESKTOP) {
    // One local profile: the app's own window is let in, and there is nothing to sign in to.
    if (!fromAppWindow(req.cookies.get(DESKTOP_COOKIE)?.value)) return new NextResponse("CyberDojo only answers its own window.", { status: 403 });
    // Inside the app there's nothing to sign in to and nothing to download.
    if (OPEN.test(bare)) {
      url.pathname = wantsFrench ? "/fr/" : "/";
      url.search = "";
      return NextResponse.redirect(url, 307);
    }
  } else if (!OPEN.test(bare) && !(await signedIn(req))) {
    url.pathname = `${wantsFrench ? "/fr" : ""}/signin/`;
    url.search = bare === "/" ? "" : `?next=${encodeURIComponent(bare + search)}`;
    const res = NextResponse.redirect(url, 307);
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  if (french) return NextResponse.next();
  if (wantsFrench && opensPage(req)) {
    url.pathname = `/fr${pathname}`;
    return NextResponse.redirect(url, 307);
  }
  url.pathname = `/en${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api/|_next/|favicon\\.ico$|.*\\.(?:css|js|map|woff2?|png|jpe?g|gif|svg|ico|txt|webmanifest|xml)$).*)"],
};
