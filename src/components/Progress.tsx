"use client";

import Link from "next/link";
import { BELTS } from "@/data/path";
import { currentBelt, isDone, skillBars, streak, type PathStep } from "@/lib/pathState";
import { today, useStore } from "@/lib/progress";

export function BeltChip({ belt }: { belt: (typeof BELTS)[number] }) {
  return (
    <div className="belt-chip">
      <span className="belt-bar" style={{ background: belt.colour }} aria-hidden="true" />
      <div>
        <strong>{belt.name}</strong>
        <span className="meta">{belt.meaning}</span>
      </div>
    </div>
  );
}

function Calendar({ days }: { days: Record<string, number> }) {
  const weeks = 18;
  const end = new Date(`${today()}T12:00:00`);
  const start = new Date(end);
  start.setDate(end.getDate() - (weeks * 7 - 1) - ((end.getDay() + 6) % 7) + 6);
  const cells: { iso: string; n: number }[] = [];
  const p = (n: number) => String(n).padStart(2, "0");
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    cells.push({ iso, n: days[iso] ?? 0 });
  }
  const level = (n: number) => (n === 0 ? 0 : n < 3 ? 1 : n < 8 ? 2 : n < 15 ? 3 : 4);
  const active = cells.filter((c) => c.n).length;
  return (
    <div>
      <div className="cal" role="img" aria-label={`${active} active days in the last ${weeks} weeks`}>
        {cells.map((c) => <span key={c.iso} className={`cal-${level(c.n)}`} title={`${c.iso}: ${c.n} thing${c.n === 1 ? "" : "s"} done`} />)}
      </div>
      <p className="meta cal-legend"><span>{active} active days in {weeks} weeks</span><span className="cal-key">Less <i className="cal-0" /><i className="cal-1" /><i className="cal-2" /><i className="cal-3" /><i className="cal-4" /> More</span></p>
    </div>
  );
}

export function ProgressBoard({ path }: { path: PathStep[] }) {
  const store = useStore();
  const b = currentBelt(path, store);
  const at = BELTS.indexOf(b.belt);
  const count = (k: PathStep["kind"]) => {
    const all = path.filter((s) => s.kind === k);
    return `${all.filter((s) => isDone(s, store)).length}/${all.length}`;
  };
  const bars = skillBars(path, store);
  const can = path.filter((s) => s.kind === "lesson" && s.builds && isDone(s, store)).reverse();
  const asked = Object.values(store.first);
  const right = asked.filter(Boolean).length;
  return (
    <>
      <section className="card belts">
        <BeltChip belt={b.belt} />
        <ol className="belt-row" aria-label="Belts">
          {BELTS.map((x, i) => (
            <li key={x.name} className={i <= at ? "got" : ""} title={`${x.name}: ${x.meaning}`}>
              <span style={{ background: i <= at ? x.colour : undefined }} />
              <small>{x.name.replace(" belt", "")}</small>
            </li>
          ))}
        </ol>
        {b.next ? (
          <>
            <span className="meter" aria-hidden="true"><i style={{ width: `${b.need ? (b.got / b.need) * 100 : 0}%` }} /></span>
            <p className="meta">{b.got} of {b.need} required steps towards your {b.next.name.toLowerCase()}. <Link href="/roadmap/">See what's next</Link></p>
          </>
        ) : <p className="meta">You've earned every belt.</p>}
      </section>

      <section className="stat-tiles">
        <div className="card"><strong>{count("lesson")}</strong><span>lessons</span></div>
        <div className="card"><strong>{count("project")}</strong><span>project parts</span></div>
        <div className="card"><strong>{count("machine")}</strong><span>machines</span></div>
        <div className="card"><strong>{count("gate")}</strong><span>exit gates</span></div>
        <div className="card"><strong>{streak(store.days, today())}</strong><span>day streak</span></div>
        <div className="card"><strong>{asked.length ? `${Math.round((right / asked.length) * 100)}%` : "–"}</strong><span>right first try</span></div>
      </section>

      <h2 className="section-title">When you've practised</h2>
      <Calendar days={store.days} />

      <h2 className="section-title">What you can now do</h2>
      {can.length ? (
        <ul className="cando-list">{can.slice(0, 40).map((s) => <li key={s.id}><span className="cando-tick" aria-hidden="true">✓</span>You can {s.builds}</li>)}</ul>
      ) : <p className="muted">This list fills up as you finish lessons. Each one adds something you can really do.</p>}

      <h2 className="section-title">Skills you've studied</h2>
      <p className="muted">Lessons finished in each area. Your exit gates and projects show whether you can really do it.</p>
      <ul className="skill-bars">
        {bars.map((s) => (
          <li key={s.area} title={`${s.done} of ${s.total} lessons`}>
            <span className="skill-name">{s.area}</span>
            <span className="meter small" aria-hidden="true"><i style={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%` }} /></span>
            <span className="skill-count">{s.done}/{s.total}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
