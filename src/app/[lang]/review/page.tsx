import type { Metadata } from "next";
import { Subnav } from "@/components/Subnav";
import { Review } from "@/components/Review";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.pages.reviewTitle };
}

export default async function Page({ params }: LangParams) {
  const { t } = await strings(params);
  return (
    <div className="page narrow">
      <Subnav group="practice" />
      <header className="page-head">
        <p className="kicker">{t.pages.reviewKicker}</p>
        <h1>{t.pages.reviewH1}</h1>
        <p className="lede">{t.pages.reviewLede}</p>
      </header>
      <Review />
    </div>
  );
}
