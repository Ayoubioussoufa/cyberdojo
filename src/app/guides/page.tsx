import type { Metadata } from "next";
import { DocRows } from "@/components/Lists";
import { guideMetas } from "@/lib/content";

export const metadata: Metadata = { title: "Guides" };

export default function Page() {
  const metas = guideMetas();
  const groups = [...new Set(metas.map((m) => m.group ?? "Guides"))];
  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="kicker">Guides</p>
        <h1>Everything around the lessons</h1>
        <p className="lede">How the plan works, what the jobs really are, certifications, careers, interviews, and how to work with AI. Read each one when the roadmap sends you there.</p>
      </header>
      {groups.map((g) => (
        <section key={g} className="phase-block">
          <h2 className="phase-h">{g}</h2>
          <DocRows docs={metas.filter((m) => (m.group ?? "Guides") === g)} base="/guides/" />
        </section>
      ))}
    </div>
  );
}
