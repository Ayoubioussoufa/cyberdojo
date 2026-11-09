import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { ProjectMeter } from "@/components/ProjectParts";
import { TOOLS } from "@/data/tools";
import { projects } from "@/lib/content";
import { PROJECTS } from "@/lib/data";
import type { HelpLevel } from "@/lib/types";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.nav.projects };
}

const LETTER: Record<HelpLevel, string> = { guided: "F", recall: "R", solo: "" };
const RANK: Record<HelpLevel, number> = { guided: 0, recall: 1, solo: 2 };

export default async function Page({ params }: LangParams) {
  const { lang, t } = await strings(params);
  const p = t.projects;
  const docs = projects(lang);
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
        <p className="kicker">{t.nav.projects}</p>
        <h1>{p.h1}</h1>
        <p className="lede">{p.lede}</p>
      </header>
      <ol className="rows">
        {PROJECTS.map((x) => {
          const doc = docs.find((d) => d.meta.slug === x.id);
          return (
            <li key={x.id}>
              <Link href={`/projects/${x.id}/`}>
                <span className="row-mark">{x.id.slice(1)}</span>
                <span className="row-main">
                  <span className="row-title">{doc && lang !== "en" && doc.meta.lang === lang ? doc.meta.title : x.title}</span>
                  <span className="row-sub">{doc?.meta.summary ?? x.objective}</span>
                  {doc && <ProjectMeter ids={doc.checks.map((c) => c.id)} />}
                </span>
                <span className="row-meta">{doc?.meta.hours ? `${doc.meta.hours} h` : ""}</span>
              </Link>
            </li>
          );
        })}
      </ol>

      <h2 className="section-title">{p.fadeH2}</h2>
      <p className="muted">{p.fadeText}</p>
      <p className="fade-key">
        <span><i className="fade-cell guided">F</i> {p.guided}</span>
        <span><i className="fade-cell recall">R</i> {p.recall}</span>
        <span><i className="fade-cell solo" /> {p.solo}</span>
      </p>
      <div className="table-wrap">
        <table className="fade-table">
          <thead>
            <tr><th>{t.kind.Tool}</th>{PROJECTS.map((x) => <th key={x.id}>{x.id.slice(1)}</th>)}</tr>
          </thead>
          <tbody>
            {repeated.map(([tool, row]) => (
              <tr key={tool}>
                <td>{TOOLS[tool]?.name ?? tool}</td>
                {PROJECTS.map((x) => {
                  const level = row.get(x.id);
                  return <td key={x.id}>{level && <span className={`fade-cell ${level}`} title={`${x.id}: ${p[level]}`}>{LETTER[level]}</span>}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
