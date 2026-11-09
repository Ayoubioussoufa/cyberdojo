import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { Subnav } from "@/components/Subnav";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.nav.library };
}

export default async function Page({ params }: LangParams) {
  const { t } = await strings(params);
  const shelves = [
    { href: "/guides/", title: t.subnav.handbook, text: t.pages.shelfGuides },
    { href: "/tools/", title: t.nav.tools, text: t.pages.shelfTools },
    { href: "/sheets/", title: t.subnav.sheets, text: t.pages.shelfSheets },
    { href: "/glossary/", title: t.subnav.glossary, text: t.pages.shelfGlossary },
    { href: "/resources/", title: t.subnav.resources, text: t.pages.shelfResources },
  ];
  return (
    <div className="page">
      <Subnav group="library" />
      <header className="page-head">
        <p className="kicker">{t.nav.library}</p>
        <h1>{t.pages.libraryH1}</h1>
        <p className="lede">{t.pages.libraryLede}</p>
      </header>
      <div className="grid3">
        {shelves.map((s) => (
          <Link key={s.href} href={s.href} className="card link-card">
            <h3>{s.title}</h3>
            <p className="muted">{s.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
