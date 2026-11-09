import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { notFound } from "next/navigation";
import { CaseFilePlayer } from "@/components/CaseFile";
import { NotTranslated } from "@/components/NotTranslated";
import { CASES, CASE_MAP } from "@/lib/cases";
import { Html } from "@/components/Html";
import { trainHtml } from "@/lib/content";
import { strings, type LangParams } from "@/i18n/server";

export const dynamicParams = false;
export const generateStaticParams = () => CASES.map((c) => ({ id: c.id }));

type Props = LangParams<{ id: string }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { t } = await strings(params);
  return { title: CASE_MAP[id]?.title ?? t.pages.casesTitle };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const { lang, t } = await strings(params);
  const c = CASE_MAP[id];
  if (!c) notFound();
  const train = trainHtml(`case:${id}`, undefined, lang);
  return (
    <div className="page narrow">
      <p className="back"><Link href="/practice/cases/">{t.pages.allCases}</Link></p>
      <header className="page-head">
        <p className="kicker">{t.pages.caseFile} {c.role}</p>
        <h1>{c.title}</h1>
        <p className="lede">{c.blurb}</p>
      </header>
      <NotTranslated lang={lang} />
      <CaseFilePlayer id={id} />
      {train && <Html html={train} />}
      <p className="page-links case-links"><Link href={`/courses/${c.lesson}/`}>{t.pages.caseLesson}</Link></p>
    </div>
  );
}
