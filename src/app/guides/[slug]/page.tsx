import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocView } from "@/components/DocView";
import { brief, getGuide, guides, termsFor } from "@/lib/content";

export const dynamicParams = false;
export const generateStaticParams = () => guides().map((d) => ({ slug: d.meta.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: getGuide(slug)?.meta.title ?? "Guide" };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const doc = getGuide(slug);
  if (!doc) notFound();
  const all = guides();
  const i = all.findIndex((d) => d.meta.slug === slug);
  const near = (d?: (typeof all)[number]) => (d ? { slug: d.meta.slug, title: d.meta.title } : null);
  return (
    <DocView
      meta={doc.meta}
      brief={brief(doc)}
      segments={doc.segments}
      toc={doc.toc}
      terms={termsFor(doc)}
      kicker={doc.meta.group ?? "Guide"}
      prev={near(all[i - 1])}
      next={near(all[i + 1])}
      base="/guides/"
    />
  );
}
