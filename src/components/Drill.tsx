"use client";

import { useState } from "react";
import { Player } from "./Player";
import { DRILLS, type Exercise } from "@/lib/drills";
import { deal } from "@/lib/drills/deal";
import { markSeen, roundDone, useStore } from "@/lib/progress";
import { freshSeed } from "@/lib/rng";

const ROUND = 8;

/** A round of exercises: no repeats, and each answer is explained. */
export function Drill({ id, roundSize = ROUND }: { id: string; roundSize?: number }) {
  const drill = DRILLS[id];
  const store = useStore();
  const [round, setRound] = useState<{ n: number; exercises: Exercise[] } | null>(null);
  if (!drill) return <p className="muted">Drill {id} is missing.</p>;
  const size = Math.min(roundSize, drill.deck ?? roundSize);
  const best = store.drills[id];
  const start = () => {
    const d = deal(drill, size, freshSeed(), store.seen[id] ?? []);
    if (drill.deck) markSeen(id, d.rows, drill.deck);
    setRound({ n: (round?.n ?? 0) + 1, exercises: d.exercises });
  };
  return (
    <section className="drill">
      <span className="band">Practice, {drill.deck ? `${drill.deck} questions in rotation` : "new numbers every round"}</span>
      <h3 className="noterms">{drill.title}</h3>
      <p className="muted noterms">{drill.blurb}</p>
      {round ? (
        <Player key={round.n} source={id} exercises={round.exercises} onFinish={(r) => roundDone(id, r, round.exercises.length)} onAgain={start} />
      ) : (
        <>
          <button type="button" className="btn primary" onClick={start}>Start a round of {size}</button>
          {best && <p className="meta drill-best">Best round: {Math.round(best.best * 100)}%, played {best.plays} time{best.plays === 1 ? "" : "s"}</p>}
        </>
      )}
    </section>
  );
}
