import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { notFound } from "next/navigation";
import { Html } from "@/components/Html";
import { PrintButton } from "@/components/PrintButton";
import { getSheet, sheets } from "@/lib/content";
import { fill } from "@/i18n/lang";
import { strings, type LangParams } from "@/i18n/server";

export const dynamicParams = false;
export const generateStaticParams = () => sheets().map((d) => ({ slug: d.meta.slug }));

type Props = LangParams<{ slug: string }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { lang, t } = await strings(params);
  return { title: fill(t.pages.sheetTitle, { title: getSheet(slug, lang)?.meta.title ?? "" }) };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const { lang, t } = await strings(params);
  const doc = getSheet(slug, lang);
  if (!doc) notFound();
  const english = doc.meta.lang && doc.meta.lang !== lang;
  return (
    <div className="page sheet">
      <header className="sheet-head">
        <div>
          <p className="kicker"><Link href="/sheets/">{t.subnav.sheets}</Link></p>
          <h1 lang={english ? "en" : undefined}>{doc.meta.title}</h1>
          <p className="lede" lang={english ? "en" : undefined}>{doc.meta.summary}</p>
        </div>
        <PrintButton />
      </header>
      {english && <p className="lang-note" role="note">{t.common.notTranslated}</p>}
      <div className="sheet-body" lang={english ? "en" : undefined}>
        {doc.segments.map((s, i) => (s.kind === "html" ? <Html key={i} html={s.html} /> : null))}
      </div>
      {doc.meta.source && (
        <p className="source sheet-source">
          <span>{t.pages.source}</span> <a href={doc.meta.source.url} target="_blank" rel="noreferrer">{doc.meta.source.label}</a>
        </p>
      )}
    </div>
  );
}
