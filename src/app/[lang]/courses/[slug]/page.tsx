import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stepAfter } from "@/lib/path";
import { DocView } from "@/components/DocView";
import { brief, deeperModules, getLesson, lessons, termsFor, tocWith, toolGuides, trainPanel } from "@/lib/content";
import { fill } from "@/i18n/lang";
import { strings, type LangParams } from "@/i18n/server";

export const dynamicParams = false;
export const generateStaticParams = () => lessons().map((d) => ({ slug: d.meta.slug }));

type Props = LangParams<{ slug: string }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { lang, t } = await strings(params);
  return { title: getLesson(slug, lang)?.meta.title ?? t.common.lesson };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const { lang, t } = await strings(params);
  const doc = getLesson(slug, lang);
  if (!doc) notFound();
  const all = lessons(lang);
  const i = all.findIndex((d) => d.meta.slug === slug);
  const near = (d?: (typeof all)[number]) => (d ? { slug: d.meta.slug, title: d.meta.title } : null);
  const m = doc.meta.month;
  return (
    <DocView
      meta={doc.meta}
      brief={brief(doc)}
      segments={[...trainPanel(doc, doc.meta.slug, lang), ...doc.segments, ...toolGuides(doc, lang), ...deeperModules(doc, lang)]}
      toc={tocWith(doc, doc.meta.slug, "start", lang)}
      terms={termsFor(doc, lang)}
      kicker={`${t.common.lesson} ${doc.meta.number}, ${m === 0 ? t.common.dayZero : fill(t.common.month, { n: m })}`}
      prev={near(all[i - 1])}
      next={near(all[i + 1])}
      base="/courses/"
      after={stepAfter(`/courses/${doc.meta.slug}/`, lang)}
    />
  );
}
