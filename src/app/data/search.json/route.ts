import { DOJO } from "@/data/dojo";
import { glossary, guides, lessons, machines, modules, projects, sheets, toolDocs } from "@/lib/content";
import TOOL_INDEX from "@/data/toolindex.json";
import { RANGES } from "@/lib/missions";

export const dynamic = "force-static";

export interface Hit {
  title: string;
  sub: string;
  kind: string;
  href: string;
}

/** Everything the search box can find. Fetched the first time someone opens it. */
export const GET = () => {
  const hits: Hit[] = [
    ...lessons().map((d) => ({ title: d.meta.title, sub: d.meta.summary, kind: "Lesson", href: `/courses/${d.meta.slug}/` })),
    ...modules().map((d) => ({ title: d.meta.title, sub: d.meta.summary, kind: "Module", href: `/modules/${d.meta.slug}/` })),
    ...toolDocs().flatMap((d) => [d.meta.title, ...(d.meta.aka ?? [])].map((title) => ({ title, sub: d.meta.summary, kind: "Tool", href: `/tools/${d.meta.slug}/` }))),
    ...(TOOL_INDEX as { name: string; slug: string; has?: boolean }[]).filter((t) => !t.has).map((t) => ({ title: t.name, sub: "Listed in the A to Z of tools, with no guide yet", kind: "Tool", href: `/tools/all/#${t.slug}` })),
    ...DOJO.map((m) => ({ title: m.title, sub: `Learn to ${m.skill}.`, kind: "Dojo", href: `/dojo/${m.id}/` })),
    ...DOJO.flatMap((m) => (RANGES[m.range]?.missions ?? []).map((x) => ({ title: x.title, sub: m.title, kind: "Challenge", href: `/dojo/${m.id}/` }))),
    ...machines().map((d) => ({ title: d.meta.title, sub: d.meta.summary, kind: "Machine", href: `/machines/${d.meta.slug}/` })),
    ...projects().map((d) => ({ title: d.meta.title, sub: d.meta.summary, kind: "Project", href: `/projects/${d.meta.slug}/` })),
    ...guides().map((d) => ({ title: d.meta.title, sub: d.meta.summary, kind: "Handbook", href: `/guides/${d.meta.slug}/` })),
    ...sheets().map((d) => ({ title: d.meta.title, sub: d.meta.summary, kind: "Sheet", href: `/sheets/${d.meta.slug}/` })),
    ...glossary().map((t) => ({ title: t.term, sub: t.definition, kind: "Term", href: t.href })),
  ];
  return Response.json(hits);
};
