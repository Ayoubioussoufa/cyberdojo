"use client";

import Link from "@/components/HoverLink";
import { finishDate, type PathStep } from "@/lib/pathState";
import { setPlan, today, useStore } from "@/lib/progress";

const OPTIONS = [
  { hours: 5, name: "Light", text: "Exams or a busy job. About an hour most days." },
  { hours: 13, name: "Standard", text: "The plan's normal pace alongside a Master's." },
  { hours: 20, name: "Fast", text: "A free summer. Don't keep this up for long." },
];

/** She picks a pace; every date and weekly plan on the site follows from it. */
export function Pace({ path }: { path: PathStep[] }) {
  const store = useStore();
  return (
    <div>
      <div className="pace" role="group" aria-label="Hours a week">
        {OPTIONS.map((o) => (
          <button key={o.hours} type="button" className={`card pace-card${store.plan?.hours === o.hours ? " on" : ""}`} aria-pressed={store.plan?.hours === o.hours} onClick={() => setPlan(o.hours, store.plan?.start ?? today())}>
            <strong>{o.hours} hours a week</strong>
            <span className="band">{o.name}</span>
            <span className="muted">{o.text}</span>
          </button>
        ))}
      </div>
      {store.plan && (
        <p className="pace-result">At this pace you'd finish around <strong>{finishDate(path, store, store.plan.hours)}</strong>. You can change this any time, and missing a week is fine.</p>
      )}
      <Link className="btn primary lg" href="/roadmap/">Open my roadmap</Link>
    </div>
  );
}
