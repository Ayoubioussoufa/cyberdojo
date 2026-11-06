import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { DocRows } from "@/components/Lists";
import { lessonMetas } from "@/lib/content";
import { MONTHS, PHASES, phaseOf } from "@/lib/data";

export const metadata: Metadata = { title: "Lessons" };

export default function Page() {
  const metas = lessonMetas();
  const total = metas.reduce((s, m) => s + m.minutes, 0);
  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="kicker">Lessons</p>
        <h1>Every lesson, in order</h1>
        <p className="lede">{metas.length} lessons that teach you one skill at a time, about {Math.round(total / 60)} hours of reading and practice, and much more on real labs. Each one assumes only the lessons before it, and your <Link href="/roadmap/">Roadmap</Link> tells you which one is next.</p>
      </header>
      {PHASES.map((p) => {
        const inPhase = metas.filter((m) => phaseOf(m.month) === p.n);
        if (!inPhase.length) return null;
        const months = [...new Set(inPhase.map((m) => m.month))];
        return (
          <section key={p.n} className="phase-block">
            <h2 className="phase-h"><span>{p.months}</span>{p.title}</h2>
            {months.map((mn) => (
              <div key={mn} className="month-block">
                {mn > 0 && (
                  <h3><Link href={`/roadmap/${mn}/`}>Month {mn}: {MONTHS[mn - 1]?.title}</Link></h3>
                )}
                <DocRows docs={inPhase.filter((m) => m.month === mn)} base="/courses/" />
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
