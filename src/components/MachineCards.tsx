"use client";

import Link from "@/components/HoverLink";
import { useStore } from "@/lib/progress";
import type { DocMeta } from "@/lib/types";

/** The machine list, with how many stages of each are done. */
export function MachineCards({ cards }: { cards: (DocMeta & { stages: string[] })[] }) {
  const store = useStore();
  return (
    <div className="grid3 machine-grid">
      {cards.map((c) => {
        const done = c.stages.filter((id) => store.missions[id]).length;
        return (
          <Link key={c.slug} href={`/machines/${c.slug}/`} className="card link-card machine-card">
            <span className="machine-top">
              <span className="phase-n">{c.level}</span>
              <span className="machine-progress">{done ? `${done} of ${c.stages.length} done` : `${c.stages.length} stages`}</span>
            </span>
            <h3>{c.title}</h3>
            <p className="muted">{c.summary}</p>
            <span className="machine-meta">About {c.minutes} min</span>
          </Link>
        );
      })}
    </div>
  );
}
