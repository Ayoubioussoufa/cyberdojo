import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { notFound } from "next/navigation";
import { DocView } from "@/components/DocView";
import { helpText } from "@/data/help";
import { ProjectMeter } from "@/components/ProjectParts";
import { TOOLS } from "@/data/tools";
import { brief, getProject, projects, termsFor, tocWith, trainPanel } from "@/lib/content";
import { PROJECTS } from "@/lib/data";
import { stepAfter } from "@/lib/path";
import type { HelpLevel } from "@/lib/types";
import { fill } from "@/i18n/lang";
import { strings, type LangParams } from "@/i18n/server";

export const dynamicParams = false;
export const generateStaticParams = () => PROJECTS.map((p) => ({ id: p.id }));

type Props = LangParams<{ id: string }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { lang, t } = await strings(params);
  const doc = getProject(id, lang);
  const title = doc && lang !== "en" && doc.meta.lang === lang ? doc.meta.title : PROJECTS.find((p) => p.id === id)?.title;
  return { title: `${id}: ${title ?? t.step.project}` };
}

const ORDER: HelpLevel[] = ["guided", "recall", "solo"];

export default async function Page({ params }: Props) {
  const { id } = await params;
  const { lang, t } = await strings(params);
  const P = t.project;
  const HELP = helpText(lang);
  const p = PROJECTS.find((x) => x.id === id);
  const doc = getProject(id, lang);
  if (!p || !doc) notFound();
  const levels = new Map<string, HelpLevel>();
  for (const u of doc.tools) {
    const was = levels.get(u.tool);
    if (!was || ORDER.indexOf(u.level) < ORDER.indexOf(was)) levels.set(u.tool, u.level);
  }
  const tools = [...levels.entries()].sort((a, b) => ORDER.indexOf(a[1]) - ORDER.indexOf(b[1]));
  const i = PROJECTS.findIndex((x) => x.id === id);
  const titleOf = (x: (typeof PROJECTS)[number]) => {
    const d = getProject(x.id, lang);
    return d && lang !== "en" && d.meta.lang === lang ? d.meta.title : x.title;
  };
  const near = (x?: (typeof PROJECTS)[number]) => (x ? { slug: x.id, title: `${x.id}: ${titleOf(x)}` } : null);
  const intro = (
    <div key="intro" className="project-intro">
      <ProjectMeter ids={doc.checks.map((c) => c.id)} />
      {doc.meta.tested && <p className="tested"><strong>{P.checked}</strong> <span lang={lang === "en" ? undefined : "en"}>{doc.meta.tested}</span></p>}
      <h2>{P.toolsH2}</h2>
      <p className="muted">{P.toolsText}</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>{t.kind.Tool}</th><th>{P.what}</th><th>{P.help}</th></tr></thead>
          <tbody>
            {tools.map(([tool, level]) => (
              <tr key={tool}><td>{TOOLS[tool]?.name ?? tool}</td><td lang={lang === "en" ? undefined : "en"}>{TOOLS[tool]?.what}</td><td><span className={`level-chip ${level}`}>{HELP[level].short}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  const outro = (
    <section key="outro" className="prose-page">
      <h2>{P.publish}</h2>
      <div lang={lang === "en" ? undefined : "en"}>
        {p.deliverables && <p><strong>{P.have}</strong> {p.deliverables}</p>}
        {p.presentation && <p><strong>{P.present}</strong> {p.presentation}</p>}
        {p.pitch && <div className="callout job"><span className="label">{P.pitch}</span><p>{p.pitch}</p></div>}
        {p.bar && <div className="callout tip"><span className="label">{P.bar}</span><p>{p.bar}</p></div>}
      </div>
      <p className="page-links"><Link href="/projects/">{P.all}</Link><Link href="/guides/h3-write-ups-and-reports/">{P.writeUp}</Link><Link href="/guides/f1-project-standards/">{P.standards}</Link></p>
    </section>
  );
  return (
    <DocView
      meta={doc.meta}
      brief={brief(doc)}
      segments={[...doc.segments, ...trainPanel(doc, id, lang)]}
      toc={tocWith(doc, id, "end", lang)}
      terms={termsFor(doc, lang)}
      kicker={`${fill(P.kicker, { id: p.id })}${p.when && lang === "en" ? `, ${p.when}` : ""}`}
      prev={near(PROJECTS[i - 1])}
      next={near(PROJECTS[i + 1])}
      base="/projects/"
      after={stepAfter(`/projects/${id}/`, lang)}
      intro={intro}
      outro={outro}
    />
  );
}
