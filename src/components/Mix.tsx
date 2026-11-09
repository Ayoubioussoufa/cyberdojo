"use client";

import { useState } from "react";
import { Player } from "./Player";
import { DRILL_LIST, type Exercise } from "@/lib/drills";
import { deal } from "@/lib/drills/deal";
import { nextStep, type PathStep } from "@/lib/pathState";
import { roundDone, useStore } from "@/lib/progress";
import { freshSeed, Rng } from "@/lib/rng";
import { fill, plural, useLang } from "@/i18n/LangProvider";

const SIZE = 10;

/** Ten questions across everything she has reached. Mixing topics strengthens memory. */
export function Mix({ path }: { path: PathStep[] }) {
  const store = useStore();
  const { t } = useLang();
  const [round, setRound] = useState<{ n: number; exercises: Exercise[] } | null>(null);
  const month = nextStep(path, store)?.month ?? 24;
  const pool = DRILL_LIST.filter((d) => d.month <= Math.max(month, 1));
  const start = () => {
    const rng = new Rng(freshSeed());
    const picks = rng.shuffle(pool).slice(0, SIZE);
    const exercises = picks.flatMap((d) => deal(d, 1, rng.int(1, 1_000_000_000), store.seen[d.id] ?? []).exercises);
    setRound({ n: (round?.n ?? 0) + 1, exercises });
  };
  return round ? (
    <Player key={round.n} source="mix" exercises={round.exercises} onFinish={(r) => roundDone("mix", r, round.exercises.length)} onAgain={start} />
  ) : (
    <div className="card">
      <p className="muted">{fill(t.mix.text, { n: pool.length })}</p>
      <button type="button" className="btn primary lg" onClick={start}>{t.mix.start}</button>
    </div>
  );
}
