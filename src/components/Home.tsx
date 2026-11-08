"use client";

import Link from "@/components/HoverLink";
import { BeltChip } from "./Progress";
import { KIND_LABEL, currentBelt, isDone, nextStep, streak, weekPlan, type PathStep } from "@/lib/pathState";
import { today, useStore } from "@/lib/progress";
import { useEffect, useState } from "react";
import { TIPS, type Tip } from "@/data/tips";

export function Home({ path }: { path: PathStep[] }) {
  const store = useStore();
  const now = today();
  const next = nextStep(path, store);
  const doneSteps = path.filter((s) => isDone(s, store)).length;
  const dueEntries = Object.entries(store.srs).filter(([, c]) => c.due <= now);
  const due = dueEntries.filter(([k]) => !k.startsWith("fc:")).length;
  const dueCards = dueEntries.length - due;
  const mistakes = store.mistakes.length;
  const started = doneSteps > 0 || !!store.plan;
  const week = store.plan ? weekPlan(path, store, store.plan.hours) : [];
  const days = streak(store.days, now);
  const b = currentBelt(path, store);
  // Picked after mounting, by day of the year, so the server and browser never disagree.
  const [tip, setTip] = useState<Tip | null>(null);
  useEffect(() => {
    const d = new Date();
    const day = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000);
    setTip(TIPS[day % TIPS.length] ?? null);
  }, []);

  return (
    <div className="page">
      {!started && (
        <section className="hero-console">
          <div className="hero-pane" aria-label="An example from the course: finding an attacker's address in a log, then submitting a flag">
            <h1><span className="hero-hash" aria-hidden="true"># </span>Learn cybersecurity by doing it, one small win at a time.</h1>
            <div className="hero-term">
              <p><span className="p">ana@lab:~$</span> grep &apos;Failed password&apos; auth.log | wc -l</p>
              <p>214</p>
              <p className="gap"><span className="p">ana@lab:~$</span> grep Failed auth.log | awk &apos;{"{print $(NF-3)}"}&apos; | sort | uniq -c | sort -rn | head -2</p>
              <p>    187 203.0.113.7</p>
              <p>      9 198.51.100.23</p>
              <p className="gap"><span className="p">ana@lab:~$</span> submit CD{"{"}7kqm2xw9ph{"}"}</p>
              <p className="g">Flag captured. One stitch closer to your yellow belt.</p>
            </div>
          </div>
          <p className="lede">No experience needed. Everything is explained from scratch, practised in a simulated terminal right here in your browser, and checked at once. When you&apos;re stuck, one button sends it all to your AI tutor.</p>
          <p className="hero-actions">
            <Link className="btn primary lg" href="/start/">See how it works, in 2 minutes</Link>
            {next && <Link className="btn lg" href={next.href}>Skip, and start learning</Link>}
          </p>
        </section>
      )}

      {started && (
        <header className="page-head">
          <h1>{days > 1 ? `${days} days in a row. Keep going.` : doneSteps > 0 ? "Welcome back." : "Let's begin."}</h1>
        </header>
      )}

      <section className="status" aria-labelledby="status-h">
        <h2 id="status-h" className="status-h">Your status</h2>
        <dl className="status-list">
          <div>
            <dt>Belt</dt>
            <dd>
              <BeltChip belt={b.belt} />
              {b.next && <span className="muted">{b.got} of {b.need} steps to your {b.next.name.toLowerCase()}</span>}
            </dd>
          </div>
          <div>
            <dt>Progress</dt>
            <dd>{doneSteps} of {path.length} roadmap steps done, {days} day{days === 1 ? "" : "s"} in a row</dd>
          </div>
          {(due > 0 || dueCards > 0 || mistakes > 0) && (
            <div>
              <dt>Due today</dt>
              <dd className="status-actions">
                {due > 0 && <Link href="/review/">{due} question{due > 1 ? "s" : ""} to review</Link>}
                {dueCards > 0 && <Link href="/practice/flashcards/">{dueCards} flashcard{dueCards > 1 ? "s" : ""}</Link>}
                {mistakes > 0 && <Link href="/practice/mistakes/">{mistakes} mistake{mistakes > 1 ? "s" : ""} to retry</Link>}
              </dd>
            </div>
          )}
          {tip && (
            <div>
              <dt>Tip of the day</dt>
              <dd className="status-tip">{tip.text} <Link href={tip.href}>Why</Link></dd>
            </div>
          )}
          <div className="status-next">
            <dt>Next step</dt>
            <dd>
              {next ? (
                <>
                  <span className="status-kind">{KIND_LABEL[next.kind]}, {next.month === 0 ? "day zero" : `month ${next.month}`}, about {next.minutes >= 120 ? `${Math.round(next.minutes / 60)} hours` : `${next.minutes} minutes`}</span>
                  <strong className="status-title">{next.title}</strong>
                  <span className="muted">{next.note}</span>
                  <Link className="btn primary" href={next.href}>Open {next.title}</Link>
                </>
              ) : (
                <strong>You&apos;ve finished the roadmap.</strong>
              )}
            </dd>
          </div>
        </dl>
      </section>

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
