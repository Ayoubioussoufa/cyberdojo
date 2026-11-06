"use client";

import { useState } from "react";
import { CopyButton } from "./Copy";
import { answer, getStore, useSlice } from "@/lib/progress";
import { questionMessage } from "@/lib/tutor";
import type { DocBrief, Question as Q } from "@/lib/types";

/** Inline check: pick, get told why at once, or send it to the AI tutor. */
export function QuestionCard({ q, doc, n }: { q: Q; doc: DocBrief; n: number }) {
  const saved = useSlice((s) => s.picks[q.id]);
  const [fresh, setFresh] = useState<number | null>(null);
  const [retry, setRetry] = useState(false);
  const picked = retry ? fresh : (fresh ?? saved ?? null);
  const shown = picked !== null;

  const choose = (i: number) => {
    setFresh(i);
    setRetry(false);
    answer(q.id, i, i === q.correct);
  };

  return (
    <section className="qcard" aria-label={`Check question ${n}`}>
      <header className="qcard-head">
        <span className="qcard-tag">Check {n}</span>
        <CopyButton className="link-btn" label="Ask my AI about this" done="Copied" build={() => questionMessage(doc, q, getStore())} />
      </header>
      <p className="qcard-prompt noterms" dangerouslySetInnerHTML={{ __html: q.promptHtml }} />
      <div className="opts">
        {q.optionsHtml.map((html, i) => {
          const cls = ["opt", shown && i === q.correct ? "right" : "", shown && picked === i && i !== q.correct ? "wrong" : ""].filter(Boolean).join(" ");
          return (
            <button key={i} type="button" className={cls} disabled={shown} onClick={() => choose(i)}>
              <span className="opt-key" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
              <span className="noterms" dangerouslySetInnerHTML={{ __html: html }} />
            </button>
          );
        })}
      </div>
      {shown && (
        <div className={`why ${picked === q.correct ? "ok" : "no"}`}>
          <strong>{picked === q.correct ? "Right." : "Not quite."}</strong>{" "}
          <span dangerouslySetInnerHTML={{ __html: q.whyHtml }} />
          <button
            type="button"
            className="link-btn again"
            onClick={() => {
              setFresh(null);
              setRetry(true);
            }}
          >
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
