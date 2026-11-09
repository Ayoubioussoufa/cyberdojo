import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocView } from "@/components/DocView";
import { TOOL_CATS, catText } from "@/data/toolcats";
import { brief, getToolDoc, termsFor, tocWith, toolContext, toolDocs, trainPanel } from "@/lib/content";
import { strings, type LangParams } from "@/i18n/server";

export const dynamicParams = false;
export const generateStaticParams = () => toolDocs().map((d) => ({ slug: d.meta.slug }));

type Props = LangParams<{ slug: string }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { lang, t } = await strings(params);
  return { title: getToolDoc(slug, lang)?.meta.title ?? t.kind.Tool };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const { lang, t } = await strings(params);
  const doc = getToolDoc(slug, lang);
  if (!doc) notFound();
  const all = toolDocs(lang).filter((d) => d.meta.category === doc.meta.category);
  const i = all.findIndex((d) => d.meta.slug === slug);
  const near = (d?: (typeof all)[number]) => (d ? { slug: d.meta.slug, title: d.meta.title } : null);
  const cat = TOOL_CATS.find((c) => c.folder === doc.meta.category);
  return (
    <DocView
      meta={doc.meta}
      brief={brief(doc)}
      segments={[toolContext(doc, lang), ...trainPanel(doc, doc.meta.slug, lang), ...doc.segments]}
      toc={tocWith(doc, doc.meta.slug, "start", lang)}
      terms={termsFor(doc, lang)}
      kicker={`${t.pages.toolGuide} ${cat ? catText(cat, lang).title : ""}`}
      prev={near(all[i - 1])}
      next={near(all[i + 1])}
      base="/tools/"
    />
  );
}
