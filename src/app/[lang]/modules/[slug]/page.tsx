import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocView } from "@/components/DocView";
import { DOMAINS, domainText } from "@/data/domains";
import { brief, getModule, moduleContext, modules, termsFor, tocWith, toolGuides, trainPanel } from "@/lib/content";
import { fill } from "@/i18n/lang";
import { strings, type LangParams } from "@/i18n/server";
import { levelName } from "@/i18n/ui";

export const dynamicParams = false;
export const generateStaticParams = () => modules().map((d) => ({ slug: d.meta.slug }));

type Props = LangParams<{ slug: string }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { lang, t } = await strings(params);
  return { title: getModule(slug, lang)?.meta.title ?? t.nav.modules };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const { lang, t } = await strings(params);
  const doc = getModule(slug, lang);
  if (!doc) notFound();
  const all = modules(lang).filter((d) => d.meta.domain === doc.meta.domain);
  const i = all.findIndex((d) => d.meta.slug === slug);
  const near = (d?: (typeof all)[number]) => (d ? { slug: d.meta.slug, title: d.meta.title } : null);
  const domain = DOMAINS.find((d) => d.id === doc.meta.domain);
  return (
    <DocView
      meta={doc.meta}
      brief={brief(doc)}
      segments={[moduleContext(doc, lang), ...trainPanel(doc, doc.meta.slug, lang), ...doc.segments, ...toolGuides(doc, lang)]}
      toc={tocWith(doc, doc.meta.slug, "start", lang)}
      terms={termsFor(doc, lang)}
      kicker={`${domain ? domainText(domain, lang).title : t.nav.modules}, ${fill(t.pages.levelOf, { level: levelName(lang, doc.meta.level ?? "") })}`}
      prev={near(all[i - 1])}
      next={near(all[i + 1])}
      base="/modules/"
    />
  );
}
