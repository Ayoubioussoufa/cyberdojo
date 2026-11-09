"use client";

import Link from "@/components/HoverLink";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { changePassword, deleteAccount, signOut, useAccount } from "@/lib/account";
import { fill, plural, useLang } from "@/i18n/LangProvider";
import { exportStore } from "@/lib/progress";

import { say } from "@/i18n/ui";

function Password() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { lang, t } = useLang();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = await changePassword(current, next);
    setMsg(problem ? { ok: false, text: say(lang, problem) } : { ok: true, text: t.account.changed });
    if (!problem) {
      setCurrent("");
      setNext("");
    }
  };
  return (
    <section className="acct-part">
      <h2>{t.account.changeTitle}</h2>
      <p className="muted">{t.account.changeText}</p>
      <form className="auth-form" onSubmit={(e) => void submit(e)}>
        <label htmlFor="pw-now">{t.account.current}</label>
        <input id="pw-now" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
        <label htmlFor="pw-new">{t.account.new}</label>
        <input id="pw-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required minLength={12} maxLength={128} />
        {msg && <p className={msg.ok ? "auth-ok" : "auth-error"} role="status">{msg.text}</p>}
        <button type="submit" className="btn">{t.account.change}</button>
      </form>
    </section>
  );
}

function Delete() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { lang, t } = useLang();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = await deleteAccount(password);
    if (problem) setError(say(lang, problem));
    else router.push(lang === "fr" ? "/fr/" : "/");
  };
  return (
    <section className="acct-part">
      <h2>{t.account.deleteTitle}</h2>
      <p className="muted">{t.account.deleteText}</p>
      {!open ? (
        <button type="button" className="btn danger" onClick={() => setOpen(true)}>{t.account.deleteMine}</button>
      ) : (
        <form className="auth-form" onSubmit={(e) => void submit(e)}>
          <label htmlFor="del-pw">{t.account.confirm}</label>
          <input id="del-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <div className="acct-row">
            <button type="submit" className="btn danger">{t.account.erase}</button>
            <button type="button" className="btn" onClick={() => setOpen(false)}>{t.account.keep}</button>
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
  const { lang, t } = useLang();

  if (!ready) return <p className="muted" aria-busy="true">{t.account.checking}</p>;
  if (!user) {
    return (
      <header className="page-head">
        <h1>{t.account.guestTitle}</h1>
        <p className="lede">{t.account.guestText}</p>
        <p><Link className="btn primary lg" href={`/signin/?next=${encodeURIComponent(lang === "fr" ? "/fr/account/" : "/account/")}`}>{t.account.signIn}</Link></p>
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
    if (problem) setError(say(lang, problem));
    else router.push(lang === "fr" ? "/fr/" : "/");
  };
  const label = { idle: t.account.saved, saving: t.account.saving, saved: t.account.saved, offline: t.account.offline };

  return (
    <>
      <header className="page-head">
        <h1>{user.username}</h1>
        <p className="lede">{fill(t.account.since, { date: new Date(user.createdAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { year: "numeric", month: "long", day: "numeric" }) })}</p>
      </header>
      <section className="acct-part">
        <h2>{t.account.progress}</h2>
        <p className="acct-sync" data-state={sync}>{label[sync]}</p>
        <div className="acct-row">
          <button type="button" className="btn" onClick={download}>{t.account.download}</button>
          <button type="button" className="btn" onClick={() => void leave()}>{t.account.signOut}</button>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
      </section>
      <Password />
      <Delete />
    </>
  );
}
