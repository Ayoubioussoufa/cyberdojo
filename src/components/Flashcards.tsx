"use client";

import Link from "@/components/HoverLink";
import { useEffect, useMemo, useRef, useState } from "react";
import { INTERVALS, reviewed, today, useStore } from "@/lib/progress";
import { freshSeed, Rng } from "@/lib/rng";
import type { Term } from "@/lib/types";
import { fill, plural, useLang } from "@/i18n/LangProvider";
import { localize } from "@/i18n/lang";

/** Flashcard ids share the spaced-review schedule with questions, under their own prefix. */
/** Keyed by the English name, so a card keeps its schedule in both languages. */
export const cardId = (t: Term) => `fc:${(t.key ?? t.term).toLowerCase()}`;
const NEW_PER_SESSION = 10;
const MAX_SESSION = 30;

type Direction = "recall-term" | "recall-meaning";
type Phase = { kind: "ask" } | { kind: "shown"; typed: string; right: boolean | null };

/** Lowercase, no punctuation or extra spaces, so "Kerberos " and "kerberos" match. */
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9+#]+/g, " ").trim();

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
  const { lang, t: tr } = useLang();
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
    void fetch(localize("/data/terms.json", lang)).then((r) => r.json() as Promise<Term[]>).then((all) => {
      if (live) setTerms(all);
    });
    return () => {
      live = false;
    };
  }, [lang]);

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

  if (!terms.length) return <div className="card"><p className="muted">{tr.cards.loading}</p></div>;

  if (!queue) {
    return (
      <div className="card fc-start">
        <h2>{plural(lang, tr.cards.due, due.length)}, {plural(lang, tr.cards.new, Math.min(fresh.length, NEW_PER_SESSION))}</h2>
        <p className="muted">
          {tracked === 0
            ? tr.cards.empty
            : fill(tr.cards.rotation, { n: tracked, days: INTERVALS.join(", ") })}
        </p>
        <div className="fc-options">
          <label>
            {tr.cards.from}
            <select value={deck} onChange={(e) => setDeck(e.target.value)}>
              <option value="done">{fill(tr.cards.doneDeck, { n: terms.filter((t) => store.done[t.doc]).length })}</option>
              {docs.map(([slug, title]) => (
                <option key={slug} value={slug}>{title}</option>
              ))}
            </select>
          </label>
          <fieldset className="fc-dir">
            <legend>{tr.cards.direction}</legend>
            <label><input type="radio" name="dir" checked={direction === "recall-term"} onChange={() => setDirection("recall-term")} /> {tr.cards.toTerm}</label>
            <label><input type="radio" name="dir" checked={direction === "recall-meaning"} onChange={() => setDirection("recall-meaning")} /> {tr.cards.toMeaning}</label>
          </fieldset>
        </div>
        {due.length + fresh.length > 0 ? (
          <button type="button" className="btn primary lg" onClick={start}>{fill(tr.cards.start, { n: Math.min(due.length + Math.min(fresh.length, NEW_PER_SESSION), MAX_SESSION) })}</button>
        ) : (
          <p className="muted">
            {deck === "done" ? tr.cards.nothingNew : tr.cards.allIn}{" "}
            <Link href="/courses/">{tr.cards.toLessons}</Link>
          </p>
        )}
      </div>
    );
  }

  if (!card) {
    return (
      <div className="card fc-start">
        <h2>{fill(tr.cards.sessionDone, { right: score.right, total: score.done })}</h2>
        <p className="muted">{tr.cards.missed}</p>
        <p className="hero-actions">
          <button type="button" className="btn primary" onClick={() => setQueue(null)}>{tr.cards.backDecks}</button>
          <Link className="btn" href="/review/">{tr.cards.reviewQ}</Link>
        </p>
      </div>
    );
  }

  const shown = phase.kind === "shown";
  return (
    <div className="card fc">
      <p className="drill-count">{fill(tr.cards.count, { n: pos + 1, total: queue.length, right: score.right })}</p>
      <div className="drill-bar"><span style={{ width: `${(pos / queue.length) * 100}%` }} /></div>
      {direction === "recall-term" ? (
        <>
          <p className="fc-ask">{tr.cards.which}</p>
          <p className="fc-front">{blank(card)}</p>
          {!shown && (
            <form className="drill-input" onSubmit={(e) => { e.preventDefault(); check(); }}>
              <input value={typed} onChange={(e) => setTyped(e.target.value)} aria-label={tr.cards.term} autoComplete="off" autoCapitalize="off" spellCheck={false} autoFocus placeholder={tr.cards.typeHolder} />
              <button type="submit" className="btn primary">{tr.cards.check}</button>
            </form>
          )}
        </>
      ) : (
        <>
          <p className="fc-ask">{tr.cards.say}</p>
          <p className="fc-front fc-term">{card.term}</p>
          {!shown && <button type="button" className="btn primary" onClick={() => setPhase({ kind: "shown", typed: "", right: null })}>{tr.cards.reveal}</button>}
        </>
      )}
      {phase.kind === "shown" && (
        <div className={`why ${phase.right === false ? "no" : phase.right ? "ok" : ""}`}>
          {phase.right === true && <p><strong>{tr.question.right}</strong></p>}
          {phase.right === false && <p><strong>{tr.question.wrong}</strong> {tr.cards.typed} <span className="given">{phase.typed}</span>.</p>}
          <p><strong>{card.term}</strong>{card.aliases.length ? ` (${fill(tr.cards.also, { names: card.aliases.join(", ") })})` : ""}: {card.definition}</p>
          <p className="muted">{tr.cards.fromDoc} <Link href={card.href}>{card.docTitle}</Link></p>
          <div className="why-actions">
            {phase.right === true ? (
              <button type="button" className="btn primary" onClick={() => grade(true)}>{tr.cards.nextCard}</button>
            ) : phase.right === false ? (
              <>
                <button type="button" className="link-btn" onClick={() => grade(true)}>{tr.cards.typo}</button>
                <button type="button" className="btn primary" onClick={() => grade(false)}>{tr.cards.nextCard}</button>
              </>
            ) : (
              <>
                <button type="button" className="btn" onClick={() => grade(false)}>{tr.cards.didnt}</button>
                <button type="button" className="btn primary" onClick={() => grade(true)}>{tr.cards.knew}</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
