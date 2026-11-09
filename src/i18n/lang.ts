/**
 * The site's two languages. English pages live at the root ("/courses/x/") and
 * French ones under "/fr/" ("/fr/courses/x/"). The proxy (src/proxy.ts) maps the
 * root onto the "en" segment, so every page exists once per language and is
 * still pre-rendered at build time. No DOM and no Node APIs: shared everywhere.
 */
export const LANGS = ["en", "fr"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";

export const isLang = (s: unknown): s is Lang => typeof s === "string" && (LANGS as readonly string[]).includes(s);

/** Remembers the language picked with the switch, so an English address opens in French. */
export const LANG_COOKIE = "lang";

/** Never prefixed: the API, Next's own files, and the root of another site. */
const SHARED = /^\/(api|_next)(\/|$|\?)/;
const FRENCH = /^\/fr(?=\/|$|[?#])/;
/** Only seen inside the server: the proxy rewrites "/x/" to "/en/x/", so a pre-rendered English page renders with that path. */
const ENGLISH = /^\/en(?=\/|$|[?#])/;

/** A site path as the given language's page: "/courses/x/" becomes "/fr/courses/x/" in French. */
export function localize(href: string, lang: Lang): string {
  if (lang === DEFAULT_LANG || !href.startsWith("/") || href.startsWith("//") || SHARED.test(href) || FRENCH.test(href)) return href;
  return `/fr${href}`;
}

/**
 * The language a path belongs to, and the path without its prefix. "/en/x/" counts
 * as "/x/", so a pre-rendered English page and the browser agree on where it is.
 */
export function splitLang(pathname: string): { lang: Lang; path: string } {
  const fr = FRENCH.test(pathname);
  if (!fr && !ENGLISH.test(pathname)) return { lang: DEFAULT_LANG, path: pathname };
  const rest = pathname.slice(3);
  return { lang: fr ? "fr" : "en", path: rest === "" || rest.startsWith("?") || rest.startsWith("#") ? `/${rest}` : rest };
}

/** The same page in another language. */
export const switchTo = (pathname: string, lang: Lang) => localize(splitLang(pathname).path, lang);

/** Course HTML is written with English links; on the French site each internal one gains the prefix. */
export const localizeHtml = (html: string, lang: Lang) =>
  lang === DEFAULT_LANG ? html : html.replace(/(<a\b[^>]*?\shref=")(\/[^"]*)"/g, (_, open: string, href: string) => `${open}${localize(href, lang)}"`);

/** Fills "{name}" slots in a message. */
export const fill = (msg: string, vars: Record<string, string | number> = {}) => msg.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all));
