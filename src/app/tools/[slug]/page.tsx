import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocView } from "@/components/DocView";
import { TOOL_CATS } from "@/data/toolcats";
import { brief, getToolDoc, termsFor, tocWith, toolContext, toolDocs, trainPanel } from "@/lib/content";

export const dynamicParams = false;
export const generateStaticParams = () => toolDocs().map((d) => ({ slug: d.meta.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: getToolDoc(slug)?.meta.title ?? "Tool" };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const doc = getToolDoc(slug);
  if (!doc) notFound();
  const all = toolDocs().filter((d) => d.meta.category === doc.meta.category);
  const i = all.findIndex((d) => d.meta.slug === slug);
  const near = (d?: (typeof all)[number]) => (d ? { slug: d.meta.slug, title: d.meta.title } : null);
  const cat = TOOL_CATS.find((c) => c.folder === doc.meta.category);
  return (
    <DocView
      meta={doc.meta}
      brief={brief(doc)}
      segments={[toolContext(doc), ...trainPanel(doc), ...doc.segments]}
      toc={tocWith(doc)}
      terms={termsFor(doc)}
      kicker={`Tool guide: ${cat?.title ?? ""}`}
      prev={near(all[i - 1])}
      next={near(all[i + 1])}
      base="/tools/"
    />
  );
}
