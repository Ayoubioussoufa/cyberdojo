/**
 * Where to go after signing in: only an address on this site, so a crafted link
 * can't send someone elsewhere (an open redirect). The value is parsed as the
 * browser will parse it: a pattern check is fooled by "/\t/evil.com", which
 * passes as a path but becomes "//evil.com" once the browser drops the tab.
 */
export function safeNext(search: string, origin: string): string {
  const next = new URLSearchParams(search).get("next");
  if (!next) return "/";
  try {
    const url = new URL(next, origin);
    return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}
