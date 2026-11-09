"use client";

import Link from "@/components/HoverLink";
import { useEffect, useMemo, useState } from "react";
import { CopyButton } from "./Copy";
import { INTERVALS, reviewed, today, useStore } from "@/lib/progress";
import { freshSeed, Rng } from "@/lib/rng";
import type { Question } from "@/lib/types";
import { fill, plural, useLang } from "@/i18n/LangProvider";
import { localize } from "@/i18n/lang";
import { questionMessage } from "@/lib/tutor";

interface Item {
  q: Question;
  title: string;
  href: string;
}

export function Review() {
  const store = useStore();
  const { lang, t } = useLang();
  const [items, setItems] = useState<Item[]>([]);
  const tracked = Object.keys(store.srs).filter((k) => !k.startsWith("fc:")).length;
  // 400 KB of questions, so they load only for someone who has answered one.
  useEffect(() => {
    if (tracked === 0 || items.length) return;
    let live = true;
    void fetch(localize("/data/questions.json", lang)).then((r) => r.json() as Promise<Item[]>).then((all) => {
      if (live) setItems(all);
    });
    return () => {
      live = false;
    };
  }, [tracked, items.length, lang]);

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
        <p className="band">{t.review.today}</p>
        <h2>{plural(lang, t.review.due, dueNow.length)}</h2>
        <p className="muted">{tracked === 0 ? t.review.empty : fill(t.review.rotation, { n: tracked, days: INTERVALS.join(", ") })}</p>
        {dueNow.length > 0 ? <button type="button" className="btn primary lg" onClick={start}>{t.review.start}</button> : <Link className="btn lg" href="/courses/">{t.review.toCourses}</Link>}
      </div>
    );
  }
  if (!item) {
    return (
      <div className="card review-start">
        <p className="band">{t.review.done}</p>
        <h2>{fill(t.review.score, { right, total: queue.length })}</h2>
        <p className="muted">{t.review.wrongOk}</p>
        <button type="button" className="btn lg" onClick={() => setQueue(null)}>{t.review.back}</button>
      </div>
    );
  }
  const q = item.q;
  const shown = picked !== null;
  return (
    <section className="qcard review-q">
      <header className="qcard-head">
        <span className="qcard-tag">{fill(t.review.of, { n: pos + 1, total: queue.length })}</span>
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
          <strong>{picked === q.correct ? t.question.right : t.question.wrong}</strong> <span dangerouslySetInnerHTML={{ __html: q.whyHtml }} />
          <div className="why-actions">
            <CopyButton className="link-btn" label={t.question.ask} done={t.common.copiedCap} build={() => questionMessage({ slug: "", kind: "lesson", title: item.title, summary: "", number: 0, words: [], questions: [], written: [] }, q, { ...store, picks: { ...store.picks, [q.id]: picked ?? 0 } }, lang)} />
            <button type="button" className="btn primary sm" onClick={() => { setPos(pos + 1); setPicked(null); }}>{t.common.next}</button>
          </div>
        </div>
      )}
    </section>
  );
}
