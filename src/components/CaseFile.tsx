"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyButton } from "./Copy";
import { CASE_MAP, type Choice } from "@/lib/cases";
import { roundDone } from "@/lib/progress";
import { freshSeed, Rng } from "@/lib/rng";
import { useLang } from "@/i18n/LangProvider";
import { fill as fillMsg } from "@/i18n/lang";

const inline = (s: string) => s.split(/(`[^`]+`)/).map((p, i) => (p.startsWith("`") && p.length > 1 ? <code key={i}>{p.slice(1, -1)}</code> : p));


/** Plays one branching case. Details change each time, and paths differ. */
export function CaseFilePlayer({ id }: { id: string }) {
  const file = CASE_MAP[id];
  const [run, setRun] = useState(0);
  // The first render must match the server's HTML, or React rebuilds the whole page
  // and drops the dark theme. So the details only change after the page has loaded.
  const [seed, setSeed] = useState(1);
  useEffect(() => setSeed(freshSeed()), []);
  const vars = useMemo(() => {
    const rng = new Rng(seed + run);
    return Object.fromEntries(Object.entries(file?.vars ?? {}).map(([k, v]) => [k, rng.pick(v)]));
  }, [file, seed, run]);
  const [at, setAt] = useState(file?.start ?? "");
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<Choice | null>(null);
  const [log, setLog] = useState<{ q: string; choice: string; note: string; score: number }[]>([]);
  const { lang, t } = useLang();
  const C = t.caseFile;
  const END_LABEL = { good: C.good, mixed: C.mixed, bad: C.bad };
  if (!file) return <p className="muted">{fillMsg(C.missing, { id })}</p>;

  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
  const node = file.nodes.find((n) => n.id === at);
  if (!node) return <p className="muted">{C.broken}</p>;
  const max = 3 * 5;

  const restart = () => {
    setRun(run + 1);
    setAt(file.start);
    setScore(0);
    setPicked(null);
    setLog([]);
  };

  if (node.end) {
    const stars = node.end === "good" ? (score >= 12 ? 3 : 2) : node.end === "mixed" ? 1 : 0;
    return (
      <section className={`case-end ${node.end}`}>
        <p className="band">{END_LABEL[node.end]}</p>
        <p className="case-text">{inline(fill(node.text))}</p>
        <p className="case-score"><strong>{fillMsg(C.stars, { n: stars })}</strong>, {fillMsg(C.points, { n: score, max })}</p>
        <h3 className="noterms">{C.expert}</h3>
        <p>{inline(fill(file.debrief))}</p>
        <h3 className="noterms">{C.decisions}</h3>
        <ol className="case-log">
          {log.map((l, i) => (
            <li key={i}>
              <span className={l.score > 0 ? "ok-t" : l.score < 0 ? "bad-t" : ""}>{inline(l.choice)}</span>
              <span className="muted">{inline(l.note)}</span>
            </li>
          ))}
        </ol>
        <div className="why-actions">
          <CopyButton className="link-btn" label={C.ask} done={t.common.copiedCap} build={() => `${fillMsg(C.prompt, { title: file.title, role: file.role })}\n\n${log.map((l, i) => `${i + 1}. ${C.situation} ${l.q}\n   ${C.chose} ${l.choice}\n   ${C.feedback} ${l.note}`).join("\n")}\n\n${C.outcome} ${END_LABEL[node.end ?? "mixed"]}`} />
          <button type="button" className="btn primary sm" onClick={restart}>{C.again}</button>
        </div>
      </section>
    );
  }

  const choose = (c: Choice) => {
    if (picked) return;
    setPicked(c);
    setScore(score + c.score);
    setLog([...log, { q: fill(node.text), choice: fill(c.label), note: fill(c.note), score: c.score }]);
  };
  const go = () => {
    const next = file.nodes.find((n) => n.id === picked?.to);
    setAt(picked?.to ?? file.start);
    setPicked(null);
    if (next?.end) roundDone(`case:${id}`, next.end === "good" ? 1 : next.end === "mixed" ? 0.5 : 0, 1);
  };

  return (
    <section className="case" lang={lang === "en" ? undefined : "en"}>
      <p className="case-text">{inline(fill(node.text))}</p>
      {node.evidence && <pre className="case-evidence">{fill(node.evidence)}</pre>}
      <p className="case-ask">{C.what}</p>
      <div className="opts">
        {node.choices?.map((c, i) => {
          const on = picked === c;
          const cls = ["opt", on ? (c.score > 0 ? "right" : c.score < 0 ? "wrong" : "picked") : ""].filter(Boolean).join(" ");
          return (
            <button key={c.label} type="button" className={cls} disabled={!!picked} onClick={() => choose(c)}>
              <span className="opt-key" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
              <span>{inline(fill(c.label))}</span>
            </button>
          );
        })}
      </div>
      {picked && (
        <div className={`why ${picked.score > 0 ? "ok" : picked.score < 0 ? "no" : ""}`}>
          <p><strong>{picked.score > 0 ? C.goodCall : picked.score < 0 ? C.cost : C.hmm}</strong> {inline(fill(picked.note))}</p>
          <div className="why-actions"><button type="button" className="btn primary sm" onClick={go}>{t.dojoHub.continue}</button></div>
        </div>
      )}
    </section>
  );
}
