import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { Flashcards } from "@/components/Flashcards";
import { Subnav } from "@/components/Subnav";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.subnav.flashcards };
}

export default async function Page({ params }: LangParams) {
  const { t } = await strings(params);
  return (
    <div className="page narrow">
      <Subnav group="practice" />
      <header className="page-head">
        <h1>{t.subnav.flashcards}</h1>
        <p className="lede">{t.pages.cardsLede}</p>
        <p className="meta">{t.pages.cardsWhy} <Link href="/guides/s2-memorising-what-must-be-instant/">{t.pages.cardsWhyLink}</Link>.</p>
      </header>
      <Flashcards />
    </div>
  );
}
