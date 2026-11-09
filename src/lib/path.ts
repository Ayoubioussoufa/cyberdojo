/** Builds the one ordered list of steps that the roadmap, Today and Progress all read. */
import { PLACEMENT, type Placed } from "@/data/path";
import { getGuide, getMachine, lessons, projects } from "./content";
import { MONTHS, PROJECTS } from "./data";
import { MISSIONS_MACHINES } from "./missions/machines";
import type { PathStep } from "./pathState";
import { fill, type Lang } from "@/i18n/lang";
import { UI } from "@/i18n/ui";
import { WHY_FR } from "@/data/fr/path";

const cached: Partial<Record<Lang, PathStep[]>> = {};

function placed(p: Placed, month: number, lang: Lang): PathStep[] {
  const [kind, slug, part] = p.ref.split(":") as [string, string, string?];
  const why = (lang === "fr" && WHY_FR[p.ref]) || p.why;
  if (kind === "guide") {
    const d = getGuide(slug, lang);
    if (!d) throw new Error(`path: no guide ${slug}`);
    return [{ id: p.ref, kind: "handbook", title: d.meta.title, note: why, href: `/guides/${slug}/`, minutes: d.meta.minutes, month, required: false, slug }];
  }
  if (kind === "machine") {
    const d = getMachine(slug, lang);
    if (!d) throw new Error(`path: no machine ${slug}`);
    const missions = MISSIONS_MACHINES[slug]?.missions.map((m) => m.id) ?? [];
    return [{ id: p.ref, kind: "machine", title: d.meta.title, note: why, href: `/machines/${slug}/`, minutes: d.meta.minutes, month, required: false, slug, missions }];
  }
  const t = UI[lang].path;
  const doc = projects(lang).find((d) => d.meta.slug === slug);
  const data = PROJECTS.find((x) => x.id === slug);
  const parts = doc?.meta.parts ?? [];
  const n = Number(part ?? 1);
  const span = parts[n - 1];
  const checks = doc?.checks.filter((c) => !span || (c.step >= span.from && c.step <= span.to)).map((c) => c.id) ?? [];
  const steps = span ? (span.from === span.to ? fill(t.step, { n: span.from }) : fill(t.steps, { from: span.from, to: span.to })) : "";
  const label = parts.length > 1 ? `${slug}, ${steps}` : slug;
  return [{ id: p.ref, kind: "project", title: `${label}: ${(lang === "fr" && doc?.meta.lang === "fr" ? doc.meta.title : data?.title) ?? slug}`, note: why, href: `/projects/${slug}/${span ? `#step-${span.from}` : ""}`, minutes: (span?.hours ?? doc?.meta.hours ?? 10) * 60, month, required: true, checks }];
}

export function buildPath(lang: Lang = "en"): PathStep[] {
  const hit = cached[lang];
  if (hit && process.env.NODE_ENV === "production") return hit;
  const t = UI[lang];
  const all = lessons(lang);
  const out: PathStep[] = [];
  for (let month = 0; month <= 24; month++) {
    const place = PLACEMENT[month] ?? {};
    for (const p of place.before ?? []) out.push(...placed(p, month, lang));
    for (const d of all.filter((l) => l.meta.month === month)) {
      const m = d.meta;
      out.push({ id: `lesson:${m.slug}`, kind: "lesson", title: m.title, note: m.builds ? fill(t.step.youll, { builds: m.builds }) : m.summary, href: `/courses/${m.slug}/`, minutes: m.minutes, month, required: true, slug: m.slug, number: m.number, ...(m.builds ? { builds: m.builds } : {}) });
    }
    for (const p of place.after ?? []) out.push(...placed(p, month, lang));
    const info = month > 0 ? MONTHS[month - 1] : undefined;
    if (info?.gate?.length) {
      out.push({ id: `gate:${month}`, kind: "gate", title: fill(t.step.gateTitle, { n: month }), note: t.step.gateNote, href: `/roadmap/${month}/#gate`, minutes: 60, month, required: true, gates: info.gate.map((_, i) => `m${month}-${i}`) });
    }
  }
  cached[lang] = out;
  return out;
}

/** The step after this document on the path, for the end of each page. */
export function stepAfter(href: string, lang: Lang = "en"): PathStep | null {
  const path = buildPath(lang);
  const i = path.findLastIndex((s) => s.href.split("#")[0] === href);
  return i >= 0 ? (path[i + 1] ?? null) : null;
}
