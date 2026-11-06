import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS } from "@/lib/data";

export const dynamicParams = false;
export const generateStaticParams = () => PROJECTS.map((p) => ({ id: p.id }));

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: id };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const p = PROJECTS.find((x) => x.id === id);
  if (!p) notFound();
  return (
    <div className="page narrow prose-page">
      <header className="page-head">
        <p className="kicker">{p.id} · {p.when}</p>
        <h1>{p.title}</h1>
        <p className="lede">{p.objective}</p>
      </header>
      {p.skills && <section><h2>Skills gained</h2><p>{p.skills}</p></section>}
      {p.tools && <section><h2>Tools</h2><p>{p.tools}</p></section>}
      {p.plan && <section><h2>Build plan</h2><ol>{p.plan.map((s) => <li key={s}>{s}</li>)}</ol></section>}
      {p.deliverables && <section><h2>Deliverables</h2><p>{p.deliverables}</p></section>}
      {p.presentation && <section><h2>How to present it</h2><p>{p.presentation}</p></section>}
      {p.pitch && <div className="callout job"><span className="label">Your interview pitch</span><p>{p.pitch}</p></div>}
      {p.bar && <div className="callout tip"><span className="label">Basic versus impressive</span><p>{p.bar}</p></div>}
      <p className="page-links"><Link href="/projects/">All projects</Link><Link href="/guides/h3-write-ups-and-reports/">How to write it up</Link></p>
    </div>
  );
}
