import type { Metadata } from "next";
import Link from "next/link";
import { MonthGrid } from "@/components/Roadmap";
import { lessonMetas } from "@/lib/content";
import { MONTHS, PHASES } from "@/lib/data";

export const metadata: Metadata = { title: "Roadmap" };

export default function Page() {
  const counts: Record<number, number> = {};
  for (const l of lessonMetas()) counts[l.month] = (counts[l.month] ?? 0) + 1;
  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Roadmap</p>
        <h1>24 months, one gate at a time</h1>
        <p className="lede">Each month ends with an exit gate: the difference between “I studied that” and “I can do that”. About 12–15 hours a week on top of your Master’s, roughly 1,300 hours of deliberate practice in all.</p>
        <p className="page-links"><Link href="/projects/">The 16 projects</Link><Link href="/skills/">Skill matrix and your data</Link><Link href="/guides/a2-how-to-use-this-plan/">How to run a month</Link></p>
      </header>
      {PHASES.filter((p) => p.n > 0).map((p) => (
        <section key={p.n} id={`phase-${p.n}`} className="phase-block">
          <h2 className="phase-h"><span>{p.months}</span>{p.title}</h2>
          <p className="muted phase-q">{p.question}</p>
          <MonthGrid months={MONTHS.filter((m) => m.phase === p.n)} counts={counts} />
        </section>
      ))}
    </div>
  );
}
