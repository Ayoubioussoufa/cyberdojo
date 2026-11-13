"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fill, useLang } from "@/i18n/LangProvider";
import { say } from "@/i18n/ui";
import { getStatus, pullModel, saveSettings } from "@/lib/tutor-client";
import type { ModelChoice, Tier, TutorStatus } from "@/lib/tutor-types";

const TIERS: Tier[] = ["light", "standard", "strong"];
const REFRESH_MS = 3000;

/** One download at a time: `share` is 0 to 1, or null until Ollama reports a size. */
interface Pull {
  model: string;
  share: number | null;
}

function useStatus() {
  const [status, setStatus] = useState<TutorStatus | null>(null);
  const refresh = useCallback(async () => {
    try {
      setStatus(await getStatus());
    } catch {
      // The app's own server didn't answer: the next tick tries again.
    }
  }, []);
  // Ollama may be started, or the index may move on, while this page is open.
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => document.visibilityState === "visible" && void refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);
  return { status, refresh };
}

const isInstalled = (status: TutorStatus, name: string) => status.installed.some((m) => m.name === name || m.name === `${name}:latest`);

function Progress({ pull, onCancel }: { pull: Pull; onCancel: () => void }) {
  const { t } = useLang();
  const pct = pull.share === null ? null : Math.floor(pull.share * 100);
  return (
    <div className="pull">
      <span className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined} aria-label={pull.model}><i style={{ width: `${pct ?? 0}%` }} /></span>
      <span className="pull-text">{pct === null ? t.tutor.starting : fill(t.tutor.pulling, { pct })}</span>
      <button type="button" className="link-btn" onClick={onCancel}>{t.tutor.cancel}</button>
    </div>
  );
}

