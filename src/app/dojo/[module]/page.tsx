import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { notFound } from "next/navigation";
import { LazyRange } from "@/components/Lazy";
import { ModuleBelt } from "@/components/DojoHub";
import { DOJO } from "@/data/dojo";
import { RANGES } from "@/lib/missions";

export const dynamicParams = false;
export const generateStaticParams = () => DOJO.map((m) => ({ module: m.id }));

type Props = { params: Promise<{ module: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { module } = await params;
  return { title: DOJO.find((m) => m.id === module)?.title ?? "Dojo" };
}

const code = (s: string) => s.split(/(`[^`]+`)/).map((p, i) => (p.startsWith("`") ? <code key={i}>{p.slice(1, -1)}</code> : p));

export default async function Page({ params }: Props) {
  const { module } = await params;
  const at = DOJO.findIndex((m) => m.id === module);
  const m = DOJO[at];
  if (!m) notFound();
  const ids = (RANGES[m.range]?.missions ?? []).map((x) => x.id);
  const next = DOJO[at + 1];
  return (
    <div className="page narrow dojo-module">
      <p className="back"><Link href="/dojo/">All modules</Link></p>
      <header className="page-head">
        <h1>{m.title}</h1>
        <ModuleBelt belt={m.belt} ids={ids} />
      </header>
      <div className="prose dojo-intro">
        {m.intro.map((p, i) => <p key={i}>{code(p)}</p>)}
      </div>
      <ul className="dojo-tools" aria-label="What you'll use">
        {m.tools.map((t) => <li key={t}><code>{t}</code></li>)}
      </ul>
      <LazyRange id={m.range} />
      <footer className="dojo-foot">
        {m.lesson && <p>Want the full explanation? Read <Link href={m.lesson.href}>{m.lesson.title}</Link>.</p>}
        <p className="muted">{m.credit.note} <a href={m.credit.href} target="_blank" rel="noreferrer">Try the original on pwn.college</a>.</p>
        {next && <Link className="btn" href={`/dojo/${next.id}/`}>Next module: {next.title}</Link>}
      </footer>
    </div>
  );
}
