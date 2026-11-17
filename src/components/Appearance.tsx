"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n/LangProvider";
import { say } from "@/i18n/ui";
import { useAccount } from "@/lib/account";
import {
  applyPrefs,
  CODE_FONTS,
  cleanPrefs,
  DEFAULT_PREFS,
  FONTS,
  isDefault,
  readLocal,
  THEME_DEFAULTS,
  unreadable,
  writeLocal,
  type Prefs,
  type Theme,
} from "@/lib/appearance";

async function saveRemote(prefs: Prefs): Promise<string | null> {
  try {
    const res = await fetch("/api/prefs/", { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefs }) });
    if (res.ok) return null;
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return body.error ?? "That request wasn't valid.";
  } catch {
    return "offline";
  }
}

/**
 * Brings the account's settings to this browser once per sign-in, so a choice made
 * on another computer, or in the app, follows the learner. If the account has none
 * yet and this browser does, the browser's are saved to the account.
 */
export function AppearanceSync() {
  const { ready, user } = useAccount();
  const done = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || !user || done.current === user.id) return;
    done.current = user.id;
    void (async () => {
      try {
        const res = await fetch("/api/prefs/", { credentials: "same-origin" });
        if (!res.ok) return;
        const body = (await res.json()) as { prefs?: unknown; saved?: boolean };
        const r = cleanPrefs(body.prefs);
        if (!("prefs" in r)) return;
        if (body.saved) {
          applyPrefs(r.prefs);
          writeLocal(r.prefs);
          window.dispatchEvent(new Event("cyberdojo-appearance"));
        } else {
          const local = readLocal();
          if (local && !isDefault(local)) await saveRemote(local);
        }
      } catch {
        // Offline: this browser's copy stays in use.
      }
    })();
  }, [ready, user]);
  return null;
}

const themeNow = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

/** The account page's appearance section. Every change applies at once and saves itself. */
export function AppearanceSettings() {
  const { lang, t } = useLang();
  const A = t.appearance;
  const { user } = useAccount();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [theme, setTheme] = useState<Theme>("dark");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [problem, setProblem] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setPrefs(readLocal() ?? DEFAULT_PREFS);
    setTheme(themeNow());
    // The theme button changes data-theme: follow it, so the pickers edit the theme on screen.
    const watch = new MutationObserver(() => setTheme(themeNow()));
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const synced = () => setPrefs(readLocal() ?? DEFAULT_PREFS);
    window.addEventListener("cyberdojo-appearance", synced);
    return () => {
      watch.disconnect();
      window.removeEventListener("cyberdojo-appearance", synced);
    };
  }, []);

  const update = (next: Prefs) => {
    const r = cleanPrefs(next);
    if (!("prefs" in r)) return;
    setPrefs(r.prefs);
    applyPrefs(r.prefs);
    writeLocal(r.prefs);
    setProblem("");
    if (!user) return;
    setStatus("saving");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void saveRemote(r.prefs).then((err) => {
        setStatus(err ? "error" : "saved");
        if (err) setProblem(err === "offline" ? A.offline : say(lang, err));
      });
    }, 600);
  };

  const pickColour = (key: "bg" | "surface", value: string) => {
    const v = value.toLowerCase();
    const bad = unreadable(theme, v);
    if (bad) {
      setProblem(A.tooLow);
      return;
    }
    update({ ...prefs, [theme]: { ...prefs[theme], [key]: v } });
  };

  const colourField = (key: "bg" | "surface", label: string) => (
    <label className="appear-colour">
      <input type="color" value={prefs[theme][key] ?? THEME_DEFAULTS[theme][key]} onChange={(e) => pickColour(key, e.target.value)} />
      <span>{label}</span>
      <code>{prefs[theme][key] ?? A.themeDefault}</code>
    </label>
  );

  return (
    <section className="acct-part" aria-labelledby="appear-h">
      <h2 id="appear-h">{A.title}</h2>
      <p className="muted">{A.text}</p>

      <fieldset className="appear-group">
        <legend>{A.font}</legend>
        <div className="appear-choices">
          {FONTS.map((f) => (
            <label key={f.id} className="appear-choice">
              <input type="radio" name="appear-font" checked={prefs.font === f.id} onChange={() => update({ ...prefs, font: f.id })} />
              <span style={{ fontFamily: f.stack }}>{f.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="appear-group">
        <legend>{A.codeFont}</legend>
        <div className="appear-choices">
          {CODE_FONTS.map((f) => (
            <label key={f.id} className="appear-choice">
              <input type="radio" name="appear-code" checked={prefs.code === f.id} onChange={() => update({ ...prefs, code: f.id })} />
              <span style={{ fontFamily: f.stack }}>{f.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="appear-group">
        <legend>{theme === "dark" ? A.coloursDark : A.coloursLight}</legend>
        <p className="muted appear-hint">{A.coloursHint}</p>
        <div className="appear-colours">
          {colourField("bg", A.pageBg)}
          {colourField("surface", A.sectionBg)}
        </div>
        <div className="acct-row">
          <button type="button" className="btn sm" onClick={() => update({ ...prefs, [theme]: { bg: null, surface: null } })}>{A.resetColours}</button>
          <button type="button" className="btn sm" onClick={() => update(DEFAULT_PREFS)}>{A.resetAll}</button>
        </div>
      </fieldset>

      {problem && <p className="auth-error" role="alert">{problem}</p>}
      {user && status !== "idle" && !problem && <p className="acct-sync" data-state={status === "saving" ? "saving" : "saved"}>{status === "saving" ? A.saving : A.saved}</p>}
      {!user && <p className="muted">{A.guest}</p>}
    </section>
  );
}