export function TutorSetup() {
  const { lang, t } = useLang();
  const { status, refresh } = useStatus();
  const [pull, setPull] = useState<Pull | null>(null);
  const [error, setError] = useState("");
  const [host, setHost] = useState("");
  const [custom, setCustom] = useState("");
  const stopper = useRef<AbortController | null>(null);

  useEffect(() => () => stopper.current?.abort(), []);
  useEffect(() => {
    if (status && !host) setHost(status.settings.host);
  }, [status, host]);

  const fail = (e: unknown) => setError(say(lang, e instanceof Error ? e.message : "That didn't work. Try again."));

  const change = async (patch: Parameters<typeof saveSettings>[0]) => {
    setError("");
    try {
      await saveSettings(patch);
      await refresh();
    } catch (e) {
      fail(e);
    }
  };

  /** Downloads a model, then starts using it when it is the tutor's first. */
  const download = async (model: string, thenUse: boolean) => {
    if (stopper.current) return;
    setError("");
    const control = new AbortController();
    stopper.current = control;
    setPull({ model, share: null });
    try {
      for await (const share of pullModel(model, control.signal)) setPull({ model, share });
      if (thenUse) await saveSettings({ chatModel: model });
    } catch (e) {
      if (!control.signal.aborted) fail(e);
    } finally {
      stopper.current = null;
      setPull(null);
      await refresh();
    }
  };
  const cancel = () => stopper.current?.abort();

  if (!status) return <p className="muted" aria-busy="true">{t.common.loading}</p>;

  const { ollama, settings, hardware, catalog, index } = status;
  const fit = (m: ModelChoice) => {
    const gap = TIERS.indexOf(m.tier) - TIERS.indexOf(hardware.tier);
    return gap === 0 ? t.tutor.fits : gap < 0 ? t.tutor.small : t.tutor.heavy;
  };
  const advice = { light: t.tutor.tierLight, standard: t.tutor.tierStandard, strong: t.tutor.tierStrong }[hardware.tier];
  const known = new Set(catalog.flatMap((m) => [m.name, `${m.name}:latest`]));
  const others = status.installed.filter((m) => !known.has(m.name) && !m.name.startsWith(settings.embedModel));
  const install = status.platform === "win32" ? t.tutor.installWin : status.platform === "darwin" ? t.tutor.installMac : t.tutor.installLinux;

  const row = (name: string, meta: React.ReactNode, gb?: number) => {
    const here = isInstalled(status, name);
    const active = settings.chatModel === name || `${settings.chatModel}:latest` === name;
    return (
      <li key={name} className={active ? "on" : ""}>
        <span className="model-name">{name}</span>
        <span className="model-meta">{meta}</span>
        <span className="model-act">
          {pull?.model === name ? <Progress pull={pull} onCancel={cancel} />
            : active ? <span className="model-on">{t.tutor.inUse}</span>
            : here ? <button type="button" className="btn sm" onClick={() => void change({ chatModel: name })}>{t.tutor.use}</button>
            : <button type="button" className="btn sm" disabled={!ollama.running || !!pull} onClick={() => void download(name, !settings.chatModel)}>{fill(t.tutor.get, { gb: gb ?? "?" })}</button>}
        </span>
      </li>
    );
  };

  return (
    <div className="setup">
      <header className="page-head">
        <h1>{t.tutor.setupTitle}</h1>
        <p className="lede">{t.tutor.setupLede}</p>
      </header>
      {error && <p className="auth-error" role="alert">{error}</p>}

      <section className="setup-step" data-done={ollama.running}>
        <h2>1. {t.tutor.stepOllama}</h2>
        <p className="acct-sync" data-state={ollama.running ? "saved" : "offline"}>{ollama.running ? fill(t.tutor.ollamaOn, { version: ollama.version ?? "" }) : fill(t.tutor.ollamaOff, { host: settings.host })}</p>
        {!ollama.running && (
          <>
            <p>{t.tutor.ollamaWhat} {install}</p>
            {status.platform === "linux"
              ? <pre><code>curl -fsSL https://ollama.com/install.sh | sh</code></pre>
              : <p><a className="btn primary" href="https://ollama.com/download" target="_blank" rel="noreferrer">{t.tutor.download}</a></p>}
            <p className="muted">{t.tutor.installed}</p>
            <pre><code>ollama serve</code></pre>
            <button type="button" className="btn" onClick={() => void refresh()}>{t.tutor.recheck}</button>
          </>
        )}
        <form className="auth-form setup-host" onSubmit={(e) => { e.preventDefault(); void change({ host }); }}>
          <label htmlFor="ollama-host">{t.tutor.host}</label>
          <div className="acct-row">
            <input id="ollama-host" value={host} onChange={(e) => setHost(e.target.value)} spellCheck={false} />
            <button type="submit" className="btn" disabled={host === settings.host}>{t.tutor.save}</button>
          </div>
        </form>
      </section>

      <section className="setup-step" data-done={!!settings.chatModel}>
        <h2>2. {t.tutor.stepModel}</h2>
        <p>{fill(t.tutor.hardware, { gb: hardware.ramGb })} {advice}</p>
        {!ollama.running && <p className="muted">{t.tutor.needOllama}</p>}
        <ul className="models">
          {catalog.map((m) => row(m.name, <>{m.use === "code" ? t.tutor.forCode : t.tutor.forChat}, <span data-fit={m.tier === hardware.tier}>{fit(m).toLowerCase()}</span></>, m.gb))}
        </ul>
        {others.length > 0 && (
          <>
            <h3>{t.tutor.others}</h3>
            <ul className="models">{others.map((m) => row(m.name, `${(m.bytes / 1e9).toFixed(1)} GB`))}</ul>
          </>
        )}
        <form className="auth-form setup-host" onSubmit={(e) => { e.preventDefault(); void download(custom.trim(), !settings.chatModel); }}>
          <label htmlFor="custom-model">{t.tutor.custom}</label>
          <div className="acct-row">
            <input id="custom-model" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={t.tutor.customHolder} spellCheck={false} />
            <button type="submit" className="btn" disabled={!custom.trim() || !ollama.running || !!pull}>{t.tutor.getCustom}</button>
          </div>
          {pull && pull.model === custom.trim() && !catalog.some((m) => m.name === pull.model) && <Progress pull={pull} onCancel={cancel} />}
        </form>
      </section>

      <section className="setup-step" data-done={index.state === "ready"}>
        <h2>3. {t.tutor.stepSearch}</h2>
        <p>{t.tutor.searchWhat} {t.tutor.searchLater}</p>
        {index.state === "missing-model" && (pull?.model === settings.embedModel
          ? <Progress pull={pull} onCancel={cancel} />
          : <button type="button" className="btn" disabled={!ollama.running || !!pull} onClick={() => void download(settings.embedModel, false)}>{t.tutor.searchGet}</button>)}
        {(index.state === "running" || index.state === "idle") && (
          <div className="pull">
            <span className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={index.total} aria-valuenow={index.done} aria-label={t.tutor.stepSearch}><i style={{ width: `${(index.done / Math.max(index.total, 1)) * 100}%` }} /></span>
            <span className="pull-text">{fill(t.tutor.searchRunning, { done: index.done, total: index.total })}</span>
          </div>
        )}
        {index.state === "ready" && <p className="acct-sync" data-state="saved">{fill(t.tutor.searchReady, { total: index.total })}</p>}
        {index.state === "error" && <p className="auth-error" role="alert">{fill(t.tutor.searchError, { error: index.error ?? "" })}</p>}
      </section>
    </div>
  );
}
