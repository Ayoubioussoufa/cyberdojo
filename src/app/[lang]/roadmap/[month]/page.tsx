import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { notFound } from "next/navigation";
import { DocRows } from "@/components/Lists";
import { Gates } from "@/components/Roadmap";
import { lessonMetas } from "@/lib/content";
import { MONTHS, PROJECTS, type Res } from "@/lib/data";
import { NotTranslated } from "@/components/NotTranslated";
import { monthTranslated, monthsFor, phasesFor } from "@/data/fr/months";
import { fill } from "@/i18n/lang";
import { strings, type LangParams } from "@/i18n/server";

export const dynamicParams = false;
export const generateStaticParams = () => MONTHS.map((m) => ({ month: String(m.n) }));

type Props = LangParams<{ month: string }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { month } = await params;
  const { t } = await strings(params);
  return { title: fill(t.common.month, { n: month }) };
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

/** "W1 …" in English, "S1 …" (semaine) in French. */
const WEEK = /^[WS](\d)\s+(.*)$/;

export default async function Page({ params }: Props) {
  const { month } = await params;
  const { lang, t } = await strings(params);
  const M = t.month;
  const n = Number(month);
  const all = monthsFor(lang);
  const m = all[n - 1];
  if (!m) notFound();
  const english = lang !== "en" && !monthTranslated(n);
  const phase = phasesFor(lang)[m.phase];
  const here = lessonMetas(lang).filter((l) => l.month === n);
  const prev = all[n - 2];
  const next = all[n];
  const projects = PROJECTS.filter((p) => m.portfolio?.includes(p.id));
  return (
    <div className="page narrow prose-page">
      <header className="page-head">
        <p className="kicker">{fill(t.lessons.monthHead, { n, title: phase?.title ?? "" })}</p>
        <h1>{m.title}</h1>
        <p className="lede" lang={english ? "en" : undefined}>{m.goal}</p>
        <p className="meta" lang={english ? "en" : undefined}>{m.hours}</p>
        <p className="page-links"><Link href="/roadmap/">{M.back}</Link></p>
      </header>
      {english && <p className="lang-note" role="note">{t.month.notTranslated}</p>}

      {here.length > 0 && (
        <section className="phase-block">
          <h2 className="phase-h">{M.lessons}</h2>
          <DocRows docs={here} base="/courses/" />
        </section>
      )}

      <div id="gate" lang={english ? "en" : undefined}><Gates month={m} /></div>
      <div lang={english ? "en" : undefined}>

      {m.weeks && (
        <section>
          <h2>{M.weeks}</h2>
          <ol className="weeks">
            {m.weeks.map((w) => {
              const hit = WEEK.exec(w);
              return <li key={w}><span>{fill(M.week, { n: hit?.[1] ?? "" })}</span><p>{hit?.[2] ?? w}</p></li>;
            })}
          </ol>
        </section>
      )}
      {m.topics && <section><h2>{m.trackSprint ? M.core : M.topics}</h2><List items={m.topics} /></section>}
      {m.trackSprint && <section><h2>{M.sprint}</h2><List items={m.trackSprint} /></section>}
      {m.skills && <section><h2>{M.skills}</h2><List items={m.skills} /></section>}
      {m.labs && <section><h2>{t.subnav.labs}</h2><Resources items={m.labs} /></section>}
      {m.tools && <section><h2>{t.nav.tools}</h2><p>{m.tools}</p></section>}
      {m.free && <section><h2>{M.free}</h2><Resources items={m.free} /></section>}
      {m.paid && <section><h2>{M.paid}</h2><Resources items={m.paid} /></section>}
      {m.ai && <section><h2>{M.ai}</h2><p>{m.ai}</p></section>}
      {m.portfolio && (
        <section>
          <h2>{M.portfolio}</h2>
          <p>{m.portfolio}</p>
          {projects.length > 0 && <p className="page-links">{projects.map((p) => <Link key={p.id} href={`/projects/${p.id}/`}>{p.id}: {p.title}</Link>)}</p>}
        </section>
      )}
      {m.career && <section><h2>{M.career}</h2><List items={m.career} /></section>}
      {m.jobs && <section><h2>{M.jobs}</h2><p>{m.jobs}</p></section>}
      {m.note && <div className="callout key"><span className="label">{m.note.title}</span><p>{m.note.text}</p></div>}
      </div>

      <nav className="pager" aria-label={M.months}>
        {prev ? <Link href={`/roadmap/${prev.n}/`}><span>{fill(t.common.month, { n: prev.n })}</span>{prev.title}</Link> : <span />}
        {next ? <Link href={`/roadmap/${next.n}/`} className="to-next"><span>{fill(t.common.month, { n: next.n })}</span>{next.title}</Link> : <span />}
      </nav>
    </div>
  );
}
