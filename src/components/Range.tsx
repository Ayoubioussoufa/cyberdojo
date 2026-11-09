"use client";

import { fill, useLang } from "@/i18n/LangProvider";
import { useEffect, useMemo, useRef, useState } from "react";
import { CopyButton } from "./Copy";
import type { Built, Mission, RangeSet } from "@/lib/missions/kit";
import { loadRange } from "@/lib/missions/lazy";
import { setMission, useStore } from "@/lib/progress";
import { freshSeed, Rng } from "@/lib/rng";
import { COMMANDS } from "@/lib/shell/commands";
import { missionMessage } from "@/lib/tutor";

interface Line {
  kind: "cmd" | "out" | "sys";
  text: string;
  prompt?: string;
}

/** Briefs and hints use a little Markdown: `code` and **bold**. */
const inlineCode = (s: string) =>
  s.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    return part;
  });

function Terminal({ mission, onPass, passed }: { mission: Mission; onPass: () => void; passed: boolean }) {
  const [seed, setSeed] = useState(0);
  const world = useRef<Built | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState("");
  const [nav, setNav] = useState<number | null>(null);
  const screen = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const { lang, t } = useLang();
  const lastOut = useRef("");

  useEffect(() => {
    world.current = mission.build(new Rng(freshSeed()));
    setPrompt(world.current.shell.prompt());
    setLines(mission.greeting ? [{ kind: "sys", text: mission.greeting }] : []);
    lastOut.current = "";
    setValue("");
  }, [mission, seed]);

  useEffect(() => {
    if (screen.current) screen.current.scrollTop = screen.current.scrollHeight;
  }, [lines]);

  const run = (cmd: string) => {
    const w = world.current;
    if (!w) return;
    const sh = w.shell;
    const shown = sh.prompt();
    const out = sh.run(cmd);
    lastOut.current = out;
    setPrompt(sh.prompt());
    if (sh.cleared) {
      sh.cleared = false;
      setLines([]);
    } else {
      setLines((l) => [...l, { kind: "cmd", text: cmd, prompt: shown }, ...(out ? [{ kind: "out" as const, text: out.replace(/\n$/, "") }] : [])]);
    }
    setNav(null);
    if (sh.submitted.length && w.flag !== undefined && !sh.submitted.includes(w.flag)) {
      sh.submitted = [];
      setLines((l) => [...l, { kind: "sys", text: t.range.notFlag }]);
    }
    if (!passed && mission.passed(w, cmd)) onPass();
  };

  const complete = () => {
    const w = world.current;
    if (!w) return;
    const m = /(\S*)$/.exec(value);
    const word = m?.[1] ?? "";
    const isFirst = value.trim() === word;
    const before = value.slice(0, value.length - word.length);
    const slash = word.lastIndexOf("/");
    const dirPart = slash >= 0 ? word.slice(0, slash + 1) : "";
    const stem = word.slice(slash + 1);
    let names: string[] = [];
    if (isFirst && !word.includes("/")) names = [...new Set([...Object.keys(COMMANDS), ...Object.keys(w.shell.programs)])].filter((c) => c.startsWith(stem));
    else {
      try {
        const dir = w.shell.fs.lookup(dirPart || ".", w.shell.cwd, w.shell.creds);
        names = [...dir.children.entries()]
          .filter(([n]) => n.startsWith(stem) && (stem.startsWith(".") || !n.startsWith(".")))
          .map(([n, c]) => (c.kind === "dir" ? `${n}/` : n));
      } catch {
        names = [];
      }
    }
    if (names.length === 1) setValue(`${before}${dirPart}${names[0]}${(names[0] as string).endsWith("/") ? "" : " "}`);
    else if (names.length > 1) {
      let common = names[0] as string;
      for (const n of names) while (!n.startsWith(common)) common = common.slice(0, -1);
      if (common.length > stem.length) setValue(`${before}${dirPart}${common}`);
      else setLines((l) => [...l, { kind: "cmd", text: value, prompt: world.current?.shell.prompt() ?? "" }, { kind: "out", text: names.join("  ") }]);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const hist = world.current?.shell.history ?? [];
    if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!hist.length) return;
      const i = nav === null ? hist.length - 1 : Math.max(0, nav - 1);
      setNav(i);
      setValue(hist[i] as string);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (nav === null) return;
      const i = nav + 1;
      setNav(i >= hist.length ? null : i);
      setValue(i >= hist.length ? "" : (hist[i] as string));
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div className="term-wrap">
      <div className="term-bar">
        <span className="term-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="term-title">{t.range.title}</span>
        <button type="button" className="term-reset" onClick={() => setSeed((s) => s + 1)}>{t.range.reset}</button>
      </div>
      <div className="term" ref={screen} onClick={() => { if (!window.getSelection()?.toString()) input.current?.focus(); }}>
        {lines.map((l, i) =>
          l.kind === "cmd" ? (
            <div key={i} className="term-line"><span className="term-prompt">{l.prompt}</span>{l.text}</div>
          ) : (
            <pre key={i} className={l.kind === "sys" ? "term-sys" : "term-out"}>{l.text}</pre>
          ),
        )}
        <form
          className="term-line term-input"
          onSubmit={(e) => {
            e.preventDefault();
            run(value);
            setValue("");
          }}
        >
          <label className="term-prompt" htmlFor={`in-${mission.id}`}>{prompt}</label>
          <input id={`in-${mission.id}`} ref={input} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={onKey} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-label={t.range.type} />
        </form>
      </div>
      <div className="term-foot">
        <span className="term-keys"><code>{t.range.submitCmd}</code> {t.range.k1} <kbd>Tab</kbd> {t.range.k2} <kbd>↑</kbd> {t.range.k3} <code>man ls</code> {t.range.k4} <code>help</code> {t.range.k5}</span>
        <CopyButton className="link-btn on-dark" label={t.range.stuck} done={t.common.copiedCap} build={() => missionMessage(mission.title, mission.brief, world.current?.shell.history ?? [], lastOut.current, lang)} />
      </div>
    </div>
  );
}

