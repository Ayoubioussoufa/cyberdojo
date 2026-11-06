"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { changePassword, deleteAccount, signOut, useAccount } from "@/lib/account";
import { exportStore } from "@/lib/progress";

const LABEL = { idle: "Saved", saving: "Saving…", saved: "Saved", offline: "Not saved yet: can't reach the server" } as const;

function Password() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = await changePassword(current, next);
    setMsg(problem ? { ok: false, text: problem } : { ok: true, text: "Password changed. Every other device has been signed out." });
    if (!problem) {
      setCurrent("");
      setNext("");
    }
  };
  return (
    <section className="acct-part">
      <h2>Change your password</h2>
      <p className="muted">Changing it signs out every other device, so it's also what to do if you think someone else got in.</p>
      <form className="auth-form" onSubmit={(e) => void submit(e)}>
        <label htmlFor="pw-now">Current password</label>
        <input id="pw-now" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
        <label htmlFor="pw-new">New password</label>
        <input id="pw-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required minLength={12} maxLength={128} />
        {msg && <p className={msg.ok ? "auth-ok" : "auth-error"} role="status">{msg.text}</p>}
        <button type="submit" className="btn">Change password</button>
      </form>
    </section>
  );
}

function Delete() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = await deleteAccount(password);
    if (problem) setError(problem);
    else router.push("/");
  };
  return (
    <section className="acct-part">
      <h2>Delete your account</h2>
      <p className="muted">This erases your account and all your saved progress from the server. It can't be undone. Download a copy first if you want to keep it.</p>
      {!open ? (
        <button type="button" className="btn danger" onClick={() => setOpen(true)}>Delete my account</button>
      ) : (
        <form className="auth-form" onSubmit={(e) => void submit(e)}>
          <label htmlFor="del-pw">Enter your password to confirm</label>
          <input id="del-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <div className="acct-row">
            <button type="submit" className="btn danger">Erase everything</button>
            <button type="button" className="btn" onClick={() => setOpen(false)}>Keep my account</button>
          </div>
        </form>
      )}
    </section>
  );
}

export function Account() {
  const { ready, user, sync } = useAccount();
  const router = useRouter();
  const [error, setError] = useState("");

  if (!ready) return <p className="muted" aria-busy="true">Checking your account…</p>;
  if (!user) {
    return (
      <header className="page-head">
        <h1>You're training as a guest</h1>
        <p className="lede">Your progress lives in this browser. An account keeps it safe and takes it to your other devices.</p>
        <p><Link className="btn primary lg" href="/signin/?next=/account/">Sign in or create an account</Link></p>
      </header>
    );
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportStore()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cyberdojo-${user.username}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const leave = async () => {
    const problem = await signOut();
    if (problem) setError(problem);
    else router.push("/");
  };

  return (
    <>
      <header className="page-head">
        <h1>{user.username}</h1>
        <p className="lede">Training since {new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}.</p>
      </header>
      <section className="acct-part">
        <h2>Your progress</h2>
        <p className="acct-sync" data-state={sync}>{LABEL[sync]}</p>
        <div className="acct-row">
          <button type="button" className="btn" onClick={download}>Download a copy</button>
          <button type="button" className="btn" onClick={() => void leave()}>Sign out</button>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
      </section>
      <Password />
      <Delete />
    </>
  );
}
