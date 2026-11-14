"use client";

import Link from "@/components/HoverLink";
import { useBelt } from "@/components/Progress";
import { fill, plural, useLang } from "@/i18n/LangProvider";
import { currentBelt, nextStep, streak, type PathStep } from "@/lib/pathState";
import { today, useStore } from "@/lib/progress";

const dueCount = (srs: Record<string, { due: string }>, now: string, flashcards: boolean) =>
  Object.entries(srs).filter(([k, c]) => k.startsWith("fc:") === flashcards && (c.due ?? "9999") <= now).length;

interface Row {
  key: string;
  label: string;
  href: string;
  note?: string;
}

export function Today({ path }: { path: PathStep[] }) {
  const store = useStore();
  const { lang, t } = useLang();
  const T = t.today;
  const now = today();
  const beltOf = useBelt();

  const belt = currentBelt(path, store);
  const next = nextStep(path, store);
  const reviewDue = dueCount(store.srs, now, false);
  const cardsDue = dueCount(store.srs, now, true);
  const mistakes = store.mistakes.length;
  const doneToday = store.days[now] ?? 0;
  const run = streak(store.days, now);

  const rows: Row[] = [];
  if (next) rows.push({ key: "next", label: fill(T.nextUp, { title: next.title }), href: next.href, note: t.step[next.kind] });
  if (reviewDue > 0) rows.push({ key: "review", label: plural(lang, T.reviewDue, reviewDue), href: "/review/" });
  if (cardsDue > 0) rows.push({ key: "cards", label: plural(lang, T.cardsDue, cardsDue), href: "/practice/flashcards/" });
  if (mistakes > 0) rows.push({ key: "mistakes", label: plural(lang, T.mistakesDue, mistakes), href: "/practice/mistakes/" });
  rows.push({ key: "mix", label: T.mix, href: "/practice/mix/" });

  return (
    <div className="today">
      <section className="today-hero">
        <div className="today-streak">
          <strong>{run}</strong>
          <span>{plural(lang, T.streak, run)}</span>
        </div>
        <p className="today-count">{doneToday > 0 ? plural(lang, T.doneToday, doneToday) : T.notYet}</p>
      </section>

      {belt.next && (
        <section className="today-belt">
          <span className="today-belt-dot" style={{ background: belt.belt.colour }} aria-hidden />
          <span className="today-belt-text">{fill(T.towardBelt, { got: belt.got, need: belt.need, belt: beltOf(belt.next).name.toLowerCase() })}</span>
          <span className="meter" aria-hidden><i style={{ width: `${belt.need ? (belt.got / belt.need) * 100 : 0}%` }} /></span>
        </section>
      )}

      <h2 className="today-plan-title">{T.plan}</h2>
      <ol className="today-plan">
        {rows.map((r) => (
          <li key={r.key}>
            <Link href={r.href} className="today-row">
              <span className="today-row-main">
                {r.note && <span className="today-row-kind">{r.note}</span>}
                <span className="today-row-label">{r.label}</span>
              </span>
              <span className="today-row-go" aria-hidden>→</span>
            </Link>
          </li>
        ))}
      </ol>
      {reviewDue === 0 && cardsDue === 0 && mistakes === 0 && !next && <p className="today-clear">{T.allDone}</p>}
    </div>
  );
}
