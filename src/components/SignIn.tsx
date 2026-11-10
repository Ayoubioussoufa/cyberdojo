"use client";

import Link from "@/components/HoverLink";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, signUp, useAccount } from "@/lib/account";
import { hasProgress } from "@/lib/merge";
import { useStore } from "@/lib/progress";
import { useLang } from "@/i18n/LangProvider";
import { localize } from "@/i18n/lang";
import { say } from "@/i18n/ui";

/** Only paths on this site, so a crafted link can't send someone elsewhere after sign-in. */
const safeNext = (search: string) => {
  const next = new URLSearchParams(search).get("next");
  return next && /^\/(?![/\\])/.test(next) ? next : "/";
};

export function SignIn() {
  const router = useRouter();
  const { lang, t } = useLang();
  const { user } = useAccount();
  const store = useStore();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <section className="auth-card">
        <h1>{t.signin.inTitle}</h1>
        <p className="muted">{t.signin.inAs} <strong>{user.username}</strong>. {t.signin.inSaves}</p>
        <Link className="btn primary" href="/">{t.signin.back}</Link>
      </section>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const problem = await (mode === "in" ? signIn : signUp)(username.trim(), password);
    setBusy(false);
    if (problem) {
      setError(say(lang, problem));
      return;
    }
    setPassword("");
    // A full load, not a client move: the router may hold redirects it was given while signed out.
    window.location.assign(localize(safeNext(window.location.search), lang));
  };

  const up = mode === "up";
  return (
    <section className="auth-card">
      <h1>{up ? t.signin.upTitle : t.signin.welcome}</h1>
      <p className="muted">{up ? t.signin.upLede : t.signin.inLede}</p>
      {hasProgress(store) && <p className="auth-note">{up ? t.signin.noteUp : t.signin.noteIn}</p>}
      <form onSubmit={(e) => void submit(e)} className="auth-form">
        <label htmlFor="auth-user">{t.signin.username}</label>
        <input id="auth-user" name="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} required minLength={3} maxLength={32} />
        <label htmlFor="auth-pass">{t.signin.password}</label>
        <input id="auth-pass" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={up ? "new-password" : "current-password"} required minLength={up ? 12 : 1} maxLength={128} aria-describedby={up ? "auth-rule" : undefined} />
        {up && <p id="auth-rule" className="auth-rule">{t.signin.rule}</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="btn primary lg" disabled={busy}>{busy ? t.signin.busy : up ? t.signin.create : t.signin.submit}</button>
      </form>
      <p className="auth-swap">
        {up ? t.signin.haveOne : t.signin.newHere}{" "}
        <button type="button" className="link-btn" onClick={() => { setMode(up ? "in" : "up"); setError(""); }}>{up ? t.signin.toIn : t.signin.toUp}</button>
      </p>
      <p className="auth-guest"><Link href="/">{t.signin.guest}</Link>. {t.signin.guestNote}</p>
    </section>
  );
}
