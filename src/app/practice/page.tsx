import type { Metadata } from "next";
import Link from "next/link";
import { DrillGroups, PracticeTop } from "@/components/PracticeHub";
import { LazyRange } from "@/components/Lazy";
import { Subnav } from "@/components/Subnav";
import { CASES } from "@/lib/cases";
import { DRILL_LIST } from "@/lib/drills";
import { RANGES } from "@/lib/missions";
import { MISSIONS_MACHINES } from "@/lib/missions/machines";

export const metadata: Metadata = { title: "Practice" };

const MODES = [
  { href: "/practice/cases/", title: "Case files", blurb: `${CASES.length} branching stories. Your decisions change what happens next.` },
  { href: "/practice/hunts/", title: "Log hunts", blurb: "One line in the noise matters. Find it." },
  { href: "/practice/flaws/", title: "Spot the flaw", blurb: "Real code, with one dangerous line." },
  { href: "/practice/build/", title: "Command builder", blurb: "Assemble a command, and run it for real." },
  { href: "/practice/order/", title: "Put it in order", blurb: "Attacks, handshakes and responses, step by step." },
  { href: "/dojo/", title: "Dojo", blurb: "55 flag challenges: pipes, HTTP, SQL, encodings, XOR, access control." },
  { href: "/machines/", title: "Machines", blurb: "A whole target, from first look to proven fix." },
];

export default function Page() {
  const drills = DRILL_LIST.filter((d) => !["hunts", "flaws", "order", "build"].includes(d.id)).map(({ id, title, blurb, month }) => ({ id, title, blurb, month }));
  const ranges = Object.entries(RANGES).filter(([id]) => id !== "sandbox" && !(id in MISSIONS_MACHINES));
  return (
    <div className="page">
      <Subnav group="practice" />
      <header className="page-head">
        <p className="kicker">Practice</p>
        <h1>Make it stick</h1>
        <p className="lede">Reading feels like learning. Doing is learning. Every answer here is explained, right or wrong, and nothing repeats within a round.</p>
      </header>
      <PracticeTop />

      <h2 className="section-title">Play</h2>
      <div className="grid3">
        {MODES.map((m) => (
          <Link key={m.href} href={m.href} className="card link-card">
            <h3>{m.title}</h3>
            <p className="muted">{m.blurb}</p>
          </Link>
        ))}
      </div>

      <h2 className="section-title">Quick drills, by topic</h2>
      <p className="muted">Short rounds for the facts that have to be instant.</p>
      <DrillGroups drills={drills} />

      <h2 className="section-title">Terminal missions</h2>
      <details className="drill-group">
        <summary>All mission sets <span className="path-count">{ranges.length}</span></summary>
        <div className="grid3">
          {ranges.map(([id, r]) => (
            <Link key={id} href={`/practice/${id}/`} className="card link-card">
              <span className="phase-n">{r.missions.length} missions</span>
              <h3>{r.title}</h3>
            </Link>
          ))}
        </div>
      </details>

      <h2 className="section-title">Free terminal</h2>
      <LazyRange id="sandbox" />
    </div>
  );
}
