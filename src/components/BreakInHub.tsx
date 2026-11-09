"use client";

import Link from "@/components/HoverLink";
import { useAccount } from "@/lib/account";
import { useStore } from "@/lib/progress";
import { fill, useLang } from "@/i18n/LangProvider";

type Cls = { id: string; title: string; tagline: string; owasp: string; flags: string[] };

/** A small meter that fills as challenges in a class are solved. */
function Meter({ done, total }: { done: number; total: number }) {
  return (
    <span className="meter small breakin-meter" aria-hidden="true">
      <i style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
    </span>
  );
}

export function BreakInHub({ classes }: { classes: Cls[] }) {
  const store = useStore();
  const { lang, t } = useLang();
  const { ready, user } = useAccount();
  const all = classes.flatMap((c) => c.flags);
  const solved = all.filter((id) => store.missions[id]).length;
  const next = classes.find((c) => c.flags.some((id) => !store.missions[id]));

  return (
    <>
      <header className="page-head">
        <p className="kicker">{t.breakin.kicker}</p>
        <h1>{t.breakin.h1}</h1>
        <p className="lede">{t.breakin.lede}</p>
      </header>

      <div className="callout law">
        <span className="label">{t.breakin.safeLabel}</span>
        <p>{t.breakin.safe}</p>
      </div>

      <div className="dojo-score">
        <strong>{solved}<span> / {all.length}</span></strong>
        <span className="muted">{t.breakin.captured}</span>
        {next && <Link className="btn primary" href={`/break-in/${next.id}/`}>{fill(t.breakin.go, { title: next.title })}</Link>}
      </div>
      {ready && !user && solved > 0 && (
        <p className="auth-note">
          <Link href={`/signin/?next=${encodeURIComponent(lang === "fr" ? "/fr/break-in/" : "/break-in/")}`}>{t.signin.toUp}</Link> {t.breakin.keep}
        </p>
      )}

      <div className="grid3 breakin-grid">
        {classes.map((c) => {
          const done = c.flags.filter((id) => store.missions[id]).length;
          const complete = done === c.flags.length && c.flags.length > 0;
          return (
            <Link key={c.id} href={`/break-in/${c.id}/`} className={`card link-card breakin-card${complete ? " done" : ""}`}>
              <span className="breakin-top">
                <span className="phase-n">{c.owasp}</span>
                <span className="muted">{complete ? t.breakin.cleared : fill(t.breakin.of, { n: done, total: c.flags.length })}</span>
              </span>
              <h3>{c.title}</h3>
              <p className="muted">{c.tagline}</p>
              <Meter done={done} total={c.flags.length} />
            </Link>
          );
        })}
      </div>

      <p className="dojo-credit muted">{t.breakin.foot} <Link href="/practice/labs/">{t.breakin.footLink}</Link>.</p>
    </>
  );
}

/** The progress strip at the top of one attack class. */
export function BreakInProgress({ flags }: { flags: string[] }) {
  const store = useStore();
  const { lang, t } = useLang();
  const done = flags.filter((id) => store.missions[id]).length;
  const complete = done === flags.length && flags.length > 0;
  return (
    <p className="breakin-head-progress">
      <Meter done={done} total={flags.length} />
      <span className="meta">{complete ? t.breakin.classCleared : fill(t.breakin.of, { n: done, total: flags.length })}</span>
    </p>
  );
}
