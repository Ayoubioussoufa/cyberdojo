import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { PathView } from "@/components/PathView";
import { buildPath } from "@/lib/path";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.pages.roadmapTitle };
}

export default async function Page({ params }: LangParams) {
  const { lang, t } = await strings(params);
  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="kicker">{t.nav.roadmap}</p>
        <h1>{t.pages.roadmapH1}</h1>
        <p className="lede">{t.pages.roadmapLede}</p>
        <p className="page-links"><Link href="/start/">{t.home.how}</Link><Link href="/guides/a2-how-to-use-this-plan/">{t.pages.runMonth}</Link><Link href="/certificates/">{t.cert.pageTitle}</Link></p>
      </header>
      <PathView path={buildPath(lang)} />
    </div>
  );
}
