import type { Metadata } from "next";
import { Subnav } from "@/components/Subnav";
import Link from "next/link";
import { Range } from "@/components/Range";
import { DRILL_LIST } from "@/lib/drills";
import { RANGES } from "@/lib/missions";
import { MISSIONS_MACHINES } from "@/lib/missions/machines";

export const metadata: Metadata = { title: "Practice" };

export default function Page() {
  return (
    <div className="page">
      <Subnav group="practice" />
      <header className="page-head">
        <p className="kicker">Practice</p>
        <h1>Exercises that never run out</h1>
        <p className="lede">Drills generate new values every round. Missions run in a real shell simulator and grade themselves. Practise a little and often: spacing beats cramming.</p>
      </header>
      <h2 className="section-title">Drills</h2>
      <div className="grid3">
        {DRILL_LIST.map((d) => (
          <Link key={d.id} href={`/practice/${d.id}/`} className="card link-card">
            <span className="phase-n">{d.month === 0 ? "Day zero" : `Month ${d.month}`}</span>
            <h3>{d.title}</h3>
            <p className="muted">{d.blurb}</p>
          </Link>
        ))}
      </div>
      <h2 className="section-title">Terminal missions</h2>
      <p className="muted">Open any lesson that has them, or use the sets below. For a whole story on one target, try the <Link href="/machines/">machines</Link>.</p>
      <div className="grid3">
        {Object.entries(RANGES).filter(([id]) => id !== "sandbox" && !(id in MISSIONS_MACHINES)).map(([id, r]) => (
          <Link key={id} href={`/practice/${id}/`} className="card link-card">
            <span className="phase-n">{r.missions.length} missions</span>
            <h3>{r.title}</h3>
          </Link>
        ))}
      </div>
      <h2 className="section-title">Free terminal</h2>
      <Range id="sandbox" />
    </div>
  );
}
