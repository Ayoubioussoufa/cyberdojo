/**
 * Everything the learner does. It lives in this browser's localStorage, and
 * account.ts copies it to the server for anyone signed in.
 */
"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_STORE as EMPTY } from "./merge";
import type { Card, Mistake, Store } from "./progress-types";

const KEY = "cyberdojo-v1";

export type { Card, Mistake, Store } from "./progress-types";


/** The live copy. localStorage is written a moment later, so typing stays instant. */
let state: Store | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_MS = 250;

function parse(raw: string | null): Store {
  if (raw === null) return EMPTY;
  try {
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Store>) };
  } catch {
    return EMPTY;
  }
}

function read(): Store {
  if (state) return state;
  try {
    state = parse(localStorage.getItem(KEY));
  } catch {
    state = EMPTY;
  }
  return state;
}

function flush() {
  if (flushTimer !== null) clearTimeout(flushTimer);
  flushTimer = null;
  if (!state) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: the page still works, it just won't remember.
  }
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

const editListeners = new Set<() => void>();

function write(next: Store) {
  state = next;
  if (flushTimer === null) flushTimer = setTimeout(flush, FLUSH_MS);
  notify();
  editListeners.forEach((fn) => fn());
}

/** Called after the learner changes something, not when a saved copy is loaded in. */
export function onEdit(fn: () => void) {
  editListeners.add(fn);
  return () => {
    editListeners.delete(fn);
  };
}

/** Swaps in a copy from the server, or an empty store after signing out. */
export function replaceStore(next: Store) {
  state = next;
  flush();
  notify();
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
  // Another tab saved: take its copy.
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    state = parse(e.newValue);
    notify();
  });
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export const useStore = (): Store => useSyncExternalStore(subscribe, read, () => EMPTY);

/** Re-renders only when the picked value changes. Pick a primitive or a stored object. */
export const useSlice = <T,>(pick: (s: Store) => T): T =>
  useSyncExternalStore(subscribe, () => pick(read()), () => pick(EMPTY));

/** The store right now, for click handlers that shouldn't subscribe. */
export const getStore = read;

export const today = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Days until the next review, by box. Spacing is what builds long-term memory. */
export const INTERVALS = [1, 3, 7, 14, 30, 60, 120];

function schedule(srs: Record<string, Card>, id: string, right: boolean) {
  const box = right ? Math.min((srs[id]?.box ?? -1) + 1, INTERVALS.length - 1) : 0;
  return { ...srs, [id]: { box, due: addDays(today(), right ? (INTERVALS[box] as number) : 1) } };
}

const tick = (days: Store["days"]) => ({ ...days, [today()]: (days[today()] ?? 0) + 1 });

export function answer(id: string, option: number, right: boolean) {
  const s = read();
  write({
    ...s,
    days: tick(s.days),
    picks: { ...s.picks, [id]: option },
    first: id in s.first ? s.first : { ...s.first, [id]: right },
    srs: id in s.srs ? s.srs : schedule(s.srs, id, right),
  });
}

export function reviewed(id: string, right: boolean) {
  const s = read();
  write({ ...s, days: tick(s.days), srs: schedule(s.srs, id, right) });
}

/** One finished exercise round. */
export function roundDone(id: string, right: number, total: number) {
  const s = read();
  const was = s.drills[id];
  const score = total ? right / total : 0;
  write({ ...s, days: tick(s.days), drills: { ...s.drills, [id]: { best: Math.max(was?.best ?? 0, score), plays: (was?.plays ?? 0) + 1 } } });
}

export function markSeen(id: string, rows: number[], deck: number) {
  const s = read();
  const all = [...new Set([...(s.seen[id] ?? []), ...rows])];
  write({ ...s, seen: { ...s.seen, [id]: all.length >= deck ? [] : all } });
}

export function addMistake(m: Omit<Mistake, "date">) {
  const s = read();
  const rest = s.mistakes.filter((x) => x.key !== m.key);
  write({ ...s, mistakes: [{ ...m, date: today() }, ...rest].slice(0, 200) });
}

export function clearMistake(key: string) {
  const s = read();
  write({ ...s, mistakes: s.mistakes.filter((x) => x.key !== key) });
}

export function setCheck(key: string, on: boolean) {
  const s = read();
  const checks = { ...s.checks };
  if (on) checks[key] = today();
  else delete checks[key];
  write({ ...s, days: on ? tick(s.days) : s.days, checks });
}

export function setPlan(hours: number, start: string) {
  write({ ...read(), plan: { hours, start } });
}

export function setWritten(id: string, text: string) {
  const s = read();
  write({ ...s, written: { ...s.written, [id]: text } });
}

export function setWord(key: string, text: string) {
  const s = read();
  write({ ...s, words: { ...s.words, [key]: text } });
}

export function setDone(slug: string, done: boolean) {
  const s = read();
  const next = { ...s.done };
  if (done) next[slug] = today();
  else delete next[slug];
  write({ ...s, days: done ? tick(s.days) : s.days, done: next });
}

export function setMission(id: string) {
  const s = read();
  if (!s.missions[id]) write({ ...s, days: tick(s.days), missions: { ...s.missions, [id]: today() } });
}

export function setGate(key: string, on: boolean) {
  const s = read();
  write({ ...s, gates: { ...s.gates, [key]: on } });
}

export function setSkill(area: string, score: number) {
  const s = read();
  write({ ...s, skills: { ...s.skills, [area]: score } });
}

export const exportStore = () => JSON.stringify(read(), null, 1);

export function importStore(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as Partial<Store>;
    if (typeof parsed !== "object" || parsed === null || !("picks" in parsed)) return false;
    write({ ...EMPTY, ...parsed });
    return true;
  } catch {
    return false;
  }
}
