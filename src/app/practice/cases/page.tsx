import type { Metadata } from "next";
import Link from "next/link";
import { Subnav } from "@/components/Subnav";
import { CASES } from "@/lib/cases";

export const metadata: Metadata = { title: "Case files" };

export default function Page() {
  return (
    <div className="page">
      <Subnav group="practice" />
      <header className="page-head">
        <p className="kicker">Case files</p>
        <h1>Your decisions change the story</h1>
        <p className="lede">Real situations with real pressure. Each choice is explained at once, and bad calls have consequences later on. Play one more than once: names and details change, and other paths open up.</p>
      </header>
      <div className="grid3">
        {[...CASES].sort((a, b) => a.month - b.month).map((c) => (
          <Link key={c.id} href={`/practice/cases/${c.id}/`} className="card link-card">
            <span className="phase-n">Month {c.month} · {c.role}</span>
            <h3>{c.title}</h3>
            <p className="muted">{c.blurb}</p>
            <span className="meta">About {c.minutes} minutes</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
