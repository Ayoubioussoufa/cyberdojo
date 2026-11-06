"use client";

import Link from "@/components/HoverLink";
import { memo } from "react";
import { CopyButton } from "./Copy";
import { LazyDrill, LazyRange } from "./Lazy";
import { CheckBox, HelpBadge } from "./ProjectParts";
import { Html } from "./Html";
import { QuestionCard } from "./Question";
import { Terms } from "./Terms";
import { WrittenCard } from "./Written";
import { ProjectStep } from "./ProjectStep";
import { getStore, setDone, setWord, useSlice } from "@/lib/progress";
import { KIND_LABEL, type PathStep } from "@/lib/pathState";
import { fullMessage } from "@/lib/tutor";
import type { DocBrief, DocMeta, Segment, Term, TocEntry } from "@/lib/types";

type Near = Pick<DocMeta, "slug" | "title"> | null;

/** The body never watches the store, so answering or typing can't re-render a whole lesson. */
const Segments = memo(function Segments({ segments, brief }: { segments: Segment[]; brief: DocBrief }) {
  const counter = { n: 0 };
  const render = (list: Segment[]): React.ReactNode =>
    list.map((s, i) => {
      if (s.kind === "html") return <Html key={i} html={s.html} />;
      if (s.kind === "question") return <QuestionCard key={s.question.id} q={s.question} doc={brief} n={++counter.n} />;
      if (s.kind === "written") return <WrittenCard key={s.written.id} w={s.written} />;
      if (s.kind === "drill") return <LazyDrill key={i} id={s.id} />;
      if (s.kind === "range") return <LazyRange key={i} id={s.id} />;
      if (s.kind === "check") return <CheckBox key={s.id} id={s.id} html={s.html} />;
      if (s.kind === "step") return <ProjectStep key={s.n} slug={brief.slug} step={s} walkthrough={render(s.body)} after={render(s.after)} />;
      return <HelpBadge key={i} tool={s.tool} level={s.level} />;
    });
  return <>{render(segments)}</>;
});

function useTally(brief: DocBrief) {
  const answered = useSlice((s) => brief.questions.filter((q) => s.picks[q.id] !== undefined).length);
  const right = useSlice((s) => brief.questions.filter((q) => s.picks[q.id] === q.correct).length);
  return { answered, right };
}

function WordField({ slug, word }: { slug: string; word: string }) {
  const key = `${slug}:${word}`;
  const value = useSlice((s) => s.words[key] ?? "");
  return (
    <label className="word">
      <span>{word}</span>
      <input value={value} onChange={(e) => setWord(key, e.target.value)} placeholder="One sentence, no looking" />
    </label>
  );
}

function Score({ brief }: { brief: DocBrief }) {
  const { answered, right } = useTally(brief);
  return (
    <p className="score">
      {brief.questions.length ? `${answered} of ${brief.questions.length} answered · ${right} right` : "No multiple-choice questions on this page"}
    </p>
  );
}

function RailScore({ brief }: { brief: DocBrief }) {
  const { answered } = useTally(brief);
  return <p className="rail-score">{brief.questions.length ? `${answered}/${brief.questions.length} answered` : ""}</p>;
}

function Finish({ meta, brief, after, copy }: { meta: DocMeta; brief: DocBrief; after?: PathStep | null; copy: () => string }) {
  const isDone = useSlice((s) => !!s.done[meta.slug]);
  return (
    <>
      <div className="finish-actions">
        <CopyButton className="btn primary lg" label="Copy everything for my AI tutor" build={copy} />
        {meta.kind !== "project" && (
          <button type="button" className={`btn lg${isDone ? " is-ok" : ""}`} onClick={() => setDone(meta.slug, !isDone)}>
            {isDone ? "✓ Marked as done" : "Mark as done"}
          </button>
        )}
      </div>
      <p className="followup">Anything unclear? Ask your AI tutor. There's no such thing as a question too basic for this course.</p>
      {isDone && meta.builds && (
        <div className="why ok cando">
          <p><strong>New skill.</strong> You can now {meta.builds}. It's been added to your <Link href="/skills/">progress</Link>.</p>
        </div>
      )}
      {after && (
        <Link href={after.href} className="card link-card next-step">
          <span className="band">Next on your roadmap · {KIND_LABEL[after.kind]}</span>
          <span className="next-title">{after.title}</span>
          <span className="muted">{after.note}</span>
        </Link>
      )}
    </>
  );
}

export function DocView({
  meta, brief, segments, toc, terms, kicker, prev, next, base, after, intro, outro,
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
  /** What comes after this page on the roadmap. */
  after?: PathStep | null;
  /** Sits under the header: a project's tools table, for example. */
  intro?: React.ReactNode;
  /** Sits after the content, before "Get corrected". */
  outro?: React.ReactNode;
}) {
  const copy = () => fullMessage(brief, getStore());

  return (
    <div className="doc-grid">
      <article className="doc" id="doc-body">
        <header className="doc-head noterms">
          <p className="kicker">{kicker}</p>
          <h1>{meta.title}</h1>
          <p className="lede">{meta.summary}</p>
          <p className="meta">
            {meta.hours ? `About ${meta.hours} hours` : `${meta.minutes} min`}{meta.questions ? ` · ${meta.questions} questions` : ""}
            {meta.builds ? <> · You will: {meta.builds}</> : null}
          </p>
          {meta.source && (
            <p className="source">
              <span>Primary source</span> <a href={meta.source.url} target="_blank" rel="noreferrer">{meta.source.label}</a>
            </p>
          )}
        </header>

        {intro}

        <Segments segments={segments} brief={brief} />

        {outro}

        <section className="finish">
          <h2 id="finish">Get corrected</h2>
          <p>
            One button copies this whole page: every question with its options, your answers, the key, your written answers and your definitions.
            Paste it into any AI assistant and it becomes your tutor for this lesson.
          </p>
          {meta.words.length > 0 && (
            <div className="words">
              <p className="words-title">Define these in your own words</p>
              {meta.words.map((w) => <WordField key={w} slug={meta.slug} word={w} />)}
            </div>
          )}
          <Score brief={brief} />
          <Finish meta={meta} brief={brief} after={after} copy={copy} />
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
          <RailScore brief={brief} />
        </div>
      </aside>

      <div className="mobile-copy">
        <CopyButton className="btn primary sm" label="Copy for AI" done="Copied" build={copy} />
      </div>

      <Terms terms={terms} scope="#doc-body" />
    </div>
  );
}
