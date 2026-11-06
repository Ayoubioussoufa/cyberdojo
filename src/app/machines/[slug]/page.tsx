import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocView } from "@/components/DocView";
import { brief, getMachine, machines, termsFor } from "@/lib/content";

export const dynamicParams = false;
export const generateStaticParams = () => machines().map((d) => ({ slug: d.meta.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: getMachine(slug)?.meta.title ?? "Machine" };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const doc = getMachine(slug);
  if (!doc) notFound();
  const all = machines();
  const i = all.findIndex((d) => d.meta.slug === slug);
  const near = (d?: (typeof all)[number]) => (d ? { slug: d.meta.slug, title: d.meta.title } : null);
  return (
    <DocView
      meta={doc.meta}
      brief={brief(doc)}
      segments={doc.segments}
      toc={doc.toc}
      terms={termsFor(doc)}
      kicker={`Machine · ${doc.meta.level ?? "Practice"}`}
      prev={near(all[i - 1])}
      next={near(all[i + 1])}
      base="/machines/"
    />
  );
}
