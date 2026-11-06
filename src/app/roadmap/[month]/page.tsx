import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { notFound } from "next/navigation";
import { DocRows } from "@/components/Lists";
import { Gates } from "@/components/Roadmap";
import { lessonMetas } from "@/lib/content";
import { MONTHS, PROJECTS, PHASES, type Res } from "@/lib/data";

export const dynamicParams = false;
export const generateStaticParams = () => MONTHS.map((m) => ({ month: String(m.n) }));

type Props = { params: Promise<{ month: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { month } = await params;
  return { title: `Month ${month}` };
}

const List = ({ items }: { items?: string[] }) => (items?.length ? <ul>{items.map((t) => <li key={t}>{t}</li>)}</ul> : null);

function Resources({ items }: { items?: Res[] }) {
  if (!items?.length) return null;
  return (
    <ul>
      {items.map((r) => (
        <li key={r.text}>{r.url ? <a href={r.url} target="_blank" rel="noreferrer">{r.text}</a> : r.text}</li>
      ))}
    </ul>
  );
}

const WEEK = /^W(\d)\s+(.*)$/;

export default async function Page({ params }: Props) {
  const { month } = await params;
  const n = Number(month);
  const m = MONTHS[n - 1];
  if (!m) notFound();
  const phase = PHASES[m.phase];
  const here = lessonMetas().filter((l) => l.month === n);
  const prev = MONTHS[n - 2];
  const next = MONTHS[n];
  const projects = PROJECTS.filter((p) => m.portfolio?.includes(p.id));
  return (
    <div className="page narrow prose-page">
      <header className="page-head">
        <p className="kicker">Month {n} · {phase?.title}</p>
        <h1>{m.title}</h1>
        <p className="lede">{m.goal}</p>
        <p className="meta">{m.hours}</p>
        <p className="page-links"><Link href="/roadmap/">Back to my roadmap</Link></p>
      </header>

      {here.length > 0 && (
        <section className="phase-block">
          <h2 className="phase-h">Lessons this month</h2>
          <DocRows docs={here} base="/courses/" />
        </section>
      )}

      <div id="gate"><Gates month={m} /></div>

      {m.weeks && (
        <section>
          <h2>Week by week</h2>
          <ol className="weeks">
            {m.weeks.map((w) => {
              const hit = WEEK.exec(w);
              return <li key={w}><span>Week {hit?.[1] ?? ""}</span><p>{hit?.[2] ?? w}</p></li>;
            })}
          </ol>
        </section>
      )}
      {m.topics && <section><h2>{m.trackSprint ? "Common core" : "Topics and concepts"}</h2><List items={m.topics} /></section>}
      {m.trackSprint && <section><h2>Track sprint</h2><List items={m.trackSprint} /></section>}
      {m.skills && <section><h2>Practical skills</h2><List items={m.skills} /></section>}
      {m.labs && <section><h2>Hands-on labs</h2><Resources items={m.labs} /></section>}
      {m.tools && <section><h2>Tools</h2><p>{m.tools}</p></section>}
      {m.free && <section><h2>Free resources</h2><Resources items={m.free} /></section>}
      {m.paid && <section><h2>Paid, optional</h2><Resources items={m.paid} /></section>}
      {m.ai && <section><h2>AI practice</h2><p>{m.ai}</p></section>}
      {m.portfolio && (
        <section>
          <h2>Portfolio output</h2>
          <p>{m.portfolio}</p>
          {projects.length > 0 && <p className="page-links">{projects.map((p) => <Link key={p.id} href={`/projects/${p.id}/`}>{p.id}: {p.title}</Link>)}</p>}
        </section>
      )}
      {m.career && <section><h2>Career actions</h2><List items={m.career} /></section>}
      {m.jobs && <section><h2>How this maps to real jobs</h2><p>{m.jobs}</p></section>}
      {m.note && <div className="callout key"><span className="label">{m.note.title}</span><p>{m.note.text}</p></div>}

      <nav className="pager" aria-label="Months">
        {prev ? <Link href={`/roadmap/${prev.n}/`}><span>Month {prev.n}</span>{prev.title}</Link> : <span />}
        {next ? <Link href={`/roadmap/${next.n}/`} className="to-next"><span>Month {next.n}</span>{next.title}</Link> : <span />}
      </nav>
    </div>
  );
}
