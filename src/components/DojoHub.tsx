"use client";

import type { Dict } from "@/i18n/ui";
import { fill, useLang } from "@/i18n/LangProvider";
import Link from "@/components/HoverLink";
import type { BeltName, DojoModule } from "@/data/dojo";
import { useAccount } from "@/lib/account";
import { useStore } from "@/lib/progress";

type Mod = DojoModule & { missions: { id: string; title: string }[] };

const BELTS: BeltName[] = ["White", "Yellow", "Orange", "Green", "Blue"];

/** "Yellow" → "Yellow belt" or "Ceinture jaune". */
const beltWord = (t: Dict, belt: BeltName) => t.belt[belt.toLowerCase() as "white"];

/** A cloth belt that fills with stitched segments, one for each solved challenge. */
function Belt({ belt, done, total, big }: { belt: BeltName; done: number; total: number; big?: boolean }) {
  const { t } = useLang();
  return (
    <span className={`obi${big ? " big" : ""}`} data-belt={belt} role="img" aria-label={fill(t.dojoHub.beltLabel, { belt: beltWord(t, belt), n: done, total })}>
      {Array.from({ length: total }, (_, i) => <i key={i} className={i < done ? "on" : ""} />)}
    </span>
  );
}

export function ModuleBelt({ belt, ids }: { belt: BeltName; ids: string[] }) {
  const store = useStore();
  const done = ids.filter((id) => store.missions[id]).length;
  const { t } = useLang();
  return (
    <p className="module-belt">
      <Belt belt={belt} done={done} total={ids.length} big />
      <span className="meta">{fill(t.dojoHub.flagsOf, { n: done, total: ids.length, belt: beltWord(t, belt).toLowerCase() })}</span>
    </p>
  );
}

export function DojoHub({ modules }: { modules: Mod[] }) {
  const store = useStore();
  const { ready, user } = useAccount();
  const { lang, t } = useLang();
  const D = t.dojoHub;
  const all = modules.flatMap((m) => m.missions);
  const solved = all.filter((x) => store.missions[x.id]).length;
  const first = modules.find((m) => m.missions.some((x) => !store.missions[x.id]));
  const flag = first?.missions.find((x) => !store.missions[x.id]);

  return (
    <>
      <header className="dojo-head">
        <h1>Dojo</h1>
        <p className="lede">{D.lede}</p>
        <div className="dojo-score">
          <strong>{solved}<span> / {all.length}</span></strong>
          <span className="muted">{D.captured}</span>
          {flag && first && <Link className="btn primary" href={`/dojo/${first.id}/`} lang={lang === "en" ? undefined : "en"}>{fill(D.go, { verb: solved ? D.continue : D.start, title: flag.title })}</Link>}
        </div>
        {ready && !user && solved > 0 && <p className="auth-note"><Link href={`/signin/?next=${encodeURIComponent(lang === "fr" ? "/fr/dojo/" : "/dojo/")}`}>{t.signin.toUp}</Link> {D.keep}</p>}
      </header>

      {BELTS.map((b) => {
        const group = modules.filter((m) => m.belt === b);
        if (group.length === 0) return null;
        return (
          <section key={b} className="dojo-rank" data-belt={b}>
            <h2>{beltWord(t, b)}</h2>
            <ol className="dojo-mods">
              {group.map((m) => {
                const done = m.missions.filter((x) => store.missions[x.id]).length;
                return (
                  <li key={m.id}>
                    <Link href={`/dojo/${m.id}/`} className={done === m.missions.length ? "mod done" : "mod"}>
                      <span className="mod-title">{m.title}</span>
                      <span className="mod-skill">{fill(t.kind.learnTo, { skill: m.skill })}</span>
                      <Belt belt={m.belt} done={done} total={m.missions.length} />
                      <span className="meta">{fill(t.review.of, { n: done, total: m.missions.length })}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      <p className="dojo-credit muted">
        {D.inspired} <a href="https://pwn.college/" target="_blank" rel="noreferrer">pwn.college</a>{D.inspired2}
      </p>
    </>
  );
}
