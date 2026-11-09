import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stepAfter } from "@/lib/path";
import { DocView } from "@/components/DocView";
import { brief, deeperModules, getLesson, lessons, termsFor, tocWith, toolGuides, trainPanel } from "@/lib/content";

export const dynamicParams = false;
export const generateStaticParams = () => lessons().map((d) => ({ slug: d.meta.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: getLesson(slug)?.meta.title ?? "Lesson" };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const doc = getLesson(slug);
  if (!doc) notFound();
  const all = lessons();
  const i = all.findIndex((d) => d.meta.slug === slug);
  const near = (d?: (typeof all)[number]) => (d ? { slug: d.meta.slug, title: d.meta.title } : null);
  const m = doc.meta.month;
  return (
    <DocView
      meta={doc.meta}
      brief={brief(doc)}
      segments={[...trainPanel(doc), ...doc.segments, ...toolGuides(doc), ...deeperModules(doc)]}
      toc={tocWith(doc)}
      terms={termsFor(doc)}
      kicker={`Lesson ${doc.meta.number}, ${m === 0 ? "Day zero" : `Month ${m}`}`}
      prev={near(all[i - 1])}
      next={near(all[i + 1])}
      base="/courses/"
      after={stepAfter(`/courses/${doc.meta.slug}/`)}
    />
  );
}
