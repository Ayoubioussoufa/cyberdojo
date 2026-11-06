/**
 * Combining two copies of someone's progress, and checking one that arrives at
 * the server. Pure functions, used on both sides and tested in check-auth.ts.
 */
import type { Card, Mistake, Store } from "./progress-types";

export const MAX_PROGRESS_BYTES = 2_000_000;

export const EMPTY_STORE: Store = { picks: {}, first: {}, written: {}, words: {}, done: {}, srs: {}, missions: {}, gates: {}, skills: {}, drills: {}, seen: {}, mistakes: [], days: {}, checks: {}, walk: {}, plan: null };

const earliest = (a: Record<string, string>, b: Record<string, string>) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = out[k] !== undefined && out[k] < v ? out[k] : v;
  return out;
};

const filled = (a: Record<string, string>, b: Record<string, string>) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) if (v.trim() || out[k] === undefined) out[k] = v;
  return out;
};

const furthest = (a: Record<string, Card>, b: Record<string, Card>) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const was = out[k];
    if (!was || v.due > was.due || (v.due === was.due && v.box > was.box)) out[k] = v;
  }
  return out;
};

/**
 * Nothing learned on either side is lost. `base` is the saved copy and `mine`
 * holds newer edits, so `mine` wins where a value can only be one thing.
 */
export function mergeStores(base: Store, mine: Store): Store {
  const drills = { ...base.drills };
  for (const [k, v] of Object.entries(mine.drills)) {
    const was = drills[k];
    drills[k] = { best: Math.max(was?.best ?? 0, v.best), plays: Math.max(was?.plays ?? 0, v.plays) };
  }
  const seen = { ...base.seen };
  for (const [k, v] of Object.entries(mine.seen)) seen[k] = [...new Set([...(seen[k] ?? []), ...v])];
  const days = { ...base.days };
  for (const [k, v] of Object.entries(mine.days)) days[k] = Math.max(days[k] ?? 0, v);
  const skills = { ...base.skills };
  for (const [k, v] of Object.entries(mine.skills)) skills[k] = Math.max(skills[k] ?? 0, v);
  const byKey = new Map<string, Mistake>();
  for (const m of [...mine.mistakes, ...base.mistakes]) if (!byKey.has(m.key)) byKey.set(m.key, m);
  return {
    picks: { ...base.picks, ...mine.picks },
    first: { ...mine.first, ...base.first },
    written: filled(base.written, mine.written),
    words: filled(base.words, mine.words),
    done: earliest(base.done, mine.done),
    srs: furthest(base.srs, mine.srs),
    missions: earliest(base.missions, mine.missions),
    gates: { ...base.gates, ...mine.gates },
    skills,
    drills,
    seen,
    mistakes: [...byKey.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 200),
    days,
    checks: earliest(base.checks, mine.checks),
    walk: { ...base.walk, ...mine.walk },
    plan: mine.plan ?? base.plan,
  };
}

const isMap = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const mapOf = (v: unknown, ok: (x: unknown) => boolean) => isMap(v) && Object.values(v).every(ok);
const isStr = (x: unknown) => typeof x === "string";
const isNum = (x: unknown) => typeof x === "number" && Number.isFinite(x);
const isBool = (x: unknown) => typeof x === "boolean";

/** Exactly the known fields with the right types, or null. Unknown keys never reach the database. */
export function cleanProgress(v: unknown): Store | null {
  if (!isMap(v)) return null;
  const s = { ...EMPTY_STORE, ...v } as Store;
  const fine =
    mapOf(s.picks, isNum) && mapOf(s.first, isBool) && mapOf(s.written, isStr) && mapOf(s.words, isStr) && mapOf(s.done, isStr) &&
    mapOf(s.missions, isStr) && mapOf(s.gates, isBool) && mapOf(s.walk, isBool) && mapOf(s.skills, isNum) && mapOf(s.days, isNum) && mapOf(s.checks, isStr) &&
    mapOf(s.srs, (c) => isMap(c) && isNum(c.box) && isStr(c.due)) &&
    mapOf(s.drills, (d) => isMap(d) && isNum(d.best) && isNum(d.plays)) &&
    mapOf(s.seen, (a) => Array.isArray(a) && a.every(isNum)) &&
    Array.isArray(s.mistakes) && s.mistakes.length <= 500 && s.mistakes.every((m) => isMap(m) && isStr(m.key) && isStr(m.date)) &&
    (s.plan === null || (isMap(s.plan) && isNum(s.plan.hours) && isStr(s.plan.start)));
  if (!fine) return null;
  const { picks, first, written, words, done, srs, missions, gates, skills, drills, seen, mistakes, days, checks, walk, plan } = s;
  return { picks, first, written, words, done, srs, missions, gates, skills, drills, seen, mistakes, days, checks, walk, plan };
}

export const hasProgress = (s: Store) =>
  [s.picks, s.done, s.missions, s.drills, s.checks, s.written, s.words, s.days].some((m) => Object.keys(m).length > 0) || s.mistakes.length > 0 || s.plan !== null;
