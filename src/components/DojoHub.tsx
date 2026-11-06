"use client";

import Link from "@/components/HoverLink";
import type { BeltName, DojoModule } from "@/data/dojo";
import { useAccount } from "@/lib/account";
import { useStore } from "@/lib/progress";

type Mod = DojoModule & { missions: { id: string; title: string }[] };

const BELTS: BeltName[] = ["White", "Yellow", "Orange", "Green", "Blue"];

/** A cloth belt that fills with stitched segments, one for each solved challenge. */
function Belt({ belt, done, total, big }: { belt: BeltName; done: number; total: number; big?: boolean }) {
  return (
    <span className={`obi${big ? " big" : ""}`} data-belt={belt} role="img" aria-label={`${belt} belt, ${done} of ${total} solved`}>
      {Array.from({ length: total }, (_, i) => <i key={i} className={i < done ? "on" : ""} />)}
    </span>
  );
}

export function ModuleBelt({ belt, ids }: { belt: BeltName; ids: string[] }) {
  const store = useStore();
  const done = ids.filter((id) => store.missions[id]).length;
  return (
    <p className="module-belt">
      <Belt belt={belt} done={done} total={ids.length} big />
      <span className="meta">{done} of {ids.length} flags, {belt.toLowerCase()} belt</span>
    </p>
  );
}

export function DojoHub({ modules }: { modules: Mod[] }) {
  const store = useStore();
  const { ready, user } = useAccount();
  const all = modules.flatMap((m) => m.missions);
  const solved = all.filter((x) => store.missions[x.id]).length;
  const first = modules.find((m) => m.missions.some((x) => !store.missions[x.id]));
  const flag = first?.missions.find((x) => !store.missions[x.id]);

  return (
    <>
      <header className="dojo-head">
        <h1>Dojo</h1>
        <p className="lede">Each challenge hides a flag on a machine that runs in your browser. Get it with the commands you've learned, submit it, move on. No multiple choice: if you have the flag, you did it.</p>
        <div className="dojo-score">
          <strong>{solved}<span> / {all.length}</span></strong>
          <span className="muted">flags captured</span>
          {flag && first && <Link className="btn primary" href={`/dojo/${first.id}/`}>{solved ? "Continue" : "Start"}: {flag.title}</Link>}
        </div>
        {ready && !user && solved > 0 && <p className="auth-note"><Link href="/signin/?next=/dojo/">Create an account</Link> to keep these flags on every device.</p>}
      </header>

      {BELTS.map((b) => {
        const group = modules.filter((m) => m.belt === b);
        if (group.length === 0) return null;
        return (
          <section key={b} className="dojo-rank" data-belt={b}>
            <h2>{b} belt</h2>
            <ol className="dojo-mods">
              {group.map((m) => {
                const done = m.missions.filter((x) => store.missions[x.id]).length;
                return (
                  <li key={m.id}>
                    <Link href={`/dojo/${m.id}/`} className={done === m.missions.length ? "mod done" : "mod"}>
                      <span className="mod-title">{m.title}</span>
                      <span className="mod-skill">Learn to {m.skill}.</span>
                      <Belt belt={m.belt} done={done} total={m.missions.length} />
                      <span className="meta">{done} of {m.missions.length}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      <p className="dojo-credit muted">
        Inspired by <a href="https://pwn.college/" target="_blank" rel="noreferrer">pwn.college</a>, Arizona State University's free dojo. Everything here is simulated and defensive, so when you want real binaries, real memory corruption and real exploitation, go there next.
      </p>
    </>
  );
}
