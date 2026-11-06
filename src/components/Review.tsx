"use client";

import Link from "@/components/HoverLink";
import { useEffect, useMemo, useState } from "react";
import { CopyButton } from "./Copy";
import { INTERVALS, reviewed, today, useStore } from "@/lib/progress";
import { freshSeed, Rng } from "@/lib/rng";
import type { Question } from "@/lib/types";

interface Item {
  q: Question;
  title: string;
  href: string;
}

export function Review() {
  const store = useStore();
  const [items, setItems] = useState<Item[]>([]);
  const tracked = Object.keys(store.srs).length;
  // 400 KB of questions, so they load only for someone who has answered one.
  useEffect(() => {
    if (tracked === 0 || items.length) return;
    let live = true;
    void fetch("/data/questions.json").then((r) => r.json() as Promise<Item[]>).then((all) => {
      if (live) setItems(all);
    });
    return () => {
      live = false;
    };
  }, [tracked, items.length]);

  const [session] = useState(today);
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const [queue, setQueue] = useState<Item[] | null>(null);

  const dueNow = useMemo(() => items.filter((i) => (store.srs[i.q.id]?.due ?? "9999") <= session), [items, store.srs, session]);

  const start = () => {
    setQueue(new Rng(freshSeed()).shuffle(dueNow).slice(0, 20));
    setPos(0);
    setPicked(null);
    setRight(0);
  };

  const item = queue?.[pos];
  const order = useMemo(() => (item ? new Rng(freshSeed()).shuffle(item.q.options.map((_, i) => i)) : []), [item]);

  if (!queue) {
    return (
      <div className="card review-start">
        <p className="band">Today</p>
        <h2>{dueNow.length} question{dueNow.length === 1 ? "" : "s"} due</h2>
        <p className="muted">{tracked === 0 ? "Answer questions in a lesson and they'll appear here, spaced out so they stick." : `${tracked} questions in rotation. Right answers come back after ${INTERVALS.join(", ")} days. A wrong answer comes back tomorrow.`}</p>
        {dueNow.length > 0 ? <button type="button" className="btn primary lg" onClick={start}>Start review</button> : <Link className="btn lg" href="/courses/">Go to the courses</Link>}
      </div>
    );
  }
  if (!item) {
    return (
      <div className="card review-start">
        <p className="band">Done</p>
        <h2>{right} of {queue.length} right</h2>
        <p className="muted">Getting some wrong is how this works: effortful recall is what builds memory.</p>
        <button type="button" className="btn lg" onClick={() => setQueue(null)}>Back</button>
      </div>
    );
  }
  const q = item.q;
  const shown = picked !== null;
  return (
    <section className="qcard review-q">
      <header className="qcard-head">
        <span className="qcard-tag">{pos + 1} of {queue.length}</span>
        <Link className="link-btn" href={item.href}>{item.title}</Link>
      </header>
      <p className="qcard-prompt" dangerouslySetInnerHTML={{ __html: q.promptHtml }} />
      <div className="opts">
        {order.map((i, shownAt) => (
          <button
            key={i}
            type="button"
            className={["opt", shown && i === q.correct ? "right" : "", shown && picked === i && i !== q.correct ? "wrong" : ""].filter(Boolean).join(" ")}
            disabled={shown}
            onClick={() => {
              setPicked(i);
              if (i === q.correct) setRight((n) => n + 1);
              reviewed(q.id, i === q.correct);
            }}
          >
            <span className="opt-key" aria-hidden="true">{String.fromCharCode(65 + shownAt)}</span>
            <span dangerouslySetInnerHTML={{ __html: q.optionsHtml[i] ?? "" }} />
          </button>
        ))}
      </div>
      {shown && (
        <div className={`why ${picked === q.correct ? "ok" : "no"}`}>
          <strong>{picked === q.correct ? "Right." : "Not quite."}</strong> <span dangerouslySetInnerHTML={{ __html: q.whyHtml }} />
          <div className="why-actions">
            <CopyButton className="link-btn" label="Ask my AI about this" done="Copied" build={() => `You are my cybersecurity tutor. I'm a beginner, so assume nothing. Explain this question from scratch, why the right answer is right and why the others are wrong:\n\n${q.prompt}\n${q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("\n")}\n\nRight answer: ${q.options[q.correct]}\nMy answer: ${q.options[picked ?? 0]}`} />
            <button type="button" className="btn primary sm" onClick={() => { setPos(pos + 1); setPicked(null); }}>Next</button>
          </div>
        </div>
      )}
    </section>
  );
}
