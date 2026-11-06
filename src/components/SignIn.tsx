"use client";

import Link from "@/components/HoverLink";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, signUp, useAccount } from "@/lib/account";
import { hasProgress } from "@/lib/merge";
import { useStore } from "@/lib/progress";

/** Only paths on this site, so a crafted link can't send someone elsewhere after sign-in. */
const safeNext = (search: string) => {
  const next = new URLSearchParams(search).get("next");
  return next && /^\/(?![/\\])/.test(next) ? next : "/";
};

export function SignIn() {
  const router = useRouter();
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
        <h1>You're signed in</h1>
        <p className="muted">Signed in as <strong>{user.username}</strong>. Your progress saves as you go.</p>
        <Link className="btn primary" href="/">Back to training</Link>
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
      setError(problem);
      return;
    }
    setPassword("");
    router.push(safeNext(window.location.search));
  };

  const up = mode === "up";
  return (
    <section className="auth-card">
      <h1>{up ? "Create your account" : "Welcome back"}</h1>
      <p className="muted">{up ? "Your belts, flags and answers follow you to any device." : "Pick up exactly where you stopped."}</p>
      {hasProgress(store) && <p className="auth-note">The progress in this browser comes with you when you {up ? "create your account" : "sign in"}.</p>}
      <form onSubmit={(e) => void submit(e)} className="auth-form">
        <label htmlFor="auth-user">Username</label>
        <input id="auth-user" name="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} required minLength={3} maxLength={32} />
        <label htmlFor="auth-pass">Password</label>
        <input id="auth-pass" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={up ? "new-password" : "current-password"} required minLength={up ? 12 : 1} maxLength={128} aria-describedby={up ? "auth-rule" : undefined} />
        {up && <p id="auth-rule" className="auth-rule">At least 12 characters. A password manager is best. There's no email on your account, so a forgotten password can only be reset by whoever runs this site.</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="btn primary lg" disabled={busy}>{busy ? "One moment…" : up ? "Create account" : "Sign in"}</button>
      </form>
      <p className="auth-swap">
        {up ? "Already have an account?" : "New here?"}{" "}
        <button type="button" className="link-btn" onClick={() => { setMode(up ? "in" : "up"); setError(""); }}>{up ? "Sign in" : "Create an account"}</button>
      </p>
      <p className="auth-guest"><Link href="/">Keep training as a guest</Link>. Your progress stays in this browser only.</p>
    </section>
  );
}
