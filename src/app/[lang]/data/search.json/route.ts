import { dojoModules } from "@/data/fr/dojo";
import { glossary, guides, lessons, machines, modules, projects, sheets, toolDocs } from "@/lib/content";
import { LANGS, fill, isLang } from "@/i18n/lang";
import { UI } from "@/i18n/ui";
import TOOL_INDEX from "@/data/toolindex.json";
import { RANGES } from "@/lib/missions";

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

export interface Hit {
  title: string;
  sub: string;
  kind: string;
  href: string;
}

/**
 * Everything the search box can find. Fetched the first time someone opens it.
 * `kind` stays the English key ("Lesson"); the page shows it in its own language.
 * Hrefs are English-site paths; the French page adds its prefix when it follows one.
 */
export async function GET(_: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = isLang(raw) ? raw : "en";
  const k = UI[lang].kind;
  const hits: Hit[] = [
    ...lessons(lang).map((d) => ({ title: d.meta.title, sub: d.meta.summary, kind: "Lesson", href: `/courses/${d.meta.slug}/` })),
    ...modules(lang).map((d) => ({ title: d.meta.title, sub: d.meta.summary, kind: "Module", href: `/modules/${d.meta.slug}/` })),
    ...toolDocs(lang).flatMap((d) => [d.meta.title, ...(d.meta.aka ?? [])].map((title) => ({ title, sub: d.meta.summary, kind: "Tool", href: `/tools/${d.meta.slug}/` }))),
    ...(TOOL_INDEX as { name: string; slug: string; has?: boolean }[]).filter((t) => !t.has).map((t) => ({ title: t.name, sub: k.noGuide, kind: "Tool", href: `/tools/all/#${t.slug}` })),
    ...dojoModules(lang).map((m) => ({ title: m.title, sub: fill(k.learnTo, { skill: m.skill }), kind: "Dojo", href: `/dojo/${m.id}/` })),
    ...dojoModules(lang).flatMap((m) => (RANGES[m.range]?.missions ?? []).map((x) => ({ title: x.title, sub: m.title, kind: "Challenge", href: `/dojo/${m.id}/` }))),
    ...machines(lang).map((d) => ({ title: d.meta.title, sub: d.meta.summary, kind: "Machine", href: `/machines/${d.meta.slug}/` })),
    ...projects(lang).map((d) => ({ title: d.meta.title, sub: d.meta.summary, kind: "Project", href: `/projects/${d.meta.slug}/` })),
    ...guides(lang).map((d) => ({ title: d.meta.title, sub: d.meta.summary, kind: "Handbook", href: `/guides/${d.meta.slug}/` })),
    ...sheets(lang).map((d) => ({ title: d.meta.title, sub: d.meta.summary, kind: "Sheet", href: `/sheets/${d.meta.slug}/` })),
    ...glossary(lang).map((t) => ({ title: t.term, sub: t.definition, kind: "Term", href: t.href })),
  ];
  return Response.json(hits);
}
