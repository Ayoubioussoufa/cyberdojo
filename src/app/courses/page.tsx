import type { Metadata } from "next";
import Link from "next/link";
import { DocRows } from "@/components/Lists";
import { lessonMetas } from "@/lib/content";
import { MONTHS, PHASES, phaseOf } from "@/lib/data";

export const metadata: Metadata = { title: "Courses" };

export default function Page() {
  const metas = lessonMetas();
  const total = metas.reduce((s, m) => s + m.minutes, 0);
  const covered = new Set(metas.map((m) => m.month));
  // Months 22–24 are covered together by the last lesson.
  const unwritten = MONTHS.filter((m) => m.n <= 21 && !covered.has(m.n));
  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="kicker">Courses</p>
        <h1>Every lesson, in order</h1>
        <p className="lede">{metas.length} lessons, about {Math.round(total / 60)} hours of reading and practice, and much more on real labs. Each one assumes only the lessons before it.</p>
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
      {unwritten.length > 0 && (
        <div className="callout key">
          <span className="label">No lessons here yet</span>
          <p>
            {unwritten.map((m, i) => (
              <span key={m.n}>{i > 0 ? " and " : ""}<Link href={`/roadmap/${m.n}/`}>Month {m.n}: {m.title}</Link></span>
            ))}{" "}
            {unwritten.length > 1 ? "have" : "has"} no written lessons in this course. {unwritten.length > 1 ? "Their roadmap pages have" : "Its roadmap page has"} the full plan, exit gate and links to the free training platforms that teach that material with legal labs.
          </p>
        </div>
      )}
    </div>
  );
}