/** A ladder of missions in one terminal. */
/** `bare` drops the title, for a page that already shows it in its own header. */
export function Range({ id, bare = false }: { id: string; bare?: boolean }) {
  const [loaded, setLoaded] = useState<{ id: string; range: RangeSet | null } | null>(null);
  useEffect(() => {
    let live = true;
    void loadRange(id).then((range) => {
      if (live) setLoaded({ id, range });
    });
    return () => {
      live = false;
    };
  }, [id]);
  if (!loaded || loaded.id !== id) return <RangeSkeleton />;
  if (!loaded.range) return <p className="muted">Mission set {id} is missing.</p>;
  return <RangeView range={loaded.range} bare={bare} />;
}

export const RangeSkeleton = () => <section className="range range-wait" aria-busy="true" aria-label={useLang().t.misc.loadingRange} />;

function RangeView({ range, bare }: { range: RangeSet; bare: boolean }) {
  const store = useStore();
  const missions = range.missions;
  const firstOpen = missions.findIndex((m) => !store.missions[m.id]);
  const [choice, setChoice] = useState<number | null>(null);
  const [hints, setHints] = useState(0);
  const [won, setWon] = useState<string | null>(null);
  const { lang, t } = useLang();
  const R = t.range;
  const at = choice ?? (firstOpen < 0 ? 0 : firstOpen);
  const mission = missions[at];

  if (!mission) return <p className="muted">{R.empty}</p>;
  const passed = !!store.missions[mission.id];
  const go = (i: number) => {
    setChoice(i);
    setHints(0);
  };

  return (
    <section className="range">
      <div className="range-head">
        <span className="band">{R.band}</span>
        {!bare && <h3 className="noterms">{range.title}</h3>}
        <ol className="range-steps" aria-label={R.missions}>
          {missions.map((m, i) => (
            <li key={m.id}>
              <button type="button" className={`${i === at ? "on " : ""}${store.missions[m.id] ? "ok" : ""}`} onClick={() => go(i)} aria-label={fill(R.mission, { n: i + 1, title: m.title })} aria-current={i === at}>
                {store.missions[m.id] ? "✓" : i + 1}
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className="mission">
        <p className="mission-title noterms">{fill(R.mission, { n: at + 1, title: mission.title })}</p>
        <p className="mission-brief noterms" lang={lang === "en" ? undefined : "en"}>{inlineCode(mission.brief)}</p>
      </div>
      <Terminal
        mission={mission}
        passed={passed}
        onPass={() => {
          // Stay on this mission so its debrief shows; "Next mission" moves on.
          setChoice(at);
          setWon(mission.id);
          setMission(mission.id);
        }}
      />
      {passed ? (
        <div className="why ok mission-win">
          <span className={`hanko${won === mission.id ? " just" : ""}`} aria-hidden="true" lang="ja">合格</span>
          <strong>{R.complete}</strong> <span className="noterms" lang={lang === "en" ? undefined : "en"}>{inlineCode(mission.debrief)}</span>
          {at < missions.length - 1 && (
            <div className="why-actions">
              <button type="button" className="btn primary sm" onClick={() => go(at + 1)}>{R.next}</button>
            </div>
          )}
        </div>
      ) : (
        <div className="hints">
          {mission.hints.slice(0, hints).map((h, i) => (
            <p key={i} className="noterms"><strong>{fill(R.hint, { n: i + 1 })}</strong> <span lang={lang === "en" ? undefined : "en"}>{inlineCode(h)}</span></p>
          ))}
          {hints < mission.hints.length && (
            <button type="button" className="link-btn" onClick={() => setHints(hints + 1)}>
              {hints === 0 ? R.firstHint : R.moreHint}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
