import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { Mix } from "@/components/Mix";
import { buildPath } from "@/lib/path";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.pages.mixTitle };
}

export default async function Page({ params }: LangParams) {
  const { lang, t } = await strings(params);
  return (
    <div className="page narrow">
      <p className="back"><Link href="/practice/">{t.pages.allPractice}</Link></p>
      <header className="page-head">
        <p className="kicker">{t.nav.practice}</p>
        <h1>{t.pages.mixTitle}</h1>
      </header>
      <section className="drill"><Mix path={buildPath(lang)} /></section>
    </div>
  );
}
