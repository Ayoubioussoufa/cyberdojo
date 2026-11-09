"use client";

import { fill, useLang } from "@/i18n/LangProvider";
import { levelName } from "@/i18n/ui";
import Link from "@/components/HoverLink";
import { useStore } from "@/lib/progress";
import type { DocMeta } from "@/lib/types";

/** The machine list, with how many stages of each are done. */
export function MachineCards({ cards }: { cards: (DocMeta & { stages: string[] })[] }) {
  const store = useStore();
  const { lang, t } = useLang();
  return (
    <div className="grid3 machine-grid">
      {cards.map((c) => {
        const done = c.stages.filter((id) => store.missions[id]).length;
        return (
          <Link key={c.slug} href={`/machines/${c.slug}/`} className="card link-card machine-card">
            <span className="machine-top">
              <span className="phase-n">{levelName(lang, c.level ?? "")}</span>
              <span className="machine-progress">{done ? fill(t.misc.stagesDone, { n: done, total: c.stages.length }) : fill(t.misc.stages, { n: c.stages.length })}</span>
            </span>
            <h3>{c.title}</h3>
            <p className="muted">{c.summary}</p>
            <span className="machine-meta">{fill(t.misc.aboutMin, { n: c.minutes })}</span>
          </Link>
        );
      })}
    </div>
  );
}
