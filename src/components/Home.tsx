"use client";

import Link from "next/link";
import { BeltChip } from "./Progress";
import { KIND_LABEL, currentBelt, isDone, nextStep, streak, weekPlan, type PathStep } from "@/lib/pathState";
import { today, useStore } from "@/lib/progress";

export function Home({ path, questionIds }: { path: PathStep[]; questionIds: string[] }) {
  const store = useStore();
  const now = today();
  const next = nextStep(path, store);
  const doneSteps = path.filter((s) => isDone(s, store)).length;
  const due = questionIds.filter((id) => store.srs[id] && (store.srs[id]?.due ?? "") <= now).length;
  const mistakes = store.mistakes.length;
  const started = doneSteps > 0 || !!store.plan;
  const week = store.plan ? weekPlan(path, store, store.plan.hours) : [];
  const days = streak(store.days, now);
  const b = currentBelt(path, store);

  return (
    <div className="page">
      {!started && (
        <section className="hero">
          <p className="kicker">From absolute zero to job-ready defender</p>
          <h1>Learn cybersecurity by doing it, one small win at a time.</h1>
          <p className="lede">No experience needed. Everything is explained from scratch, practised in a real terminal right here in your browser, and checked at once. When you're stuck, one button sends it all to your AI tutor.</p>
          <p className="hero-actions">
            <Link className="btn primary lg" href="/start/">See how it works, in 2 minutes</Link>
            {next && <Link className="btn lg" href={next.href}>Skip, and start learning</Link>}
          </p>
        </section>
      )}

      {started && (
        <header className="page-head">
          <p className="kicker">Today</p>
          <h1>{days > 1 ? `${days} days in a row. Keep going.` : doneSteps > 0 ? "Welcome back." : "Let's begin."}</h1>
        </header>
      )}

      <div className="today-grid">
        <section className="card today-next">
          <p className="band">Your next step{next ? ` · ${KIND_LABEL[next.kind]}` : ""}</p>
          {next ? (
            <>
              <h2>{next.title}</h2>
              <p className="muted">{next.note}</p>
              <p className="meta">{next.month === 0 ? "Day zero" : `Month ${next.month}`} · about {next.minutes >= 120 ? `${Math.round(next.minutes / 60)} hours` : `${next.minutes} minutes`}</p>
              <Link className="btn primary lg" href={next.href}>Open it</Link>
            </>
          ) : (
            <h2>You've finished the roadmap.</h2>
          )}
        </section>
        <section className="card stats">
          <BeltChip belt={b.belt} />
          {b.next && <p className="meta">{b.got} of {b.need} steps to your {b.next.name.toLowerCase()}</p>}
          <div className="stat-row">
            <div><strong>{doneSteps}</strong><span>steps done</span></div>
            <div><strong>{days}</strong><span>day streak</span></div>
          </div>
          {due > 0 && <Link className="btn wide" href="/review/">Do today's {due} review{due > 1 ? "s" : ""}</Link>}
          {mistakes > 0 && <Link className="btn wide" href="/practice/mistakes/">Retry {mistakes} mistake{mistakes > 1 ? "s" : ""}</Link>}
        </section>
      </div>

      {week.length > 0 && (
        <>
          <h2 className="section-title">This week, at {store.plan?.hours} hours</h2>
          <ol className="steps week">
            {week.map((s) => (
              <li key={s.id} className="step">
                <span className="step-mark" aria-hidden="true" />
                <Link href={s.href} className="step-body"><span className="step-kind">{KIND_LABEL[s.kind]}</span><span className="step-title">{s.title}</span></Link>
                <span className="step-time">{s.minutes >= 120 ? `${Math.round(s.minutes / 60)} h` : `${s.minutes} min`}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      <p className="page-links home-links">
        <Link href="/roadmap/">See my whole roadmap</Link>
        <Link href="/practice/">Practise something</Link>
        <Link href="/start/">How this site works</Link>
      </p>
    </div>
  );
}
