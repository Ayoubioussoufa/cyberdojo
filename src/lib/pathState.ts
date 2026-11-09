/** The path's shape, and how far along it someone is. Safe for the browser. */
import { BELTS, SKILL_LESSONS } from "@/data/path";
import type { Store } from "./progress";

export type StepKind = "lesson" | "handbook" | "machine" | "project" | "gate";

export interface PathStep {
  id: string;
  kind: StepKind;
  title: string;
  /** Why this comes now, or what it leaves you able to do. */
  note: string;
  href: string;
  minutes: number;
  month: number;
  /** Must be done to earn the next belt. Handbook pages are read, not graded. */
  required: boolean;
  /** Document slug, for lessons, handbook pages and machines. */
  slug?: string;
  /** Terminal stages of a machine. */
  missions?: string[];
  /** Checkpoints of a project part. */
  checks?: string[];
  /** Gate items, as store keys. */
  gates?: string[];
  number?: number;
  builds?: string;
}

export const KIND_LABEL: Record<StepKind, string> = {
  lesson: "Lesson",
  handbook: "Handbook",
  machine: "Machine",
  project: "Project",
  gate: "Exit gate",
};

export function isDone(s: PathStep, st: Store): boolean {
  if (s.kind === "gate") return (s.gates ?? []).length > 0 && (s.gates ?? []).every((k) => st.gates[k]);
  if (s.kind === "project") return (s.checks ?? []).length > 0 && (s.checks ?? []).every((k) => st.checks[k]);
  if (s.kind === "machine" && (s.missions ?? []).length > 0 && (s.missions ?? []).every((k) => st.missions[k])) return true;
  return !!(s.slug && st.done[s.slug]);
}

/** Partly finished work, from 0 to 1. */
export function partDone(s: PathStep, st: Store): number {
  if (isDone(s, st)) return 1;
  const count = (keys: string[] | undefined, has: (k: string) => boolean) => (keys?.length ? keys.filter(has).length / keys.length : 0);
  if (s.kind === "gate") return count(s.gates, (k) => !!st.gates[k]);
  if (s.kind === "project") return count(s.checks, (k) => !!st.checks[k]);
  if (s.kind === "machine") return count(s.missions, (k) => !!st.missions[k]);
  return 0;
}

export const nextStep = (path: PathStep[], st: Store) => path.find((s) => !isDone(s, st));

export function currentBelt(path: PathStep[], st: Store) {
  let at = 0;
  for (let i = 1; i < BELTS.length; i++) {
    const belt = BELTS[i] as (typeof BELTS)[number];
    const need = path.filter((s) => s.required && s.month <= belt.month);
    if (need.length && need.every((s) => isDone(s, st))) at = i;
    else break;
  }
  const next = BELTS[at + 1];
  const need = next ? path.filter((s) => s.required && s.month <= next.month) : [];
  const got = need.filter((s) => isDone(s, st)).length;
  return { belt: BELTS[at] as (typeof BELTS)[number], next, got, need: need.length };
}

export function streak(days: Store["days"], now: string) {
  const back = (iso: string) => {
    const d = new Date(`${iso}T12:00:00`);
    d.setDate(d.getDate() - 1);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  // A day that hasn't been used yet doesn't break the streak.
  let day = days[now] ? now : back(now);
  let n = 0;
  while (days[day]) {
    n++;
    day = back(day);
  }
  return n;
}

export function skillBars(path: PathStep[], st: Store) {
  const byNumber = new Map(path.filter((s) => s.kind === "lesson").map((s) => [s.number, s]));
  return Object.entries(SKILL_LESSONS).map(([area, nums]) => {
    const lessons = nums.flatMap((n) => byNumber.get(n) ?? []);
    const done = lessons.filter((l) => isDone(l, st)).length;
    return { area, done, total: lessons.length };
  });
}

/** What the steps up to next weekend add up to, at her pace. */
export function weekPlan(path: PathStep[], st: Store, hours: number) {
  const out: PathStep[] = [];
  let left = hours * 60;
  for (const s of path) {
    if (isDone(s, st)) continue;
    if (out.length && left < s.minutes * 0.5) break;
    out.push(s);
    left -= s.minutes;
    if (out.length >= 12) break;
  }
  return out;
}

/** Rough finish date. The plan assumes about 1,300 hours in all. */
export function finishDate(path: PathStep[], st: Store, hours: number, now = new Date(), lang: "en" | "fr" = "en") {
  const share = path.length ? path.filter((s) => !isDone(s, st)).length / path.length : 1;
  const weeks = Math.ceil((1300 * share) / Math.max(hours, 1));
  const d = new Date(now);
  d.setDate(d.getDate() + weeks * 7);
  return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { month: "long", year: "numeric" });
}
