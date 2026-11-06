"use client";

import Link from "next/link";
import { CopyButton } from "./Copy";
import { Drill } from "./Drill";
import { Html } from "./Html";
import { QuestionCard } from "./Question";
import { Range } from "./Range";
import { Terms } from "./Terms";
import { WrittenCard } from "./Written";
import { setDone, setWord, useStore } from "@/lib/progress";
import { fullMessage } from "@/lib/tutor";
import type { DocBrief, DocMeta, Segment, Term, TocEntry } from "@/lib/types";

type Near = Pick<DocMeta, "slug" | "title"> | null;

export function DocView({
  meta, brief, segments, toc, terms, kicker, prev, next, base,
}: {
  meta: DocMeta;
  brief: DocBrief;
  segments: Segment[];
  toc: TocEntry[];
  terms: Term[];
  kicker: string;
  prev: Near;
  next: Near;
  base: string;
}) {
  const store = useStore();
  const answered = brief.questions.filter((q) => store.picks[q.id] !== undefined).length;
  const right = brief.questions.filter((q) => store.picks[q.id] === q.correct).length;
  const isDone = !!store.done[meta.slug];
  let n = 0;
  const copy = () => fullMessage(brief, store);

  return (
    <div className="doc-grid">
      <article className="doc" id="doc-body">
        <header className="doc-head noterms">
          <p className="kicker">{kicker}</p>
          <h1>{meta.title}</h1>
          <p className="lede">{meta.summary}</p>
          <p className="meta">
            {meta.minutes} min{meta.questions ? ` · ${meta.questions} questions` : ""}
            {meta.builds ? <> · You will: {meta.builds}</> : null}
          </p>
          {meta.source && (
            <p className="source">
              <span>Primary source</span> <a href={meta.source.url} target="_blank" rel="noreferrer">{meta.source.label}</a>
            </p>
          )}
        </header>

        {segments.map((s, i) => {
          if (s.kind === "html") return <Html key={i} html={s.html} />;
          if (s.kind === "question") return <QuestionCard key={s.question.id} q={s.question} doc={brief} n={++n} />;
          if (s.kind === "written") return <WrittenCard key={s.written.id} w={s.written} />;
          if (s.kind === "drill") return <Drill key={i} id={s.id} />;
          return <Range key={i} id={s.id} />;
        })}

        <section className="finish">
          <h2 id="finish">Get corrected</h2>
          <p>
            One button copies this whole page: every question with its options, your answers, the key, your written answers and your definitions.
            Paste it into any AI assistant and it becomes your tutor for this lesson.
          </p>
          {meta.words.length > 0 && (
            <div className="words">
              <p className="words-title">Define these in your own words</p>
              {meta.words.map((w) => (
                <label key={w} className="word">
                  <span>{w}</span>
                  <input value={store.words[`${meta.slug}:${w}`] ?? ""} onChange={(e) => setWord(`${meta.slug}:${w}`, e.target.value)} placeholder="One sentence, no looking" />
                </label>
              ))}
            </div>
          )}
          <p className="score">
            {brief.questions.length ? `${answered} of ${brief.questions.length} answered · ${right} right` : "No multiple-choice questions on this page"}
          </p>
          <div className="finish-actions">
            <CopyButton className="btn primary lg" label="Copy everything for my AI tutor" build={copy} />
            <button type="button" className={`btn lg${isDone ? " is-ok" : ""}`} onClick={() => setDone(meta.slug, !isDone)}>
              {isDone ? "✓ Marked as done" : "Mark as done"}
            </button>
          </div>
          <p className="followup">Anything unclear? Ask your AI tutor. There's no such thing as a question too basic for this course.</p>
        </section>

        <nav className="pager" aria-label="Next and previous">
          {prev ? <Link href={`${base}${prev.slug}/`}><span>Previous</span>{prev.title}</Link> : <span />}
          {next ? <Link href={`${base}${next.slug}/`} className="to-next"><span>Next</span>{next.title}</Link> : <span />}
        </nav>
      </article>

      <aside className="rail" aria-label="On this page">
        <div className="rail-in">
          <p className="rail-title">On this page</p>
          <ol>
            {toc.map((t) => <li key={t.id}><a href={`#${t.id}`}>{t.text}</a></li>)}
            <li><a href="#finish">Get corrected</a></li>
          </ol>
          <CopyButton className="btn primary rail-copy" label="Copy for my AI tutor" done="Copied" build={copy} />
          <p className="rail-score">{brief.questions.length ? `${answered}/${brief.questions.length} answered` : ""}</p>
        </div>
      </aside>

      <div className="mobile-copy">
        <CopyButton className="btn primary sm" label="Copy for AI" done="Copied" build={copy} />
      </div>

      <Terms terms={terms} scope="#doc-body" />
    </div>
  );
}
