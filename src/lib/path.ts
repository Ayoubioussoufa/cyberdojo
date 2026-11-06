/** Builds the one ordered list of steps that the roadmap, Today and Progress all read. */
import { PLACEMENT, type Placed } from "@/data/path";
import { getGuide, getMachine, lessons, projects } from "./content";
import { MONTHS, PROJECTS } from "./data";
import { MISSIONS_MACHINES } from "./missions/machines";
import type { PathStep } from "./pathState";

let cached: PathStep[] | null = null;

function placed(p: Placed, month: number): PathStep[] {
  const [kind, slug, part] = p.ref.split(":") as [string, string, string?];
  if (kind === "guide") {
    const d = getGuide(slug);
    if (!d) throw new Error(`path: no guide ${slug}`);
    return [{ id: p.ref, kind: "handbook", title: d.meta.title, note: p.why, href: `/guides/${slug}/`, minutes: d.meta.minutes, month, required: false, slug }];
  }
  if (kind === "machine") {
    const d = getMachine(slug);
    if (!d) throw new Error(`path: no machine ${slug}`);
    const missions = MISSIONS_MACHINES[slug]?.missions.map((m) => m.id) ?? [];
    return [{ id: p.ref, kind: "machine", title: d.meta.title, note: p.why, href: `/machines/${slug}/`, minutes: d.meta.minutes, month, required: false, slug, missions }];
  }
  const doc = projects().find((d) => d.meta.slug === slug);
  const data = PROJECTS.find((x) => x.id === slug);
  const parts = doc?.meta.parts ?? [];
  const n = Number(part ?? 1);
  const span = parts[n - 1];
  const checks = doc?.checks.filter((c) => !span || (c.step >= span.from && c.step <= span.to)).map((c) => c.id) ?? [];
  const steps = span ? (span.from === span.to ? `step ${span.from}` : `steps ${span.from}–${span.to}`) : "";
  const label = parts.length > 1 ? `${slug}, ${steps}` : slug;
  return [{ id: p.ref, kind: "project", title: `${label}: ${data?.title ?? slug}`, note: p.why, href: `/projects/${slug}/${span ? `#step-${span.from}` : ""}`, minutes: (span?.hours ?? doc?.meta.hours ?? 10) * 60, month, required: true, checks }];
}

export function buildPath(): PathStep[] {
  if (cached && process.env.NODE_ENV === "production") return cached;
  const all = lessons();
  const out: PathStep[] = [];
  for (let month = 0; month <= 24; month++) {
    const place = PLACEMENT[month] ?? {};
    for (const p of place.before ?? []) out.push(...placed(p, month));
    for (const d of all.filter((l) => l.meta.month === month)) {
      const m = d.meta;
      out.push({ id: `lesson:${m.slug}`, kind: "lesson", title: m.title, note: m.builds ? `You'll ${m.builds}.` : m.summary, href: `/courses/${m.slug}/`, minutes: m.minutes, month, required: true, slug: m.slug, number: m.number, ...(m.builds ? { builds: m.builds } : {}) });
    }
    for (const p of place.after ?? []) out.push(...placed(p, month));
    const info = month > 0 ? MONTHS[month - 1] : undefined;
    if (info?.gate?.length) {
      out.push({ id: `gate:${month}`, kind: "gate", title: `Month ${month} exit gate`, note: "Prove it without notes or AI, then move on.", href: `/roadmap/${month}/#gate`, minutes: 60, month, required: true, gates: info.gate.map((_, i) => `m${month}-${i}`) });
    }
  }
  cached = out;
  return out;
}

/** The step after this document on the path, for the end of each page. */
export function stepAfter(href: string): PathStep | null {
  const path = buildPath();
  const i = path.findIndex((s) => s.href === href);
  return i >= 0 ? (path[i + 1] ?? null) : null;
}
