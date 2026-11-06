import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocView } from "@/components/DocView";
import { HELP_TEXT, ProjectMeter } from "@/components/ProjectParts";
import { TOOLS } from "@/data/tools";
import { brief, getProject, projects, termsFor } from "@/lib/content";
import { PROJECTS } from "@/lib/data";
import { stepAfter } from "@/lib/path";
import type { HelpLevel } from "@/lib/types";

export const dynamicParams = false;
export const generateStaticParams = () => PROJECTS.map((p) => ({ id: p.id }));

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `${id}: ${PROJECTS.find((p) => p.id === id)?.title ?? "Project"}` };
}

const ORDER: HelpLevel[] = ["guided", "recall", "solo"];

export default async function Page({ params }: Props) {
  const { id } = await params;
  const p = PROJECTS.find((x) => x.id === id);
  const doc = getProject(id);
  if (!p || !doc) notFound();
  const levels = new Map<string, HelpLevel>();
  for (const t of doc.tools) {
    const was = levels.get(t.tool);
    if (!was || ORDER.indexOf(t.level) < ORDER.indexOf(was)) levels.set(t.tool, t.level);
  }
  const tools = [...levels.entries()].sort((a, b) => ORDER.indexOf(a[1]) - ORDER.indexOf(b[1]));
  const i = PROJECTS.findIndex((x) => x.id === id);
  const near = (x?: (typeof PROJECTS)[number]) => (x ? { slug: x.id, title: `${x.id}: ${x.title}` } : null);
  const intro = (
    <div className="project-intro">
      <ProjectMeter ids={doc.checks.map((c) => c.id)} />
      {doc.meta.tested && <p className="tested"><strong>How this page was checked:</strong> {doc.meta.tested}</p>}
      <h2>The tools, and how much help you'll get</h2>
      <p className="muted">Help fades as you go. A new tool gets a full walkthrough. The next project asks you to recall it, with the answer hidden. After that, it's yours.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Tool</th><th>What it does</th><th>Help here</th></tr></thead>
          <tbody>
            {tools.map(([t, level]) => (
              <tr key={t}><td>{TOOLS[t]?.name ?? t}</td><td>{TOOLS[t]?.what}</td><td><span className={`level-chip ${level}`}>{HELP_TEXT[level].short}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  const outro = (
    <section className="prose-page">
      <h2>Publishing it</h2>
      {p.deliverables && <p><strong>What you'll have:</strong> {p.deliverables}</p>}
      {p.presentation && <p><strong>How to present it:</strong> {p.presentation}</p>}
      {p.pitch && <div className="callout job"><span className="label">Your interview pitch</span><p>{p.pitch}</p></div>}
      {p.bar && <div className="callout tip"><span className="label">Basic versus impressive</span><p>{p.bar}</p></div>}
      <p className="page-links"><Link href="/projects/">All projects</Link><Link href="/guides/h3-write-ups-and-reports/">How to write it up</Link><Link href="/guides/f1-project-standards/">Project standards</Link></p>
    </section>
  );
  return (
    <DocView
      meta={doc.meta}
      brief={brief(doc)}
      segments={doc.segments}
      toc={doc.toc}
      terms={termsFor(doc)}
      kicker={`Project ${p.id}${p.when ? ` · ${p.when}` : ""}`}
      prev={near(PROJECTS[i - 1])}
      next={near(PROJECTS[i + 1])}
      base="/projects/"
      after={stepAfter(`/projects/${id}/`)}
      intro={intro}
      outro={outro}
    />
  );
}
