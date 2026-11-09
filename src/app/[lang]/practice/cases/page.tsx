import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { Subnav } from "@/components/Subnav";
import { NotTranslated } from "@/components/NotTranslated";
import { CASES } from "@/lib/cases";
import { fill } from "@/i18n/lang";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.pages.casesTitle };
}

export default async function Page({ params }: LangParams) {
  const { lang, t } = await strings(params);
  return (
    <div className="page">
      <Subnav group="practice" />
      <header className="page-head">
        <p className="kicker">{t.pages.casesTitle}</p>
        <h1>{t.pages.casesH1}</h1>
        <p className="lede">{t.pages.casesLede}</p>
      </header>
      <NotTranslated lang={lang} />
      <div className="grid3">
        {[...CASES].sort((a, b) => a.month - b.month).map((c) => (
          <Link key={c.id} href={`/practice/cases/${c.id}/`} className="card link-card">
            <span className="phase-n">{fill(t.common.month, { n: c.month })}, {c.role}</span>
            <h3>{c.title}</h3>
            <p className="muted">{c.blurb}</p>
            <span className="meta">{fill(t.pages.aboutMinutes, { n: c.minutes })}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
