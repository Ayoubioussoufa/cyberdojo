import type { Lang } from "@/i18n/lang";
import { UI } from "@/i18n/ui";

/** On the French site, above content that is still in English. Nothing on the English site. */
export function NotTranslated({ lang }: { lang: Lang }) {
  if (lang === "en") return null;
  return <p className="lang-note" role="note">{UI[lang].common.notTranslatedPart}</p>;
}
