"use client";

import { useState } from "react";
import { Player } from "./Player";
import type { Exercise } from "@/lib/drills";
import { clearMistake, useStore, type Mistake } from "@/lib/progress";
import { fill, plural, useLang } from "@/i18n/LangProvider";

const asExercise = (m: Mistake): Exercise | null =>
  m.options ? { kind: "choice", prompt: m.prompt, options: m.options, correct: m.options.indexOf(m.right), why: m.why } : null;

/** Everything she got wrong, kept until she gets it right. */
export function Mistakes() {
  const store = useStore();
  const { lang, t } = useLang();
  const [round, setRound] = useState<Exercise[] | null>(null);
  const list = store.mistakes;
  const retry = list.flatMap((m) => asExercise(m) ?? []).slice(0, 10);
  if (round) return <section className="drill"><Player source="retry" retry exercises={round} onFinish={() => undefined} onAgain={() => setRound(null)} /></section>;
  if (!list.length) return <div className="card"><p className="band">{t.mistakes.clear}</p><p className="muted">{t.mistakes.empty}</p></div>;
  return (
    <>
      {retry.length > 0 && <button type="button" className="btn primary lg" onClick={() => setRound(retry)}>{plural(lang, t.mistakes.retry, retry.length)}</button>}
      <ul className="mistake-list">
        {list.map((m) => (
          <li key={m.key} className="card">
            <p className="mono-pre mistake-q">{m.prompt}</p>
            <p><strong>{t.mistakes.given}</strong> {m.given}</p>
            <p><strong>{t.mistakes.right}</strong> {m.right}</p>
            <p className="muted">{m.why}</p>
            <button type="button" className="link-btn" onClick={() => clearMistake(m.key)}>{t.mistakes.got}</button>
          </li>
        ))}
      </ul>
    </>
  );
}
