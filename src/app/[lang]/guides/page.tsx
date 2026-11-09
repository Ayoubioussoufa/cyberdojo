import type { Metadata } from "next";
import { Subnav } from "@/components/Subnav";
import Link from "@/components/HoverLink";
import { DocRows } from "@/components/Lists";
import { guideMetas } from "@/lib/content";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.subnav.handbook };
}

export default async function Page({ params }: LangParams) {
  const { lang, t } = await strings(params);
  const metas = guideMetas(lang);
  const groups = [...new Set(metas.map((m) => m.group ?? "Guides"))];
  return (
    <div className="page narrow">
      <Subnav group="library" />
      <header className="page-head">
        <p className="kicker">{t.subnav.handbook}</p>
        <h1>{t.pages.guidesH1}</h1>
        <p className="lede">{t.pages.guidesLede} <Link href="/roadmap/">{t.nav.roadmap}</Link> {t.pages.guidesLede2}</p>
      </header>
      {groups.map((g) => (
        <section key={g} className="phase-block">
          <h2 className="phase-h">{g}</h2>
          <DocRows docs={metas.filter((m) => (m.group ?? "Guides") === g)} base="/guides/" />
        </section>
      ))}
    </div>
  );
}
