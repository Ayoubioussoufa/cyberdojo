import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stepAfter } from "@/lib/path";
import { DocView } from "@/components/DocView";
import { brief, getMachine, machines, termsFor, tocWith, trainPanel } from "@/lib/content";
import { strings, type LangParams } from "@/i18n/server";
import { levelName } from "@/i18n/ui";

export const dynamicParams = false;
export const generateStaticParams = () => machines().map((d) => ({ slug: d.meta.slug }));

type Props = LangParams<{ slug: string }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { lang, t } = await strings(params);
  return { title: getMachine(slug, lang)?.meta.title ?? t.subnav.machines };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const { lang, t } = await strings(params);
  const doc = getMachine(slug, lang);
  if (!doc) notFound();
  const all = machines(lang);
  const i = all.findIndex((d) => d.meta.slug === slug);
  const near = (d?: (typeof all)[number]) => (d ? { slug: d.meta.slug, title: d.meta.title } : null);
  return (
    <DocView
      meta={doc.meta}
      brief={brief(doc)}
      segments={[...doc.segments, ...trainPanel(doc, doc.meta.slug, lang)]}
      toc={tocWith(doc, doc.meta.slug, "end", lang)}
      terms={termsFor(doc, lang)}
      kicker={`${t.step.machine}, ${doc.meta.level ? levelName(lang, doc.meta.level) : t.nav.practice}`}
      prev={near(all[i - 1])}
      next={near(all[i + 1])}
      base="/machines/"
      after={stepAfter(`/machines/${doc.meta.slug}/`, lang)}
    />
  );
}
