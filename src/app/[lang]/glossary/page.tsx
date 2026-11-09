import type { Metadata } from "next";
import { Subnav } from "@/components/Subnav";
import { GlossaryList } from "@/components/GlossaryList";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.pages.glossaryTitle };
}

export default async function Page({ params }: LangParams) {
  const { t } = await strings(params);
  return (
    <div className="page narrow">
      <Subnav group="library" />
      <header className="page-head">
        <p className="kicker">{t.pages.glossaryTitle}</p>
        <h1>{t.pages.glossaryH1}</h1>
        <p className="lede">{t.pages.glossaryLede}</p>
      </header>
      <GlossaryList />
    </div>
  );
}
