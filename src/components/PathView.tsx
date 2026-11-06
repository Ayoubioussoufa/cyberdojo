"use client";

import Link from "next/link";
import { HoverLink } from "./HoverLink";
import { MONTHS, PHASES, phaseOf } from "@/lib/data";
import { KIND_LABEL, finishDate, isDone, nextStep, partDone, type PathStep } from "@/lib/pathState";
import { useStore } from "@/lib/progress";

const LEGEND: { kind: PathStep["kind"]; text: string }[] = [
  { kind: "lesson", text: "Teaches one skill, with questions and exercises." },
  { kind: "handbook", text: "A short read about the journey: jobs, habits, AI, your CV." },
  { kind: "machine", text: "A whole story on one target, in your browser." },
  { kind: "project", text: "Something real that you build and publish." },
  { kind: "gate", text: "Prove the month's skills with no notes and no AI." },
];

function Row({ s, on, done, part }: { s: PathStep; on: boolean; done: boolean; part: number }) {
  return (
    <li className={`step${done ? " done" : ""}${on ? " on" : ""}`}>
      <span className="step-mark" aria-hidden="true">{done ? "✓" : on ? "▶" : ""}</span>
      <HoverLink href={s.href} className="step-body">
        <span className="step-kind">{KIND_LABEL[s.kind]}</span>
        <span className="step-title">{s.title}</span>
        {on && <span className="step-note">{s.note}</span>}
        {part > 0 && part < 1 && <span className="meter small" aria-label={`${Math.round(part * 100)}% done`}><i style={{ width: `${part * 100}%` }} /></span>}
      </HoverLink>
      <span className="step-time">{s.minutes >= 120 ? `${Math.round(s.minutes / 60)} h` : `${s.minutes} min`}</span>
    </li>
  );
}

export function PathView({ path }: { path: PathStep[] }) {
  const store = useStore();
  const next = nextStep(path, store);
  const doneCount = path.filter((s) => isDone(s, store)).length;
  const after = next ? path.slice(path.indexOf(next) + 1, path.indexOf(next) + 4) : [];
  const months = [...new Set(path.map((s) => s.month))];
  return (
    <>
      <section className="card here">
        {next ? (
          <>
            <p className="band">You are here · {next.month === 0 ? "Day zero" : `Month ${next.month}`} · {KIND_LABEL[next.kind]}</p>
            <h2>{next.title}</h2>
            <p className="muted">{next.note}</p>
            <Link className="btn primary lg" href={next.href}>{doneCount === 0 ? "Take the first step" : "Do this next"}</Link>
            {after.length > 0 && (
              <div className="then">
                <p className="meta">Then</p>
                <ol>{after.map((s) => <li key={s.id}><span className="step-kind">{KIND_LABEL[s.kind]}</span> {s.title}</li>)}</ol>
              </div>
            )}
          </>
        ) : (
          <h2>You've finished the whole roadmap.</h2>
        )}
        <div className="here-foot">
          <span className="meter" aria-hidden="true"><i style={{ width: `${(doneCount / path.length) * 100}%` }} /></span>
          <span className="meta">{doneCount} of {path.length} steps{store.plan ? ` · at ${store.plan.hours} hours a week, you'd finish around ${finishDate(path, store, store.plan.hours)}` : ""}</span>
        </div>
      </section>

      <details className="legend">
        <summary>What do these step types mean?</summary>
        <dl>
          {LEGEND.map((l) => (
            <div key={l.kind}><dt>{KIND_LABEL[l.kind]}</dt><dd>{l.text}</dd></div>
          ))}
        </dl>
      </details>

      {PHASES.map((p) => {
        const list = months.filter((m) => phaseOf(m) === p.n);
        if (!list.length) return null;
        return (
          <section key={p.n} id={`phase-${p.n}`} className="phase-block">
            <h2 className="phase-h"><span>{p.months}</span>{p.title}</h2>
            <p className="muted phase-q">{p.question}</p>
            {list.map((m) => {
              const steps = path.filter((s) => s.month === m);
              const n = steps.filter((s) => isDone(s, store)).length;
              const open = !!next && next.month === m;
              const info = m > 0 ? MONTHS[m - 1] : undefined;
              return (
                <details key={m} className="path-month" open={open}>
                  <summary>
                    <span className="month-n">{n === steps.length ? "✓" : m === 0 ? "0" : String(m).padStart(2, "0")}</span>
                    <span className="path-title">{info?.title ?? "Day zero: before you begin"}</span>
                    <span className="path-count">{n}/{steps.length}</span>
                  </summary>
                  <ol className="steps">
                    {steps.map((s) => <Row key={s.id} s={s} on={s === next} done={isDone(s, store)} part={partDone(s, store)} />)}
                  </ol>
                  {info && <p className="page-links"><Link href={`/roadmap/${m}/`}>Month {m} plan: weekly schedule, labs and free resources</Link></p>}
                </details>
              );
            })}
          </section>
        );
      })}
    </>
  );
}
