import type { Metadata } from "next";
import Link from "next/link";
import { ProjectMeter } from "@/components/ProjectParts";
import { TOOLS } from "@/data/tools";
import { projects } from "@/lib/content";
import { PROJECTS } from "@/lib/data";
import type { HelpLevel } from "@/lib/types";

export const metadata: Metadata = { title: "Projects" };

const LETTER: Record<HelpLevel, string> = { guided: "F", recall: "R", solo: "" };
const RANK: Record<HelpLevel, number> = { guided: 0, recall: 1, solo: 2 };

export default function Page() {
  const docs = projects();
  const uses = new Map<string, Map<string, HelpLevel>>();
  for (const d of docs) {
    for (const t of d.tools) {
      const row = uses.get(t.tool) ?? new Map<string, HelpLevel>();
      const was = row.get(d.meta.slug);
      if (!was || RANK[t.level] < RANK[was]) row.set(d.meta.slug, t.level);
      uses.set(t.tool, row);
    }
  }
  const repeated = [...uses.entries()].filter(([, r]) => r.size > 1);
  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="kicker">Projects</p>
        <h1>16 projects, from beginner to professional</h1>
        <p className="lede">Certificates pass HR filters, and projects pass technical interviews. Each one here is a real thing that you build and publish, with step-by-step guidance. The Roadmap tells you when to start each one.</p>
      </header>
      <ol className="rows">
        {PROJECTS.map((p) => {
          const doc = docs.find((d) => d.meta.slug === p.id);
          return (
            <li key={p.id}>
              <Link href={`/projects/${p.id}/`}>
                <span className="row-mark">{p.id.slice(1)}</span>
                <span className="row-main">
                  <span className="row-title">{p.title}</span>
                  <span className="row-sub">{doc?.meta.summary ?? p.objective}</span>
                  {doc && <ProjectMeter ids={doc.checks.map((c) => c.id)} />}
                </span>
                <span className="row-meta">{doc?.meta.hours ? `${doc.meta.hours} h` : ""}</span>
              </Link>
            </li>
          );
        })}
      </ol>

      <h2 className="section-title">Why you'll need less help as you go</h2>
      <p className="muted">The first time you meet a tool, every step is explained. The next time, you're asked to recall it, and the answer stays hidden until you need it. After that, you're on your own, because by then you know it. This map shows each tool that comes back.</p>
      <p className="fade-key">
        <span><i className="fade-cell guided">F</i> Full walkthrough</span>
        <span><i className="fade-cell recall">R</i> Recall, answer hidden</span>
        <span><i className="fade-cell solo" /> On your own</span>
      </p>
      <div className="table-wrap">
        <table className="fade-table">
          <thead>
            <tr><th>Tool</th>{PROJECTS.map((p) => <th key={p.id}>{p.id.slice(1)}</th>)}</tr>
          </thead>
          <tbody>
            {repeated.map(([tool, row]) => (
              <tr key={tool}>
                <td>{TOOLS[tool]?.name ?? tool}</td>
                {PROJECTS.map((p) => {
                  const level = row.get(p.id);
                  return <td key={p.id}>{level && <span className={`fade-cell ${level}`} title={`${p.id}: ${level}`}>{LETTER[level]}</span>}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
