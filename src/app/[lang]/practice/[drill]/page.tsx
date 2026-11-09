import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { notFound } from "next/navigation";
import { LazyDrill, LazyRange } from "@/components/Lazy";
import { NotTranslated } from "@/components/NotTranslated";
import { DRILLS, DRILL_LIST } from "@/lib/drills";
import { RANGES } from "@/lib/missions";
import { strings, type LangParams } from "@/i18n/server";

export const dynamicParams = false;
export const generateStaticParams = () => [...DRILL_LIST.map((d) => d.id), ...Object.keys(RANGES)].map((drill) => ({ drill }));

type Props = LangParams<{ drill: string }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { drill } = await params;
  const { t } = await strings(params);
  return { title: DRILLS[drill]?.title ?? RANGES[drill]?.title ?? t.nav.practice };
}

export default async function Page({ params }: Props) {
  const { drill } = await params;
  const { lang, t } = await strings(params);
  if (!DRILLS[drill] && !RANGES[drill]) notFound();
  return (
    <div className="page narrow">
      <p className="back"><Link href="/practice/">{t.pages.allPractice}</Link></p>
      <header className="page-head" lang={lang === "fr" ? "en" : undefined}>
        <h1>{DRILLS[drill]?.title ?? RANGES[drill]?.title}</h1>
        {DRILLS[drill] && <p className="lede">{DRILLS[drill].blurb}</p>}
      </header>
      <NotTranslated lang={lang} />
      {DRILLS[drill] ? <LazyDrill id={drill} roundSize={12} bare /> : <LazyRange id={drill} bare />}
    </div>
  );
}
