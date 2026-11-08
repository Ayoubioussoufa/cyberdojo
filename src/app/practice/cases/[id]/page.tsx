import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { notFound } from "next/navigation";
import { CaseFilePlayer } from "@/components/CaseFile";
import { CASES, CASE_MAP } from "@/lib/cases";

export const dynamicParams = false;
export const generateStaticParams = () => CASES.map((c) => ({ id: c.id }));

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: CASE_MAP[id]?.title ?? "Case" };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const c = CASE_MAP[id];
  if (!c) notFound();
  return (
    <div className="page narrow">
      <p className="back"><Link href="/practice/cases/">← All cases</Link></p>
      <header className="page-head">
        <p className="kicker">Case file: {c.role}</p>
        <h1>{c.title}</h1>
        <p className="lede">{c.blurb}</p>
      </header>
      <CaseFilePlayer id={id} />
      <p className="page-links case-links"><Link href={`/courses/${c.lesson}/`}>The lesson behind this case</Link></p>
    </div>
  );
}
