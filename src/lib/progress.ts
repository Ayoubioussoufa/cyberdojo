/**
 * Everything the learner does, kept in this browser's localStorage. Nothing
 * leaves the machine; /you can export it to a file and bring it back.
 */
"use client";

import { useSyncExternalStore } from "react";

const KEY = "cyberdojo-v1";
const EVENT = "cyberdojo-changed";

export interface Card {
  box: number;
  /** yyyy-mm-dd. */
  due: string;
}

export interface Store {
  picks: Record<string, number>;
  /** Question id → the first answer was right. */
  first: Record<string, boolean>;
  written: Record<string, string>;
  words: Record<string, string>;
  done: Record<string, string>;
  srs: Record<string, Card>;
  missions: Record<string, string>;
  gates: Record<string, boolean>;
  skills: Record<string, number>;
}

const EMPTY: Store = { picks: {}, first: {}, written: {}, words: {}, done: {}, srs: {}, missions: {}, gates: {}, skills: {} };

let cacheRaw: string | null = null;
let cacheValue: Store = EMPTY;

function read(): Store {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cacheValue = raw === null ? EMPTY : { ...EMPTY, ...(JSON.parse(raw) as Partial<Store>) };
    } catch {
      cacheValue = EMPTY;
    }
  }
  return cacheValue;
}

function write(next: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the page still works, it just won't remember.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(fn: () => void) {
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("storage", fn);
  };
}

export const useStore = (): Store => useSyncExternalStore(subscribe, read, () => EMPTY);

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

export function answer(id: string, option: number, right: boolean) {
  const s = read();
  write({
    ...s,
    picks: { ...s.picks, [id]: option },
    first: id in s.first ? s.first : { ...s.first, [id]: right },
    srs: id in s.srs ? s.srs : schedule(s.srs, id, right),
  });
}

export function reviewed(id: string, right: boolean) {
  const s = read();
  write({ ...s, srs: schedule(s.srs, id, right) });
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
  write({ ...s, done: next });
}

export function setMission(id: string) {
  const s = read();
  if (!s.missions[id]) write({ ...s, missions: { ...s.missions, [id]: today() } });
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
