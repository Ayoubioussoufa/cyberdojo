import type { Metadata } from "next";
import Link from "next/link";
import { PROJECTS } from "@/lib/data";

export const metadata: Metadata = { title: "Projects" };

export default function Page() {
  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="kicker">Portfolio</p>
        <h1>16 projects, from beginner to professional</h1>
        <p className="lede">Certificates pass HR filters. Projects and reports pass technical interviews. Finished beats ambitious: every project ends in writing that a stranger can follow.</p>
      </header>
      <ol className="rows">
        {PROJECTS.map((p) => (
          <li key={p.id}>
            <Link href={`/projects/${p.id}/`}>
              <span className="row-mark">{p.id.slice(1)}</span>
              <span className="row-main">
                <span className="row-title">{p.title}</span>
                <span className="row-sub">{p.objective}</span>
              </span>
              <span className="row-meta">{p.when.split(" · ")[1]}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
