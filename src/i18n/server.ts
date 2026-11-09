/** Server-side helpers for pages: the language from the URL, and its strings. */
import { isLang, type Lang } from "./lang";
import { UI, type Dict } from "./ui";

export type LangParams<P = object> = { params: Promise<P & { lang: string }> };

/** The page's language. The root layout already 404s anything else, so "en" is only a type fallback. */
export async function langOf(params: Promise<{ lang: string }>): Promise<Lang> {
  const { lang } = await params;
  return isLang(lang) ? lang : "en";
}

export async function strings(params: Promise<{ lang: string }>): Promise<{ lang: Lang; t: Dict }> {
  const lang = await langOf(params);
  return { lang, t: UI[lang] };
}

/** generateStaticParams for a page under [lang] whose own params don't depend on the language. */
export { LANGS } from "./lang";
