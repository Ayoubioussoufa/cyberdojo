/** Deals a round: never the same question twice, and unseen rows come first. */
import { Rng } from "@/lib/rng";
import type { DrillDef, Exercise } from "./index";

export interface Dealt {
  exercises: Exercise[];
  /** Which rows of the deck were used. */
  rows: number[];
}

export function deal(d: DrillDef, size: number, seed: number, seen: number[] = []): Dealt {
  const rng = new Rng(seed);
  if (d.deck) {
    const all = rng.shuffle(Array.from({ length: d.deck }, (_, i) => i));
    const fresh = all.filter((i) => !seen.includes(i));
    const old = all.filter((i) => seen.includes(i));
    const rows = [...fresh, ...old].slice(0, size);
    return { exercises: rows.map((i) => d.make(rng, i)), rows };
  }
  const exercises: Exercise[] = [];
  const prompts = new Set<string>();
  for (let tries = 0; exercises.length < size && tries < size * 25; tries++) {
    const ex = d.make(rng);
    if (prompts.has(ex.prompt)) continue;
    prompts.add(ex.prompt);
    exercises.push(ex);
  }
  return { exercises, rows: [] };
}
