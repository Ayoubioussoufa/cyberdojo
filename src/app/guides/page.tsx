import type { Metadata } from "next";
import { Subnav } from "@/components/Subnav";
import Link from "@/components/HoverLink";
import { DocRows } from "@/components/Lists";
import { guideMetas } from "@/lib/content";

export const metadata: Metadata = { title: "Handbook" };

export default function Page() {
  const metas = guideMetas();
  const groups = [...new Set(metas.map((m) => m.group ?? "Guides"))];
  return (
    <div className="page narrow">
      <Subnav group="library" />
      <header className="page-head">
        <p className="kicker">Handbook</p>
        <h1>Advice for the journey</h1>
        <p className="lede">Lessons teach you skills. These pages are different: they're advice about the journey, such as how to plan your weeks, which job suits you, and how to write a CV. You don't read them in one go. Your <Link href="/roadmap/">Roadmap</Link> brings you to each one at the right moment.</p>
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
