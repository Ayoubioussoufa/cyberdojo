import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocView } from "@/components/DocView";
import { DOMAINS } from "@/data/domains";
import { brief, getModule, moduleContext, modules, termsFor, tocWith, toolGuides, trainPanel } from "@/lib/content";

export const dynamicParams = false;
export const generateStaticParams = () => modules().map((d) => ({ slug: d.meta.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: getModule(slug)?.meta.title ?? "Module" };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const doc = getModule(slug);
  if (!doc) notFound();
  const all = modules().filter((d) => d.meta.domain === doc.meta.domain);
  const i = all.findIndex((d) => d.meta.slug === slug);
  const near = (d?: (typeof all)[number]) => (d ? { slug: d.meta.slug, title: d.meta.title } : null);
  const domain = DOMAINS.find((d) => d.id === doc.meta.domain);
  return (
    <DocView
      meta={doc.meta}
      brief={brief(doc)}
      segments={[moduleContext(doc), ...trainPanel(doc), ...doc.segments, ...toolGuides(doc)]}
      toc={tocWith(doc)}
      terms={termsFor(doc)}
      kicker={`${domain?.title ?? "Module"}, ${doc.meta.level ?? ""} level`}
      prev={near(all[i - 1])}
      next={near(all[i + 1])}
      base="/modules/"
    />
  );
}
