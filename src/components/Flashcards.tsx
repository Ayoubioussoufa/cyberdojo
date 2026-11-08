"use client";

import Link from "@/components/HoverLink";
import { useEffect, useMemo, useRef, useState } from "react";
import { INTERVALS, reviewed, today, useStore } from "@/lib/progress";
import { freshSeed, Rng } from "@/lib/rng";
import type { Term } from "@/lib/types";

/** Flashcard ids share the spaced-review schedule with questions, under their own prefix. */
export const cardId = (t: Term) => `fc:${t.term.toLowerCase()}`;
const NEW_PER_SESSION = 10;
const MAX_SESSION = 30;

type Direction = "recall-term" | "recall-meaning";
type Phase = { kind: "ask" } | { kind: "shown"; typed: string; right: boolean | null };

/** Lowercase, no punctuation or extra spaces, so "Kerberos " and "kerberos" match. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim();

/** The definition with the term itself blanked out, so the front doesn't give the answer away. */
function blank(t: Term): string {
  let d = t.definition;
  for (const n of [t.term, ...t.aliases].sort((a, b) => b.length - a.length)) {
    if (n.length < 3) continue;
    d = d.replace(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "▁▁▁");
  }
  return d;
}

export function Flashcards() {
  const store = useStore();
  const [terms, setTerms] = useState<Term[]>([]);
  const [deck, setDeck] = useState("done");
  const [direction, setDirection] = useState<Direction>("recall-term");
  const [queue, setQueue] = useState<Term[] | null>(null);
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "ask" });
  const [typed, setTyped] = useState("");
  const [score, setScore] = useState({ right: 0, done: 0 });
  const [session] = useState(today);

  useEffect(() => {
    let live = true;
    void fetch("/data/terms.json").then((r) => r.json() as Promise<Term[]>).then((all) => {
      if (live) setTerms(all);
    });
    return () => {
      live = false;
    };
  }, []);

  const docs = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of terms) if (!seen.has(t.doc)) seen.set(t.doc, t.docTitle);
    return [...seen].sort((a, b) => a[0].localeCompare(b[0]));
  }, [terms]);

  // A newcomer has finished nothing yet, so start them on the first page that has terms.
  const picked = useRef(false);
  useEffect(() => {
    if (picked.current || !terms.length || !docs.length) return;
    picked.current = true;
    if (!terms.some((t) => store.done[t.doc])) setDeck(docs[0]?.[0] ?? "done");
  }, [terms, docs, store.done]);

  const pool = useMemo(() => (deck === "done" ? terms.filter((t) => store.done[t.doc]) : terms.filter((t) => t.doc === deck)), [terms, deck, store.done]);
  const due = useMemo(() => terms.filter((t) => (store.srs[cardId(t)]?.due ?? "9999") <= session), [terms, store.srs, session]);
  const fresh = useMemo(() => pool.filter((t) => !store.srs[cardId(t)]), [pool, store.srs]);
  const tracked = useMemo(() => Object.keys(store.srs).filter((k) => k.startsWith("fc:")).length, [store.srs]);

  const start = () => {
    const rng = new Rng(freshSeed());
    const chosen = [...rng.shuffle(due), ...rng.shuffle(fresh).slice(0, NEW_PER_SESSION)].slice(0, MAX_SESSION);
    setQueue(rng.shuffle(chosen));
    setPos(0);
    setPhase({ kind: "ask" });
    setTyped("");
    setScore({ right: 0, done: 0 });
  };

  const card = queue?.[pos];

  const grade = (right: boolean) => {
    if (!card) return;
    reviewed(cardId(card), right);
    setScore((s) => ({ right: s.right + (right ? 1 : 0), done: s.done + 1 }));
    setPos((p) => p + 1);
    setPhase({ kind: "ask" });
    setTyped("");
  };

  const check = () => {
    if (!card) return;
    if (!typed.trim()) {
      setPhase({ kind: "shown", typed: "", right: null });
      return;
    }
    const ok = [card.term, ...card.aliases].some((n) => norm(n) === norm(typed));
    setPhase({ kind: "shown", typed, right: ok });
  };

  if (!terms.length) return <div className="card"><p className="muted">Loading the glossary…</p></div>;

  if (!queue) {
    return (
      <div className="card fc-start">
        <h2>{due.length} card{due.length === 1 ? "" : "s"} due, {Math.min(fresh.length, NEW_PER_SESSION)} new</h2>
        <p className="muted">
          {tracked === 0
            ? "Each card is a glossary term from a page you've studied. Recall it, check it, grade yourself honestly. Cards you know come back after longer and longer gaps."
            : `${tracked} cards in rotation. A card you know comes back after ${INTERVALS.join(", ")} days; one you miss comes back tomorrow.`}
        </p>
        <div className="fc-options">
          <label>
            New cards from
            <select value={deck} onChange={(e) => setDeck(e.target.value)}>
              <option value="done">Pages you've marked as done ({terms.filter((t) => store.done[t.doc]).length} terms)</option>
              {docs.map(([slug, title]) => (
                <option key={slug} value={slug}>{title}</option>
              ))}
            </select>
          </label>
          <fieldset className="fc-dir">
            <legend>Direction</legend>
            <label><input type="radio" name="dir" checked={direction === "recall-term"} onChange={() => setDirection("recall-term")} /> Read the meaning, type the term</label>
            <label><input type="radio" name="dir" checked={direction === "recall-meaning"} onChange={() => setDirection("recall-meaning")} /> Read the term, recall the meaning</label>
          </fieldset>
        </div>
        {due.length + fresh.length > 0 ? (
          <button type="button" className="btn primary lg" onClick={start}>Start {Math.min(due.length + Math.min(fresh.length, NEW_PER_SESSION), MAX_SESSION)} cards</button>
        ) : (
          <p className="muted">
            {deck === "done" ? <>Nothing new yet: mark a lesson as done, or pick a page above. </> : <>Every card from this page is already in rotation. </>}
            <Link href="/courses/">Go to the lessons</Link>
          </p>
        )}
      </div>
    );
  }

  if (!card) {
    return (
      <div className="card fc-start">
        <h2>Session done: {score.right} of {score.done} right</h2>
        <p className="muted">Missed cards come back tomorrow. That&apos;s the point: the second try is where they stick.</p>
        <p className="hero-actions">
          <button type="button" className="btn primary" onClick={() => setQueue(null)}>Back to the decks</button>
          <Link className="btn" href="/review/">Review questions</Link>
        </p>
      </div>
    );
  }

  const shown = phase.kind === "shown";
  return (
    <div className="card fc">
      <p className="drill-count">Card {pos + 1} of {queue.length}, {score.right} right so far</p>
      <div className="drill-bar"><span style={{ width: `${(pos / queue.length) * 100}%` }} /></div>
      {direction === "recall-term" ? (
        <>
          <p className="fc-ask">Which term means this?</p>
          <p className="fc-front">{blank(card)}</p>
          {!shown && (
            <form className="drill-input" onSubmit={(e) => { e.preventDefault(); check(); }}>
              <input value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="The term" autoComplete="off" autoCapitalize="off" spellCheck={false} autoFocus placeholder="Type the term, or leave empty to reveal" />
              <button type="submit" className="btn primary">Check</button>
            </form>
          )}
        </>
      ) : (
        <>
          <p className="fc-ask">Say what this means, out loud or on paper, then reveal.</p>
          <p className="fc-front fc-term">{card.term}</p>
          {!shown && <button type="button" className="btn primary" onClick={() => setPhase({ kind: "shown", typed: "", right: null })}>Reveal</button>}
        </>
      )}
      {phase.kind === "shown" && (
        <div className={`why ${phase.right === false ? "no" : phase.right ? "ok" : ""}`}>
          {phase.right === true && <p><strong>Right.</strong></p>}
          {phase.right === false && <p><strong>Not quite.</strong> You typed <span className="given">{phase.typed}</span>.</p>}
          <p><strong>{card.term}</strong>{card.aliases.length ? ` (also ${card.aliases.join(", ")})` : ""}: {card.definition}</p>
          <p className="muted">From <Link href={card.href}>{card.docTitle}</Link></p>
          <div className="why-actions">
            {phase.right === true ? (
              <button type="button" className="btn primary" onClick={() => grade(true)}>Next card</button>
            ) : phase.right === false ? (
              <>
                <button type="button" className="link-btn" onClick={() => grade(true)}>It was a typo, count it right</button>
                <button type="button" className="btn primary" onClick={() => grade(false)}>Next card</button>
              </>
            ) : (
              <>
                <button type="button" className="btn" onClick={() => grade(false)}>I didn&apos;t know it</button>
                <button type="button" className="btn primary" onClick={() => grade(true)}>I knew it</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
