"use client";

import Link from "@/components/HoverLink";
import { BeltChip, useBelt } from "./Progress";
import { currentBelt, isDone, nextStep, streak, weekPlan, type PathStep } from "@/lib/pathState";
import { today, useStore } from "@/lib/progress";
import { useEffect, useState } from "react";
import { TIPS, type Tip } from "@/data/tips";
import { fill, plural, useLang } from "@/i18n/LangProvider";
import { DESKTOP } from "@/lib/desktop";

export function Home({ path }: { path: PathStep[] }) {
  const store = useStore();
  const { lang, t } = useLang();
  const beltName = useBelt();
  const now = today();
  const next = nextStep(path, store);
  const doneSteps = path.filter((s) => isDone(s, store)).length;
  const dueEntries = Object.entries(store.srs).filter(([, c]) => c.due <= now);
  const due = dueEntries.filter(([k]) => !k.startsWith("fc:")).length;
  const dueCards = dueEntries.length - due;
  const mistakes = store.mistakes.length;
  const started = doneSteps > 0 || !!store.plan;
  const week = store.plan ? weekPlan(path, store, store.plan.hours) : [];
  const days = streak(store.days, now);
  const b = currentBelt(path, store);
  // Picked after mounting, by day of the year, so the server and browser never disagree.
  const [tip, setTip] = useState<Tip | null>(null);
  useEffect(() => {
    const d = new Date();
    const day = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000);
    setTip(TIPS[day % TIPS.length] ?? null);
  }, []);

  return (
    <div className="page">
      {!started && (
        <section className="hero-console">
          <div className="hero-pane" aria-label={t.home.heroLabel}>
            <h1><span className="hero-hash" aria-hidden="true"># </span>{t.home.heroTitle}</h1>
            <div className="hero-term">
              <p><span className="p">ana@lab:~$</span> grep &apos;Failed password&apos; auth.log | wc -l</p>
              <p>214</p>
              <p className="gap"><span className="p">ana@lab:~$</span> grep Failed auth.log | awk &apos;{"{print $(NF-3)}"}&apos; | sort | uniq -c | sort -rn | head -2</p>
              <p>    187 203.0.113.7</p>
              <p>      9 198.51.100.23</p>
              <p className="gap"><span className="p">ana@lab:~$</span> submit CD{"{"}7kqm2xw9ph{"}"}</p>
              <p className="g">{t.home.heroCaptured}</p>
            </div>
          </div>
          <p className="lede">{t.home.lede}</p>
          <p className="hero-actions">
            <Link className="btn primary lg" href="/start/">{t.home.tour}</Link>
            {next && <Link className="btn lg" href={next.href}>{t.home.skip}</Link>}
          </p>
        </section>
      )}

      {started && (
        <header className="page-head">
          <h1>{days > 1 ? fill(t.home.streak, { n: days }) : doneSteps > 0 ? t.home.welcome : t.home.begin}</h1>
        </header>
      )}

      <section className="status" aria-labelledby="status-h">
        <h2 id="status-h" className="status-h">{t.home.status}</h2>
        <dl className="status-list">
          <div>
            <dt>{t.home.belt}</dt>
            <dd>
              <BeltChip belt={b.belt} />
              {b.next && <span className="muted">{fill(t.home.toBelt, { got: b.got, need: b.need, belt: beltName(b.next).name.toLowerCase() })}</span>}
            </dd>
          </div>
          <div>
            <dt>{t.home.progress}</dt>
            <dd>{fill(t.home.stepsDone, { done: doneSteps, total: path.length })}, {plural(lang, t.home.daysRow, days)}</dd>
          </div>
          {(due > 0 || dueCards > 0 || mistakes > 0) && (
            <div>
              <dt>{t.home.due}</dt>
              <dd className="status-actions">
                {due > 0 && <Link href="/review/">{plural(lang, t.home.dueQuestions, due)}</Link>}
                {dueCards > 0 && <Link href="/practice/flashcards/">{plural(lang, t.home.dueCards, dueCards)}</Link>}
                {mistakes > 0 && <Link href="/practice/mistakes/">{plural(lang, t.home.dueMistakes, mistakes)}</Link>}
              </dd>
            </div>
          )}
          {tip && (
            <div>
              <dt>{t.home.tip}</dt>
              <dd className="status-tip">{tip.text} <Link href={tip.href}>{t.home.why}</Link></dd>
            </div>
          )}
          <div className="status-next">
            <dt>{t.home.next}</dt>
            <dd>
              {next ? (
                <>
                  <span className="status-kind">{t.step[next.kind]}, {next.month === 0 ? t.common.dayZeroLower : fill(t.common.monthLower, { n: next.month })}, {next.minutes >= 120 ? fill(t.home.aboutHours, { n: Math.round(next.minutes / 60) }) : fill(t.home.aboutMinutes, { n: next.minutes })}</span>
                  <strong className="status-title">{next.title}</strong>
                  <span className="muted">{next.note}</span>
                  <Link className="btn primary" href={next.href}>{fill(t.home.open, { title: next.title })}</Link>
                </>
              ) : (
                <strong>{t.home.finished}</strong>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {week.length > 0 && (
        <>
          <h2 className="section-title">{fill(t.home.week, { n: store.plan?.hours ?? 0 })}</h2>
          <ol className="steps week">
            {week.map((s) => (
              <li key={s.id} className="step">
                <span className="step-mark" aria-hidden="true" />
                <Link href={s.href} className="step-body"><span className="step-kind">{t.step[s.kind]}</span><span className="step-title">{s.title}</span></Link>
                <span className="step-time">{s.minutes >= 120 ? fill(t.common.hours, { n: Math.round(s.minutes / 60) }) : fill(t.common.min, { n: s.minutes })}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      <p className="page-links home-links">
        <Link href="/today/">{t.today.pageTitle}</Link>
        <Link href="/roadmap/">{t.home.seeRoadmap}</Link>
        <Link href="/practice/">{t.home.practise}</Link>
        <Link href="/start/">{t.home.how}</Link>
      </p>

      {!DESKTOP && (
        <aside className="home-app">
          <p>{t.download.signinPitch}</p>
          <Link href="/download/" className="btn sm">{t.download.navLabel}</Link>
        </aside>
      )}
    </div>
  );
}
