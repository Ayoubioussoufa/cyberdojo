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
import { DESKTOP } from "@/lib/desktop";
import { getStore, setDone, setWord, useSlice } from "@/lib/progress";
import type { PathStep } from "@/lib/pathState";
import { fill, useLang } from "@/i18n/LangProvider";
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
      if (s.kind === "step") return <ProjectStep key={`step-${s.n}`} slug={brief.slug} step={s} walkthrough={render(s.body)} after={render(s.after)} />;
      return <HelpBadge key={i} tool={s.tool} level={s.level} />;
    });
  return <>{render(segments)}</>;
});

function useTally(brief: DocBrief) {
  const answered = useSlice((s) => brief.questions.filter((q) => s.picks[q.id] !== undefined).length);
  const right = useSlice((s) => brief.questions.filter((q) => s.picks[q.id] === q.correct).length);
  return { answered, right };
}

function WordField({ slug, word, saveAs }: { slug: string; word: string; saveAs: string }) {
  const key = `${slug}:${saveAs}`;
  const value = useSlice((s) => s.words[key] ?? "");
  const { t } = useLang();
  return (
    <label className="word">
      <span>{word}</span>
      <input value={value} onChange={(e) => setWord(key, e.target.value)} placeholder={t.doc.defineHolder} />
    </label>
  );
}

function Score({ brief }: { brief: DocBrief }) {
  const { answered, right } = useTally(brief);
  const { t } = useLang();
  return (
    <p className="score">
      {brief.questions.length ? fill(t.doc.score, { answered, total: brief.questions.length, right }) : t.doc.noQuestions}
    </p>
  );
}

function RailScore({ brief }: { brief: DocBrief }) {
  const { answered } = useTally(brief);
  const { t } = useLang();
  return <p className="rail-score">{brief.questions.length ? fill(t.doc.railScore, { answered, total: brief.questions.length }) : ""}</p>;
}

function Finish({ meta, brief, after, copy }: { meta: DocMeta; brief: DocBrief; after?: PathStep | null; copy: () => string }) {
  const isDone = useSlice((s) => !!s.done[meta.slug]);
  const { t } = useLang();
  return (
    <>
      <div className="finish-actions">
        <CopyButton className="btn primary lg" label={t.doc.copyAll} build={copy} />
        {meta.kind !== "project" && (
          <button type="button" className={`btn lg${isDone ? " is-ok" : ""}`} onClick={() => setDone(meta.slug, !isDone)}>
            {isDone ? t.doc.markedDone : t.doc.markDone}
          </button>
        )}
      </div>
      {!DESKTOP && <p className="followup">{t.doc.followup}</p>}
      {isDone && meta.builds && (
        <div className="why ok cando">
          <p><strong>{t.doc.newSkill}</strong> {fill(t.doc.canNow, { skill: meta.builds })} <Link href="/skills/">{t.doc.progressLink}</Link>.</p>
        </div>
      )}
      {after && (
        <Link href={after.href} className="card link-card next-step">
          <span className="band">{fill(t.doc.nextOn, { kind: t.step[after.kind] })}</span>
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
  const { lang, t } = useLang();
  const copy = () => fullMessage(brief, getStore(), lang);

  return (
    <div className="doc-grid">
      <article className="doc" id="doc-body">
        <header className="doc-head noterms">
          <p className="kicker">{kicker}</p>
          <h1 lang={meta.lang && meta.lang !== lang ? meta.lang : undefined}>{meta.title}</h1>
          <p className="lede">{meta.summary}</p>
          <p className="meta">
            {meta.hours ? fill(t.common.aboutHours, { n: meta.hours }) : fill(t.common.min, { n: meta.minutes })}{meta.questions ? fill(t.doc.questions, { n: meta.questions }) : ""}
            {meta.builds ? fill(t.doc.youWill, { builds: meta.builds }) : null}
          </p>
          {meta.source && (
            <p className="source">
              <span>{t.doc.source}</span> <a href={meta.source.url} target="_blank" rel="noreferrer">{meta.source.label}</a>
            </p>
          )}
        </header>

        {meta.lang && meta.lang !== lang && <p className="lang-note" role="note">{t.common.notTranslated}</p>}

        {intro}

        <div lang={meta.lang && meta.lang !== lang ? meta.lang : undefined}>
          <Segments segments={segments} brief={brief} />
        </div>

        {outro}

        <section className="finish">
          <h2 id="finish">{t.doc.corrected}</h2>
          <p>{DESKTOP ? t.tutor.correctedText : t.doc.correctedText}</p>
          {meta.words.length > 0 && (
            <div className="words">
              <p className="words-title">{t.doc.defineTitle}</p>
              {meta.words.map((w, i) => <WordField key={w} slug={meta.slug} word={w} saveAs={meta.wordKeys?.[i] ?? w} />)}
            </div>
          )}
          <Score brief={brief} />
          <Finish meta={meta} brief={brief} after={after} copy={copy} />
        </section>

        <nav className="pager" aria-label={t.doc.pager}>
          {prev ? <Link href={`${base}${prev.slug}/`}><span>{t.common.previous}</span>{prev.title}</Link> : <span />}
          {next ? <Link href={`${base}${next.slug}/`} className="to-next"><span>{t.common.next}</span>{next.title}</Link> : <span />}
        </nav>
      </article>

      <aside className="rail" aria-label={t.doc.onPage}>
        <div className="rail-in">
          <p className="rail-title">{t.doc.onPage}</p>
          <ol>
            {toc.map((t) => <li key={t.id}><a href={`#${t.id}`}>{t.text}</a></li>)}
            <li><a href="#finish">{t.doc.corrected}</a></li>
          </ol>
          <CopyButton className="btn primary rail-copy" label={t.doc.copyRail} done={t.common.copiedCap} build={copy} />
          <RailScore brief={brief} />
        </div>
      </aside>

      <div className="mobile-copy">
        <CopyButton className="btn primary sm" label={t.doc.copyMobile} done={t.common.copiedCap} build={copy} />
      </div>

      <Terms terms={terms} scope="#doc-body" />
    </div>
  );
}
