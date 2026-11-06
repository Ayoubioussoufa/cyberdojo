import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { notFound } from "next/navigation";
import { Html } from "@/components/Html";
import { PrintButton } from "@/components/PrintButton";
import { getSheet, sheets } from "@/lib/content";

export const dynamicParams = false;
export const generateStaticParams = () => sheets().map((d) => ({ slug: d.meta.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${getSheet(slug)?.meta.title ?? "Sheet"} cheat sheet` };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const doc = getSheet(slug);
  if (!doc) notFound();
  return (
    <div className="page sheet">
      <header className="sheet-head">
        <div>
          <p className="kicker"><Link href="/sheets/">Cheat sheets</Link></p>
          <h1>{doc.meta.title}</h1>
          <p className="lede">{doc.meta.summary}</p>
        </div>
        <PrintButton />
      </header>
      <div className="sheet-body">
        {doc.segments.map((s, i) => (s.kind === "html" ? <Html key={i} html={s.html} /> : null))}
      </div>
      {doc.meta.source && (
        <p className="source sheet-source">
          <span>Source</span> <a href={doc.meta.source.url} target="_blank" rel="noreferrer">{doc.meta.source.label}</a>
        </p>
      )}
    </div>
  );
}
