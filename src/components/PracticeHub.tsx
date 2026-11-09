"use client";

import { fill, useLang } from "@/i18n/LangProvider";
import Link from "@/components/HoverLink";
import { useStore } from "@/lib/progress";

interface Tile {
  id: string;
  title: string;
  blurb: string;
  month: number;
}

const GROUPS = [
  { name: "g1", from: 0, to: 3 },
  { name: "g2", from: 4, to: 8 },
  { name: "g3", from: 9, to: 11 },
  { name: "g4", from: 12, to: 12 },
  { name: "g5", from: 13, to: 16 },
  { name: "g6", from: 17, to: 24 },
] as const;

const Best = ({ id }: { id: string }) => {
  const store = useStore();
  const b = store.drills[id];
  const { t } = useLang();
  return b ? <span className="meta tile-best">{fill(t.hub.best, { n: Math.round(b.best * 100) })}</span> : null;
};

export function DrillGroups({ drills }: { drills: Tile[] }) {
  const { lang, t } = useLang();
  return (
    <>
      {GROUPS.map((g) => {
        const list = drills.filter((d) => d.month >= g.from && d.month <= g.to);
        return (
          <details key={g.name} className="drill-group">
            <summary>{t.hub[g.name]} <span className="path-count">{list.length}</span></summary>
            <div className="grid3" lang={lang === "en" ? undefined : "en"}>
              {list.map((d) => (
                <Link key={d.id} href={`/practice/${d.id}/`} className="card link-card">
                  <h3>{d.title}</h3>
                  <p className="muted">{d.blurb}</p>
                  <Best id={d.id} />
                </Link>
              ))}
            </div>
          </details>
        );
      })}
    </>
  );
}

export function PracticeTop() {
  const store = useStore();
  const n = store.mistakes.length;
  const { t } = useLang();
  return (
    <div className="mix-row">
      <Link href="/practice/mix/" className="card link-card mix-card">
        <span className="band">{t.hub.mixBand}</span>
        <h2>{t.pages.mixTitle}</h2>
        <p className="muted">{t.hub.mixText}</p>
      </Link>
      <Link href="/practice/mistakes/" className="card link-card">
        <span className="band">{t.pages.mistakesTitle}</span>
        <h2>{n ? fill(t.hub.toRetry, { n }) : t.hub.none}</h2>
        <p className="muted">{t.hub.mistakesText}</p>
      </Link>
    </div>
  );
}
