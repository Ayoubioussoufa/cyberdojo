"use client";

import Link from "next/link";
import { useStore } from "@/lib/progress";

interface Tile {
  id: string;
  title: string;
  blurb: string;
  month: number;
}

const GROUPS = [
  { name: "Foundations", from: 0, to: 3 },
  { name: "Code, Windows, web and crypto", from: 4, to: 8 },
  { name: "Defending: SOC, detection and response", from: 9, to: 11 },
  { name: "Risk and frameworks", from: 12, to: 12 },
  { name: "Cloud, forensics and intelligence", from: 13, to: 16 },
  { name: "AppSec, Kubernetes and AI", from: 17, to: 24 },
];

const Best = ({ id }: { id: string }) => {
  const store = useStore();
  const b = store.drills[id];
  return b ? <span className="meta tile-best">Best {Math.round(b.best * 100)}%</span> : null;
};

export function DrillGroups({ drills }: { drills: Tile[] }) {
  return (
    <>
      {GROUPS.map((g) => {
        const list = drills.filter((d) => d.month >= g.from && d.month <= g.to);
        return (
          <details key={g.name} className="drill-group">
            <summary>{g.name} <span className="path-count">{list.length}</span></summary>
            <div className="grid3">
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
  return (
    <div className="mix-row">
      <Link href="/practice/mix/" className="card link-card mix-card">
        <span className="band">Start here, most days</span>
        <h2>Today's mix</h2>
        <p className="muted">Ten mixed questions from everything you've reached. Ten minutes, and a different set each time.</p>
      </Link>
      <Link href="/practice/mistakes/" className="card link-card">
        <span className="band">Your mistakes</span>
        <h2>{n ? `${n} to retry` : "None yet"}</h2>
        <p className="muted">Anything you get wrong stays here, with its explanation, until you've got it right.</p>
      </Link>
    </div>
  );
}
