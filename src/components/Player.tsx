"use client";

import { useState } from "react";
import { CopyButton } from "./Copy";
import type { Exercise } from "@/lib/drills";
import { addMistake, clearMistake } from "@/lib/progress";
import { drillMessage } from "@/lib/tutor";

export interface Outcome {
  right: boolean;
  /** What she answered, in words. */
  given: string;
  /** The right answer, in words. */
  answer: string;
  /** A specific note on why her pick was wrong. */
  whyNot?: string;
}

const inline = (s: string) => s.split(/(`[^`]+`)/).map((p, i) => (p.startsWith("`") && p.length > 1 ? <code key={i}>{p.slice(1, -1)}</code> : p));

const shuffleOnce = (n: number, seed: string) => {
  const a = Array.from({ length: n }, (_, i) => i);
  let x = [...seed].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7) || 1;
  for (let i = n - 1; i > 0; i--) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    const j = x % (i + 1);
    [a[i], a[j]] = [a[j] as number, a[i] as number];
  }
  return a;
};

function Choice({ ex, done, onAnswer }: { ex: Extract<Exercise, { kind: "choice" }>; done: Outcome | null; onAnswer: (o: Outcome) => void }) {
  return (
    <div className="opts">
      {ex.options.map((o, i) => {
        const cls = ["opt", done && i === ex.correct ? "right" : "", done && !done.right && done.given === o ? "wrong" : ""].filter(Boolean).join(" ");
        return (
          <button key={o} type="button" className={cls} disabled={!!done} onClick={() => onAnswer({ right: i === ex.correct, given: o, answer: ex.options[ex.correct] as string, whyNot: ex.whyNot?.[o] })}>
            <span className="opt-key" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
            <span className="noterms">{inline(o)}</span>
          </button>
        );
      })}
    </div>
  );
}

function TypeIn({ ex, done, onAnswer }: { ex: Extract<Exercise, { kind: "input" }>; done: Outcome | null; onAnswer: (o: Outcome) => void }) {
  const [typed, setTyped] = useState("");
  return (
    <form
      className="drill-input"
      onSubmit={(e) => {
        e.preventDefault();
        const t = typed.trim();
        if (t && !done) onAnswer({ right: ex.accept(t), given: t, answer: ex.answer });
      }}
    >
      <input value={typed} disabled={!!done} onChange={(e) => setTyped(e.target.value)} placeholder={ex.placeholder} aria-label="Your answer" autoComplete="off" autoCapitalize="off" spellCheck={false} />
      <button type="submit" className="btn" disabled={!!done || !typed.trim()}>Check</button>
    </form>
  );
}

function Spot({ ex, done, onAnswer }: { ex: Extract<Exercise, { kind: "spot" }>; done: Outcome | null; onAnswer: (o: Outcome) => void }) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className={`spot${ex.code ? " code" : ""}`}>
      {ex.lines.map((l, i) => {
        const cls = ["spot-line", done && i === ex.correct ? "right" : "", done && pick === i && i !== ex.correct ? "wrong" : ""].filter(Boolean).join(" ");
        return (
          <button
            key={i}
            type="button"
            className={cls}
            disabled={!!done}
            onClick={() => {
              setPick(i);
              onAnswer({ right: i === ex.correct, given: l, answer: ex.lines[ex.correct] as string, whyNot: ex.notes[i] });
            }}
          >
            <span className="spot-n" aria-hidden="true">{i + 1}</span>
            <code>{l || " "}</code>
          </button>
        );
      })}
    </div>
  );
}

