import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stepAfter } from "@/lib/path";
import { DocView } from "@/components/DocView";
import { brief, getGuide, guides, termsFor } from "@/lib/content";
import { strings, type LangParams } from "@/i18n/server";
import { groupName } from "@/i18n/ui";

export const dynamicParams = false;
export const generateStaticParams = () => guides().map((d) => ({ slug: d.meta.slug }));

type Props = LangParams<{ slug: string }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { lang, t } = await strings(params);
  return { title: getGuide(slug, lang)?.meta.title ?? t.subnav.handbook };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const { lang, t } = await strings(params);
  const doc = getGuide(slug, lang);
  if (!doc) notFound();
  return (
    <DocView
      meta={doc.meta}
      brief={brief(doc)}
      segments={doc.segments}
      toc={doc.toc}
      terms={termsFor(doc, lang)}
      kicker={`${t.subnav.handbook}: ${groupName(lang, doc.meta.group ?? "Guides")}`}
      prev={null}
      next={null}
      base="/guides/"
      after={stepAfter(`/guides/${doc.meta.slug}/`, lang)}
    />
  );
}
