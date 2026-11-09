import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { Mistakes } from "@/components/Mistakes";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.pages.mistakesTitle };
}

export default async function Page({ params }: LangParams) {
  const { t } = await strings(params);
  return (
    <div className="page narrow">
      <p className="back"><Link href="/practice/">{t.pages.allPractice}</Link></p>
      <header className="page-head">
        <p className="kicker">{t.nav.practice}</p>
        <h1>{t.pages.mistakesH1}</h1>
        <p className="lede">{t.pages.mistakesLede}</p>
      </header>
      <Mistakes />
    </div>
  );
}
