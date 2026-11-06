"use client";

import Link from "next/link";
import { today, useStore } from "@/lib/progress";
import type { DocMeta } from "@/lib/types";

export function Home({ lessons, phases, questionIds }: { lessons: DocMeta[]; phases: { n: number; title: string; months: string; question: string; lessons: string[] }[]; questionIds: string[] }) {
  const store = useStore();
  const done = lessons.filter((l) => store.done[l.slug]).length;
  const next = lessons.find((l) => !store.done[l.slug]);
  const now = today();
  const due = questionIds.filter((id) => store.srs[id] && (store.srs[id]?.due ?? "") <= now).length;
  const missions = Object.keys(store.missions).length;
  const answered = Object.keys(store.first).length;
  const firstRight = Object.values(store.first).filter(Boolean).length;

  return (
    <div className="page">
      <section className="hero">
        <p className="kicker">From absolute zero to job-ready defender</p>
        <h1>Learn cybersecurity by doing it, one small win at a time.</h1>
        <p className="lede">No experience needed. Everything is explained from scratch, practised in a real terminal right here in your browser, and checked at once. When you're stuck, one button sends it all to your AI tutor.</p>
      </section>

      <div className="today-grid">
        <section className="card today-next">
          <p className="band">{done === 0 ? "Start here" : "Continue"}</p>
          {next ? (
            <>
              <h2>{next.title}</h2>
              <p className="muted">{next.summary}</p>
              <p className="meta">Lesson {next.number} · {next.minutes} min</p>
              <Link className="btn primary lg" href={`/courses/${next.slug}/`}>{done === 0 ? "Start lesson 1" : "Open the next lesson"}</Link>
            </>
          ) : (
            <h2>Every written lesson is done.</h2>
          )}
        </section>
        <section className="card stats">
          <div><strong>{done}<small>/{lessons.length}</small></strong><span>lessons</span></div>
          <div><strong>{due}</strong><span>reviews due</span></div>
          <div><strong>{missions}</strong><span>missions</span></div>
          <div><strong>{answered ? `${Math.round((firstRight / answered) * 100)}%` : "–"}</strong><span>right first try</span></div>
          {due > 0 && <Link className="btn wide" href="/review/">Do today's {due} review{due > 1 ? "s" : ""}</Link>}
        </section>
      </div>

      <h2 className="section-title">The path</h2>
      <div className="phases">
        {phases.map((p) => {
          const n = p.lessons.filter((s) => store.done[s]).length;
          const pct = p.lessons.length ? (n / p.lessons.length) * 100 : 0;
          return (
            <Link key={p.n} className="card phase" href={p.n === 0 ? "/courses/" : `/roadmap/#phase-${p.n}`}>
              <span className="phase-n">{p.months}</span>
              <h3>{p.title}</h3>
              <p className="muted">{p.question}</p>
              <span className="bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
              <span className="meta">{n} of {p.lessons.length} lessons</span>
            </Link>
          );
        })}
      </div>

      <h2 className="section-title">How each lesson works</h2>
      <ol className="how">
        <li><strong>Understand.</strong> Plain explanations from first principles. Hover any dotted word for its definition.</li>
        <li><strong>Check.</strong> Short questions inside every section, with the reason shown right away.</li>
        <li><strong>Do it.</strong> Real commands in the browser terminal, graded automatically, then real labs on your own machine.</li>
        <li><strong>Get corrected.</strong> One button copies everything, your answers included, for your AI tutor.</li>
        <li><strong>Remember.</strong> Questions come back on /review just before you'd forget them.</li>
      </ol>
    </div>
  );
}
