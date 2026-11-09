import type { Metadata } from "next";
import { Subnav } from "@/components/Subnav";
import Link from "@/components/HoverLink";
import { sheets } from "@/lib/content";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.subnav.sheets };
}

const ORDER = ["linux-commands", "ports", "subnetting", "windows-events", "sysmon-ids"];

export default async function Page({ params }: LangParams) {
  const { lang, t } = await strings(params);
  const docs = ORDER.flatMap((s) => sheets(lang).filter((d) => d.meta.slug === s));
  return (
    <div className="page">
      <Subnav group="library" />
      <header className="page-head">
        <p className="kicker">{t.subnav.sheets}</p>
        <h1>{t.pages.sheetsH1}</h1>
        <p className="lede">{t.pages.sheetsLede}</p>
      </header>
      <div className="grid3">
        {docs.map((d) => (
          <Link key={d.meta.slug} href={`/sheets/${d.meta.slug}/`} className="card link-card">
            <span className="phase-n">{t.pages.printable}</span>
            <h3>{d.meta.title}</h3>
            <p className="muted">{d.meta.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