function Order({ ex, done, onAnswer }: { ex: Extract<Exercise, { kind: "order" }>; done: Outcome | null; onAnswer: (o: Outcome) => void }) {
  const [shown] = useState(() => shuffleOnce(ex.items.length, ex.prompt));
  const [placed, setPlaced] = useState<number[]>([]);
  const finish = (seq: number[]) => {
    const right = seq.every((v, i) => v === i);
    onAnswer({ right, given: seq.map((i) => ex.items[i]).join(" → "), answer: ex.items.join(" → ") });
  };
  return (
    <div className="order">
      <ol className="order-placed" aria-label="Your order">
        {ex.items.map((_, i) => {
          const v = placed[i];
          const state = done && v !== undefined ? (v === i ? "right" : "wrong") : "";
          return (
            <li key={i} className={state}>
              <span className="spot-n" aria-hidden="true">{i + 1}</span>
              {v === undefined ? <span className="muted">Tap a step below</span> : <span>{inline(ex.items[v] as string)}</span>}
              {v !== undefined && !done && (
                <button type="button" className="link-btn" onClick={() => setPlaced(placed.filter((_, k) => k !== i))} aria-label="Remove this step">Undo</button>
              )}
            </li>
          );
        })}
      </ol>
      {!done && (
        <div className="order-pool">
          {shown.filter((i) => !placed.includes(i)).map((i) => (
            <button
              key={i}
              type="button"
              className="chip"
              onClick={() => {
                const seq = [...placed, i];
                setPlaced(seq);
                if (seq.length === ex.items.length) finish(seq);
              }}
            >
              {inline(ex.items[i] as string)}
            </button>
          ))}
        </div>
      )}
      {done && !done.right && (
        <ol className="order-answer">
          {ex.items.map((it, i) => <li key={i}><strong>{inline(it)}</strong>{ex.notes?.[i] ? <span> {inline(ex.notes[i] as string)}</span> : null}</li>)}
        </ol>
      )}
    </div>
  );
}

function Multi({ ex, done, onAnswer }: { ex: Extract<Exercise, { kind: "multi" }>; done: Outcome | null; onAnswer: (o: Outcome) => void }) {
  const [on, setOn] = useState<number[]>([]);
  const list = (ids: number[]) => ids.map((i) => ex.options[i]).join("; ");
  return (
    <div>
      <p className="meta">Select every one that applies, then check.</p>
      <div className="opts">
        {ex.options.map((o, i) => {
          const chosen = on.includes(i);
          const should = ex.correct.includes(i);
          const cls = ["opt", chosen ? "picked" : "", done && should ? "right" : "", done && chosen && !should ? "wrong" : ""].filter(Boolean).join(" ");
          return (
            <button key={o} type="button" className={cls} disabled={!!done} aria-pressed={chosen} onClick={() => setOn(chosen ? on.filter((x) => x !== i) : [...on, i])}>
              <span className="opt-key" aria-hidden="true">{chosen ? "✓" : ""}</span>
              <span>
                <span className="noterms">{inline(o)}</span>
                {done && <span className="opt-note">{inline(ex.notes[i] as string)}</span>}
              </span>
            </button>
          );
        })}
      </div>
      {!done && (
        <button
          type="button"
          className="btn primary"
          disabled={on.length === 0}
          onClick={() => {
            const right = on.length === ex.correct.length && on.every((i) => ex.correct.includes(i));
            onAnswer({ right, given: list(on), answer: list(ex.correct) });
          }}
        >
          Check
        </button>
      )}
    </div>
  );
}

function Build({ ex, done, onAnswer }: { ex: Extract<Exercise, { kind: "build" }>; done: Outcome | null; onAnswer: (o: Outcome) => void }) {
  const [shown] = useState(() => shuffleOnce(ex.tokens.length, ex.prompt));
  const [placed, setPlaced] = useState<number[]>([]);
  const [output, setOutput] = useState<string | null>(null);
  const cmd = placed.map((i) => ex.tokens[i]).join(" ");
  const run = () => {
    const sh = ex.setup();
    const out = sh.exec(cmd, "", sh.creds);
    setOutput(out.terminal || "(no output)");
    onAnswer({ right: out.stdout.trim() === ex.expected.trim(), given: cmd, answer: ex.solution });
  };
  return (
    <div className="order">
      <p className="build-line"><span className="term-prompt">$</span> <code>{cmd || "Tap the pieces below, in order"}</code></p>
      {!done && (
        <>
          <div className="order-pool">
            {shown.filter((i) => !placed.includes(i)).map((i) => (
              <button key={i} type="button" className="chip mono" onClick={() => setPlaced([...placed, i])}>{ex.tokens[i]}</button>
            ))}
          </div>
          <div className="build-actions">
            <button type="button" className="btn primary" disabled={placed.length === 0} onClick={run}>Run it</button>
            <button type="button" className="link-btn" disabled={placed.length === 0} onClick={() => setPlaced(placed.slice(0, -1))}>Undo the last piece</button>
          </div>
        </>
      )}
      {output !== null && <pre className="build-out">{output}</pre>}
    </div>
  );
}

