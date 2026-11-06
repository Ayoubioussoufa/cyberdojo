"use client";

import { useState } from "react";
import { CopyButton } from "./Copy";
import { DRILLS, type Exercise } from "@/lib/drills";
import { freshSeed, Rng } from "@/lib/rng";
import { drillMessage } from "@/lib/tutor";

const ROUND = 8;

/** Fresh exercises each round: new numbers, so memorising answers doesn't work. */
export function Drill({ id, roundSize = ROUND }: { id: string; roundSize?: number }) {
  const drill = DRILLS[id];
  const [ex, setEx] = useState<Exercise | null>(null);
  const [asked, setAsked] = useState(0);
  const [right, setRight] = useState(0);
  const [typed, setTyped] = useState("");
  const [given, setGiven] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [over, setOver] = useState(false);

  if (!drill) return <p className="muted">Drill {id} is missing.</p>;

  const next = () => {
    setEx(drill.make(new Rng(freshSeed())));
    setAsked((n) => n + 1);
    setTyped("");
    setGiven(null);
    setOk(false);
  };
  const start = () => {
    setRight(0);
    setAsked(0);
    setOver(false);
    next();
  };
  const grade = (correct: boolean, text: string) => {
    if (given !== null) return;
    setGiven(text);
    setOk(correct);
    if (correct) setRight((n) => n + 1);
  };
  const rightAnswer = ex ? (ex.kind === "choice" ? (ex.options[ex.correct] as string) : ex.answer) : "";

  return (
    <section className="drill">
      <span className="band">Practice · new exercises every round</span>
      <h3 className="noterms">{drill.title}</h3>
      <p className="muted noterms">{drill.blurb}</p>
      {!ex && !over && <button type="button" className="btn primary" onClick={start}>Start a round of {roundSize}</button>}
      {over && (
        <div className="drill-over">
          <p><strong>{right} / {roundSize}</strong> {right === roundSize ? "Perfect round." : right >= roundSize * 0.75 ? "Solid. Come back tomorrow and it will stick." : "Do another round: repetition is the method here."}</p>
          <button type="button" className="btn primary" onClick={start}>Another round</button>
        </div>
      )}
      {ex && !over && (
        <div>
          <div className="drill-bar" aria-hidden="true"><span style={{ width: `${(asked / roundSize) * 100}%` }} /></div>
          <p className="drill-count">Exercise {asked} of {roundSize} · {right} right</p>
          <p className="qcard-prompt mono-pre noterms">{ex.prompt}</p>
          {ex.kind === "choice" ? (
            <div className="opts">
              {ex.options.map((o, i) => {
                const cls = ["opt", given !== null && i === ex.correct ? "right" : "", given === o && !ok ? "wrong" : ""].filter(Boolean).join(" ");
                return (
                  <button key={o} type="button" className={cls} disabled={given !== null} onClick={() => grade(i === ex.correct, o)}>
                    <span className="opt-key" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                    <span className="noterms">{o}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <form
              className="drill-input"
              onSubmit={(e) => {
                e.preventDefault();
                if (typed.trim()) grade(ex.accept(typed.trim()), typed.trim());
              }}
            >
              <input value={typed} disabled={given !== null} onChange={(e) => setTyped(e.target.value)} placeholder={ex.placeholder} aria-label="Your answer" autoComplete="off" spellCheck={false} />
              <button type="submit" className="btn" disabled={given !== null || !typed.trim()}>Check</button>
            </form>
          )}
          {given !== null && (
            <div className={`why ${ok ? "ok" : "no"}`}>
              <strong>{ok ? "Right." : `Answer: ${rightAnswer}.`}</strong> <span>{ex.why}</span>
              <div className="why-actions">
                {!ok && <CopyButton className="link-btn" label="Ask my AI to teach this" done="Copied" build={() => drillMessage(ex.prompt, rightAnswer, given, ex.why)} />}
                <button type="button" className="btn primary sm" onClick={() => (asked >= roundSize ? setOver(true) : next())}>
                  {asked >= roundSize ? "See my score" : "Next"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
