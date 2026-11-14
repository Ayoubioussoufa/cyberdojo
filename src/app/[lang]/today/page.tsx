import type { Metadata } from "next";
import { Today } from "@/components/Today";
import { buildPath } from "@/lib/path";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.today.pageTitle };
}

export default async function Page({ params }: LangParams) {
  const { lang, t } = await strings(params);
  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="kicker">{t.today.kicker}</p>
        <h1>{t.today.pageTitle}</h1>
        <p className="lede">{t.today.lede}</p>
      </header>
      <Today path={buildPath(lang)} />
    </div>
  );
}
