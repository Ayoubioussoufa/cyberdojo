"use client";

import Link from "@/components/HoverLink";
import { HoverLink } from "./HoverLink";
import { phaseOf } from "@/lib/data";
import { monthsFor, phasesFor } from "@/data/fr/months";
import { fill, useLang } from "@/i18n/LangProvider";
import { finishDate, isDone, nextStep, partDone, type PathStep } from "@/lib/pathState";
import { useStore } from "@/lib/progress";

const LEGEND: PathStep["kind"][] = ["lesson", "handbook", "machine", "project", "gate"];

function Row({ s, on, done, part }: { s: PathStep; on: boolean; done: boolean; part: number }) {
  const { t } = useLang();
  return (
    <li className={`step${done ? " done" : ""}${on ? " on" : ""}`}>
      <span className="step-mark" aria-hidden="true">{done ? "✓" : on ? "▶" : ""}</span>
      <HoverLink href={s.href} className="step-body">
        <span className="step-kind">{t.step[s.kind]}</span>
        <span className="step-title">{s.title}</span>
        {on && <span className="step-note">{s.note}</span>}
        {part > 0 && part < 1 && <span className="meter small" aria-label={fill(t.roadmap.pct, { n: Math.round(part * 100) })}><i style={{ width: `${part * 100}%` }} /></span>}
      </HoverLink>
      <span className="step-time">{s.minutes >= 120 ? fill(t.common.hours, { n: Math.round(s.minutes / 60) }) : fill(t.common.min, { n: s.minutes })}</span>
    </li>
  );
}

export function PathView({ path }: { path: PathStep[] }) {
  const store = useStore();
  const { lang, t } = useLang();
  const R = t.roadmap;
  const MONTHS = monthsFor(lang);
  const next = nextStep(path, store);
  const doneCount = path.filter((s) => isDone(s, store)).length;
  const after = next ? path.slice(path.indexOf(next) + 1, path.indexOf(next) + 4) : [];
  const months = [...new Set(path.map((s) => s.month))];
  return (
    <>
      <section className="card here">
        {next ? (
          <>
            <p className="band">{fill(R.here, { when: next.month === 0 ? t.common.dayZero : fill(t.common.month, { n: next.month }), kind: t.step[next.kind] })}</p>
            <h2>{next.title}</h2>
            <p className="muted">{next.note}</p>
            <Link className="btn primary lg" href={next.href}>{doneCount === 0 ? R.first : R.next}</Link>
            {after.length > 0 && (
              <div className="then">
                <p className="meta">{R.then}</p>
                <ol>{after.map((s) => <li key={s.id}><span className="step-kind">{t.step[s.kind]}</span> {s.title}</li>)}</ol>
              </div>
            )}
          </>
        ) : (
          <h2>{R.finished}</h2>
        )}
        <div className="here-foot">
          <span className="meter" aria-hidden="true"><i style={{ width: `${(doneCount / path.length) * 100}%` }} /></span>
          <span className="meta">{fill(R.count, { n: doneCount, total: path.length })}{store.plan ? fill(R.finish, { hours: store.plan.hours, date: finishDate(path, store, store.plan.hours, new Date(), lang) }) : ""}</span>
        </div>
      </section>

      <details className="legend">
        <summary>{R.legend}</summary>
        <dl>
          {LEGEND.map((k) => (
            <div key={k}><dt>{t.step[k]}</dt><dd>{R[k]}</dd></div>
          ))}
        </dl>
      </details>

      {phasesFor(lang).map((p) => {
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
                    <span className="path-title">{info?.title ?? R.dayZero}</span>
                    <span className="path-count">{n}/{steps.length}</span>
                  </summary>
                  <ol className="steps">
                    {steps.map((s) => <Row key={s.id} s={s} on={s === next} done={isDone(s, store)} part={partDone(s, store)} />)}
                  </ol>
                  {info && <p className="page-links"><Link href={`/roadmap/${m}/`}>{fill(R.plan, { n: m })}</Link></p>}
                </details>
              );
            })}
          </section>
        );
      })}
    </>
  );
}
