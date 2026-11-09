"use client";

import { fill, plural } from "@/i18n/LangProvider";
import { skillName } from "@/i18n/ui";
import Link from "@/components/HoverLink";
import { useAccount } from "@/lib/account";
import { BELTS } from "@/data/path";
import { useLang } from "@/i18n/LangProvider";
import { currentBelt, isDone, skillBars, streak, type PathStep } from "@/lib/pathState";
import { today, useStore } from "@/lib/progress";

/** "Yellow belt" → the "yellow" and "yellowMeaning" entries of the belt strings. */
export function useBelt() {
  const { t } = useLang();
  return (belt: (typeof BELTS)[number]) => {
    const k = (belt.name.split(" ")[0] ?? "").toLowerCase() as "white";
    return { name: t.belt[k] ?? belt.name, meaning: t.belt[`${k}Meaning`] ?? belt.meaning };
  };
}

export function BeltChip({ belt }: { belt: (typeof BELTS)[number] }) {
  const said = useBelt()(belt);
  return (
    <div className="belt-chip">
      <span className="belt-bar" style={{ background: belt.colour }} aria-hidden="true" />
      <div>
        <strong>{said.name}</strong>
        <span className="meta">{said.meaning}</span>
      </div>
    </div>
  );
}

function Calendar({ days }: { days: Record<string, number> }) {
  const weeks = 18;
  const end = new Date(`${today()}T12:00:00`);
  const start = new Date(end);
  start.setDate(end.getDate() - (weeks * 7 - 1) - ((end.getDay() + 6) % 7) + 6);
  const cells: { iso: string; n: number }[] = [];
  const p = (n: number) => String(n).padStart(2, "0");
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    cells.push({ iso, n: days[iso] ?? 0 });
  }
  const level = (n: number) => (n === 0 ? 0 : n < 3 ? 1 : n < 8 ? 2 : n < 15 ? 3 : 4);
  const active = cells.filter((c) => c.n).length;
  const { lang, t } = useLang();
  const P = t.progress;
  return (
    <div>
      <div className="cal" role="img" aria-label={fill(P.calLabel, { n: active, weeks })}>
        {cells.map((c) => <span key={c.iso} className={`cal-${level(c.n)}`} title={`${c.iso}: ${plural(lang, P.things, c.n)}`} />)}
      </div>
      <p className="meta cal-legend"><span>{fill(P.calLegend, { n: active, weeks })}</span><span className="cal-key">{P.less} <i className="cal-0" /><i className="cal-1" /><i className="cal-2" /><i className="cal-3" /><i className="cal-4" /> {P.more}</span></p>
    </div>
  );
}

const DOJO_FLAGS = 54;

/** Guests should know where their work lives before they lose it. */
function SaveNote() {
  const { ready, user } = useAccount();
  const { lang, t } = useLang();
  if (!ready || user) return null;
  return <p className="auth-note">{t.progress.guest} <Link href={`/signin/?next=${encodeURIComponent(lang === "fr" ? "/fr/skills/" : "/skills/")}`}>{t.signin.toUp}</Link> {t.progress.guest2}</p>;
}

export function ProgressBoard({ path }: { path: PathStep[] }) {
  const store = useStore();
  const { lang, t } = useLang();
  const P = t.progress;
  const beltOf = useBelt();
  const b = currentBelt(path, store);
  const at = BELTS.indexOf(b.belt);
  const count = (k: PathStep["kind"]) => {
    const all = path.filter((s) => s.kind === k);
    return `${all.filter((s) => isDone(s, store)).length}/${all.length}`;
  };
  const bars = skillBars(path, store);
  const can = path.filter((s) => s.kind === "lesson" && s.builds && isDone(s, store)).reverse();
  const asked = Object.values(store.first);
  const right = asked.filter(Boolean).length;
  return (
    <>
      <section className="card belts">
        <BeltChip belt={b.belt} />
        <ol className="belt-row" aria-label={P.belts}>
          {BELTS.map((x, i) => (
            <li key={x.name} className={i <= at ? "got" : ""} title={`${beltOf(x).name}: ${beltOf(x).meaning}`}>
              <span style={{ background: i <= at ? x.colour : undefined }} />
              <small>{beltOf(x).name.replace(/ belt$|^Ceinture /, "")}</small>
            </li>
          ))}
        </ol>
        {b.next ? (
          <>
            <span className="meter" aria-hidden="true"><i style={{ width: `${b.need ? (b.got / b.need) * 100 : 0}%` }} /></span>
            <p className="meta">{fill(P.toward, { got: b.got, need: b.need, belt: beltOf(b.next).name.toLowerCase() })} <Link href="/roadmap/">{P.whatsNext}</Link></p>
          </>
        ) : <p className="meta">{P.allBelts}</p>}
      </section>

      <SaveNote />
      <section className="stat-tiles">
        <div className="card"><strong>{count("lesson")}</strong><span>{P.lessons}</span></div>
        <div className="card"><strong>{count("project")}</strong><span>{P.parts}</span></div>
        <div className="card"><strong>{count("machine")}</strong><span>{P.machines}</span></div>
        <div className="card"><strong>{Object.keys(store.missions).filter((id) => id.startsWith("dojo-")).length}/{DOJO_FLAGS}</strong><span>{P.flags}</span></div>
        <div className="card"><strong>{count("gate")}</strong><span>{P.gates}</span></div>
        <div className="card"><strong>{streak(store.days, today())}</strong><span>{P.streak}</span></div>
        <div className="card"><strong>{asked.length ? `${Math.round((right / asked.length) * 100)}%` : "–"}</strong><span>{P.first}</span></div>
      </section>

      <h2 className="section-title">{P.when}</h2>
      <Calendar days={store.days} />

      <h2 className="section-title">{P.can}</h2>
      {can.length ? (
        <ul className="cando-list">{can.slice(0, 40).map((s) => <li key={s.id}><span className="cando-tick" aria-hidden="true">✓</span>{fill(P.youCan, { skill: s.builds ?? "" })}</li>)}</ul>
      ) : <p className="muted">{P.canEmpty}</p>}

      <h2 className="section-title">{P.studied}</h2>
      <p className="muted">{P.studiedText}</p>
      <ul className="skill-bars">
        {bars.map((s) => (
          <li key={s.area} title={fill(P.ofLessons, { n: s.done, total: s.total })}>
            <span className="skill-name">{skillName(lang, s.area)}</span>
            <span className="meter small" aria-hidden="true"><i style={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%` }} /></span>
            <span className="skill-count">{s.done}/{s.total}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