function Why({ ex, out, onNext, last }: { ex: Exercise; out: Outcome; onNext: () => void; last: boolean }) {
  return (
    <div className={`why ${out.right ? "ok" : "no"}`}>
      {out.right ? (
        <p><strong>Right.</strong> {inline(ex.why)}</p>
      ) : (
        <>
          <p><strong>Not quite.</strong> You answered: <span className="given">{inline(out.given)}</span></p>
          {out.whyNot && <p><strong>Why not:</strong> {inline(out.whyNot)}</p>}
          {ex.kind !== "order" && <p><strong>Right answer:</strong> {inline(out.answer)}</p>}
          <p><strong>Why:</strong> {inline(ex.why)}</p>
        </>
      )}
      <div className="why-actions">
        {!out.right && <CopyButton className="link-btn" label="Ask my AI to teach this" done="Copied" build={() => drillMessage(ex.prompt, out.answer, out.given, ex.why)} />}
        <button type="button" className="btn primary sm" onClick={onNext}>{last ? "See my score" : "Next"}</button>
      </div>
    </div>
  );
}

/** Plays a list of exercises of any kind, and explains every answer. */
export function Player({ source, exercises, onFinish, onAgain, retry }: { source: string; exercises: Exercise[]; onFinish: (right: number) => void; onAgain: () => void; retry?: boolean }) {
  const [at, setAt] = useState(0);
  const [out, setOut] = useState<Outcome | null>(null);
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState<{ ex: Exercise; out: Outcome }[]>([]);
  const [over, setOver] = useState(false);
  const ex = exercises[at];

  if (over || !ex) {
    const total = exercises.length;
    return (
      <div className="drill-over">
        <p className="drill-score"><strong>{right} / {total}</strong> {right === total ? "A perfect round." : right >= total * 0.75 ? "Solid. Come back tomorrow and it will stick." : "Good: every miss below is something you've now seen properly."}</p>
        {wrong.length > 0 && (
          <div className="missed">
            <p className="band">What to look at again</p>
            {wrong.map((w, i) => (
              <div key={i} className="missed-item">
                <p className="mono-pre">{w.ex.prompt}</p>
                <p><strong>Answer:</strong> {inline(w.out.answer)}</p>
                <p className="muted">{inline(w.ex.why)}</p>
              </div>
            ))}
          </div>
        )}
        <button type="button" className="btn primary" onClick={onAgain}>Another round</button>
      </div>
    );
  }

  const answered = (o: Outcome) => {
    setOut(o);
    const key = `${source}:${ex.prompt.slice(0, 120)}`;
    if (o.right) {
      setRight(right + 1);
      if (retry) clearMistake(key);
    } else {
      setWrong([...wrong, { ex, out: o }]);
      addMistake({ key, source, prompt: ex.prompt, right: o.answer, given: o.given, why: ex.why, ...(ex.kind === "choice" ? { options: ex.options } : {}) });
    }
  };
  const next = () => {
    if (at + 1 >= exercises.length) {
      setOver(true);
      onFinish(right);
    } else {
      setAt(at + 1);
      setOut(null);
    }
  };

  return (
    <div>
      <div className="drill-bar" aria-hidden="true"><span style={{ width: `${((at + (out ? 1 : 0)) / exercises.length) * 100}%` }} /></div>
      <p className="drill-count">Question {at + 1} of {exercises.length} · {right} right</p>
      <p className="qcard-prompt mono-pre noterms">{inline(ex.prompt)}</p>
      {ex.kind === "choice" && <Choice key={at} ex={ex} done={out} onAnswer={answered} />}
      {ex.kind === "input" && <TypeIn key={at} ex={ex} done={out} onAnswer={answered} />}
      {ex.kind === "spot" && <Spot key={at} ex={ex} done={out} onAnswer={answered} />}
      {ex.kind === "order" && <Order key={at} ex={ex} done={out} onAnswer={answered} />}
      {ex.kind === "multi" && <Multi key={at} ex={ex} done={out} onAnswer={answered} />}
      {ex.kind === "build" && <Build key={at} ex={ex} done={out} onAnswer={answered} />}
      {out && <Why ex={ex} out={out} onNext={next} last={at + 1 >= exercises.length} />}
    </div>
  );
}
