import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stepAfter } from "@/lib/path";
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
  return (
    <DocView
      meta={doc.meta}
      brief={brief(doc)}
      segments={doc.segments}
      toc={doc.toc}
      terms={termsFor(doc)}
      kicker={`Handbook · ${doc.meta.group ?? "Guide"}`}
      prev={null}
      next={null}
      base="/guides/"
      after={stepAfter(`/guides/${doc.meta.slug}/`)}
    />
  );
}
