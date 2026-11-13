"use client";

import Link from "@/components/HoverLink";
import { useEffect, useRef, useState } from "react";
import { fill, useLang } from "@/i18n/LangProvider";
import type { Lang } from "@/i18n/lang";
import { say } from "@/i18n/ui";
import { cancelSetup, deleteModel, saveSettings, startSetup, tutorReady, useTutorStatus } from "@/lib/tutor-client";
import type { AdvisedModel, Fit, JobStep, SetupJob, TutorStatus } from "@/lib/tutor-types";

const number = (lang: Lang, n: number, digits = 1) => new Intl.NumberFormat(lang, { maximumFractionDigits: digits }).format(n);

/** Sizes as ollama.com shows them, in decimal gigabytes, with the reader's decimal separator. */
function useFormat() {
  const { lang, t } = useLang();
  const gbNumber = (bytes: number) => number(lang, bytes / 1e9, bytes >= 1e10 ? 0 : 1);
  return {
    gbNumber,
    gb: (bytes: number) => fill(t.tutor.gb, { gb: gbNumber(bytes) }),
    mb: (bytes: number) => fill(t.tutor.mb, { mb: number(lang, bytes / 1e6, 1) }),
    time: (seconds: number) => {
      const s = Math.max(1, Math.round(seconds));
      if (s < 60) return `${s} s`;
      if (s < 3600) return `${Math.round(s / 60)} min`;
      return `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`;
    },
  };
}

const installedHere = (s: TutorStatus, name: string) => s.installed.some((m) => m.name === name || m.name === `${name}:latest`);
const inUse = (s: TutorStatus, name: string) => s.settings.chatModel === name || `${s.settings.chatModel}:latest` === name;

/** Download speed from successive polls, smoothed so the estimate doesn't jump. A new step starts from nothing. */
function useRate(step: JobStep | undefined) {
  const last = useRef<{ key: string; at: number; done: number; rate: number } | null>(null);
  if (!step || step.state !== "running" || !step.total) return null;
  const key = `${step.kind}:${step.model ?? ""}`;
  const now = Date.now();
  const prev = last.current;
  if (!prev || prev.key !== key || step.done < prev.done) {
    last.current = { key, at: now, done: step.done, rate: 0 };
    return null;
  }
  if (now - prev.at >= 800) {
    const fresh = (step.done - prev.done) / ((now - prev.at) / 1000);
    last.current = { key, at: now, done: step.done, rate: prev.rate ? prev.rate * 0.7 + fresh * 0.3 : fresh };
  }
  const rate = last.current?.rate ?? 0;
  return rate > 0 ? { rate, left: (step.total - step.done) / rate } : null;
}

function FitBadge({ fit, noRoom }: { fit: Fit; noRoom?: boolean }) {
  const { t } = useLang();
  if (noRoom) return <span className="fit" data-fit="too-big">{t.tutor.noRoom}</span>;
  const label = { fast: t.tutor.fitFast, ok: t.tutor.fitOk, slow: t.tutor.fitSlow, "too-big": t.tutor.fitBig }[fit];
  return <span className="fit" data-fit={fit}>{label}</span>;
}

function stepLabel(t: ReturnType<typeof useLang>["t"], step: JobStep, embed: string) {
  if (step.kind === "install") return t.tutor.stepInstall;
  if (step.kind === "start") return t.tutor.stepStart;
  return step.model === embed ? t.tutor.stepSearch : fill(t.tutor.stepPull, { model: step.model ?? "" });
}

const MARK: Record<JobStep["state"], string> = { done: "✓", failed: "✕", running: "›", waiting: "·", cancelled: "·" };

function JobPanel({ job, status, onError }: { job: SetupJob; status: TutorStatus; onError: (e: unknown) => void }) {
  const { lang, t } = useLang();
  const f = useFormat();
  const current = job.steps.find((s) => s.state === "running");
  const rate = useRate(current);
  const failed = job.steps.find((s) => s.state === "failed");
  const retry = () => startSetup(job.steps.filter((s) => s.kind === "pull").map((s) => s.model as string), job.use).catch(onError);
  return (
    <section className="setup-card setup-job" aria-live="polite">
      <h2>{t.tutor.working}</h2>
      <ol className="job-steps">
        {job.steps.map((step, i) => {
          const label = stepLabel(t, step, status.settings.embedModel);
          const pct = step.total ? (step.done / step.total) * 100 : 0;
          return (
            <li key={i} data-state={step.state}>
              <span className="job-mark" aria-hidden="true">{MARK[step.state]}</span>
              <span className="job-label">{label}</span>
              {step.state === "running" && step.total > 0 && (
                <span className="job-progress">
                  <span className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(pct)} aria-label={label}><i style={{ width: `${pct}%` }} /></span>
                  <span className="pull-text">
                    {fill(t.tutor.bytes, { done: f.gb(step.done), total: f.gb(step.total) })}
                    {rate && <> · {fill(t.tutor.rate, { speed: f.mb(rate.rate), eta: f.time(rate.left) })}</>}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {job.state === "running" && (
        <div className="setup-row">
          <p className="muted">{t.tutor.workingNote}</p>
          <button type="button" className="btn sm" onClick={() => void cancelSetup().catch(onError)}>{t.tutor.cancel}</button>
        </div>
      )}
      {job.state === "failed" && (
        <div className="setup-row">
          <p className="auth-error" role="alert">{fill(t.tutor.failed, { error: say(lang, failed?.error ?? "That didn't work. Try again.") })}</p>
          <button type="button" className="btn primary sm" onClick={() => void retry()}>{t.tutor.retry}</button>
        </div>
      )}
      {job.state === "cancelled" && (
        <div className="setup-row">
          <p className="muted">{t.tutor.cancelled}</p>
          <button type="button" className="btn sm" onClick={() => void retry()}>{t.tutor.retry}</button>
        </div>
      )}
    </section>
  );
}

function Recommend({ status, onError }: { status: TutorStatus; onError: (e: unknown) => void }) {
  const { t } = useLang();
  const f = useFormat();
  const { ollama, settings, catalog } = status;
  if (!ollama.running && !ollama.local) {
    return <section className="setup-card"><p className="auth-error">{fill(t.tutor.ollamaOff, { host: settings.host })} {t.tutor.remote}</p></section>;
  }
  const rec: AdvisedModel | undefined = catalog.find((m) => m.name === status.recommended) ?? catalog[0];
  if (!rec) return null;
  const needModel = !installedHere(status, rec.name);
  const needSearch = !installedHere(status, settings.embedModel);
  const cannotInstall = !ollama.running && !ollama.found && !ollama.canInstall;
  const go = () => startSetup([rec.name, settings.embedModel], rec.name).catch(onError);
  return (
    <section className="setup-card setup-rec">
      <p className="setup-kicker">{t.tutor.recommended}</p>
      <div className="rec-model">
        <span className="model-name">{rec.name}</span>
        <span className="model-meta">{rec.family} · {rec.params} · {f.gb(rec.bytes)}</span>
        <FitBadge fit={rec.fit} noRoom={rec.noRoom} />
      </div>
      {!status.recommended && <p className="muted">{t.tutor.noFit}</p>}
      <p className="setup-plan-lead">{t.tutor.planLead}</p>
      <ul className="setup-plan">
        {!ollama.running && (ollama.found
          ? <li>{t.tutor.planStart}</li>
          : ollama.canInstall && <li>{ollama.installBytes ? fill(t.tutor.planInstall, { gb: f.gbNumber(ollama.installBytes) }) : t.tutor.planInstallNoSize}</li>)}
        {needModel && <li>{fill(t.tutor.planModel, { model: rec.name, gb: f.gbNumber(rec.bytes) })}</li>}
        {needSearch && <li>{fill(t.tutor.planSearch, { gb: f.gbNumber(status.embedBytes) })}</li>}
      </ul>
      <p className="muted">{t.tutor.planNote}</p>
      {cannotInstall
        ? <p>{t.tutor.manual} <a href="https://ollama.com/download" target="_blank" rel="noreferrer">{t.tutor.download}</a></p>
        : (
          <div className="setup-actions">
            <button type="button" className="btn primary lg" onClick={() => void go()} disabled={rec.noRoom}>{t.tutor.setUp}</button>
            <a className="link-btn" href="#models">{t.tutor.chooseOther}</a>
          </div>
        )}
    </section>
  );
}

function Ready({ status }: { status: TutorStatus }) {
  const { lang, t } = useLang();
  const model = status.settings.chatModel;
  const live = status.loaded.find((m) => m.name === model || m.name === `${model}:latest`);
  return (
    <section className="setup-card setup-ready">
      <h2>{t.tutor.ready}</h2>
      <p>{fill(t.tutor.readyNote, { model })}{live && <> {fill(t.tutor.onGpu, { pct: number(lang, Math.round(live.gpu * 100), 0) })}</>}</p>
      <p className="muted">{t.tutor.readyHow}</p>
      <Link href="/tutor/" className="btn primary">{t.tutor.openTutor}</Link>
    </section>
  );
}

function Computer({ status }: { status: TutorStatus }) {
  const { t } = useLang();
  const { hardware: hw } = status;
  const gb = (n: number) => fill(t.tutor.gb, { gb: n });
  return (
    <section className="setup-hw" aria-label={t.tutor.computer}>
      <div><span>{t.tutor.memory}</span><b>{gb(hw.ramGb)}</b></div>
      <div><span>{t.tutor.graphics}</span><b>{hw.gpu ? (hw.gpu.unified ? fill(t.tutor.graphicsShared, { name: hw.gpu.name }) : `${hw.gpu.name}, ${gb(hw.gpu.vramGb)}`) : t.tutor.graphicsNone}</b></div>
      <div><span>{t.tutor.disk}</span><b>{hw.diskFreeGb === null ? t.tutor.unknown : gb(Math.floor(hw.diskFreeGb))}</b></div>
    </section>
  );
}

function Models({ status, busy, onError }: { status: TutorStatus; busy: boolean; onError: (e: unknown) => void }) {
  const { t } = useLang();
  const f = useFormat();
  const [custom, setCustom] = useState("");
  const { settings, catalog } = status;
  const download = (name: string) => startSetup([name, settings.embedModel], settings.chatModel ? undefined : name).catch(onError);
  const remove = (name: string, bytes: number) => {
    if (window.confirm(fill(t.tutor.removeConfirm, { model: name, gb: f.gbNumber(bytes) }))) void deleteModel(name).catch(onError);
  };
  const use = (name: string) => saveSettings({ chatModel: name }).catch(onError);
  const known = new Set(catalog.flatMap((m) => [m.name, `${m.name}:latest`]));
  const others = status.installed.filter((m) => !known.has(m.name) && !m.name.startsWith(settings.embedModel));
  const pulling = (name: string) => (busy ? status.job?.steps.find((s) => s.kind === "pull" && s.model === name && (s.state === "running" || s.state === "waiting")) : undefined);
  const actions = (name: string, bytes: number, fitsHere: boolean) => {
    if (inUse(status, name)) return <span className="model-on">{t.tutor.inUse}</span>;
    if (installedHere(status, name)) {
      return (
        <>
          <button type="button" className="btn sm" onClick={() => void use(name)}>{t.tutor.use}</button>
          <button type="button" className="link-btn" onClick={() => remove(name, bytes)}>{t.tutor.remove}</button>
        </>
      );
    }
    const step = pulling(name);
    if (step) return <span className="model-on">{step.state === "waiting" ? t.tutor.queued : fill(t.tutor.downloading, { pct: step.total ? Math.floor((step.done / step.total) * 100) : 0 })}</span>;
    return <button type="button" className="btn sm" disabled={busy || !fitsHere || (!status.ollama.local && !status.ollama.running)} onClick={() => void download(name)}>{t.tutor.get}</button>;
  };
  return (
    <section className="setup-section" id="models">
      <h2>{t.tutor.modelsTitle}</h2>
      <p className="muted">{t.tutor.modelsNote}</p>
      <ul className="models">
        {catalog.map((m) => (
          <li key={m.name} className={inUse(status, m.name) ? "on" : ""}>
            <span className="model-name">{m.name}</span>
            <span className="model-meta">{m.family} · {m.params} · {f.gb(m.bytes)}</span>
            <FitBadge fit={m.fit} noRoom={m.noRoom && !installedHere(status, m.name)} />
            <span className="model-act">{actions(m.name, m.bytes, m.fit !== "too-big" && !m.noRoom)}</span>
          </li>
        ))}
      </ul>
      {others.length > 0 && (
        <>
          <h3>{t.tutor.others}</h3>
          <ul className="models">
            {others.map((m) => (
              <li key={m.name} className={inUse(status, m.name) ? "on" : ""}>
                <span className="model-name">{m.name}</span>
                <span className="model-meta">{f.gb(m.bytes)}</span>
                <span />
                <span className="model-act">{actions(m.name, m.bytes, true)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <form className="auth-form setup-host" onSubmit={(e) => { e.preventDefault(); if (custom.trim()) void download(custom.trim()); setCustom(""); }}>
        <label htmlFor="custom-model">{t.tutor.custom}</label>
        <div className="acct-row">
          <input id="custom-model" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={t.tutor.customHolder} spellCheck={false} />
          <button type="submit" className="btn" disabled={!custom.trim() || busy}>{t.tutor.getCustom}</button>
        </div>
      </form>
    </section>
  );
}

function Advanced({ status, busy, onError }: { status: TutorStatus; busy: boolean; onError: (e: unknown) => void }) {
  const { t } = useLang();
  const f = useFormat();
  const { ollama, settings, index } = status;
  const [host, setHost] = useState(settings.host);
  const found = { app: t.tutor.foundApp, cli: t.tutor.foundCli, managed: t.tutor.foundManaged };
  return (
    <details className="setup-section setup-advanced" open={!ollama.running && !busy}>
      <summary><h2>{t.tutor.advanced}</h2></summary>
      <p className="acct-sync" data-state={ollama.running ? "saved" : "offline"}>{ollama.running ? fill(t.tutor.ollamaOn, { version: ollama.version ?? "" }) : fill(t.tutor.ollamaOff, { host: settings.host })}</p>
      {ollama.local && <p className="muted">{ollama.found ? found[ollama.found] : t.tutor.notFound}</p>}
      {!ollama.running && ollama.local && (
        <div className="setup-actions">
          {(ollama.found || ollama.canInstall) && <button type="button" className="btn" disabled={busy} onClick={() => void startSetup([]).catch(onError)}>{ollama.found ? t.tutor.startOllama : t.tutor.installOllama}</button>}
          <span className="muted">{t.tutor.manual} <a href="https://ollama.com/download" target="_blank" rel="noreferrer">{t.tutor.download}</a></span>
        </div>
      )}
      <form className="auth-form setup-host" onSubmit={(e) => { e.preventDefault(); void saveSettings({ host }).catch(onError); }}>
        <label htmlFor="ollama-host">{t.tutor.host}</label>
        <div className="acct-row">
          <input id="ollama-host" value={host} onChange={(e) => setHost(e.target.value)} spellCheck={false} />
          <button type="submit" className="btn" disabled={host === settings.host}>{t.tutor.save}</button>
        </div>
      </form>

      <h3>{t.tutor.stepSearch}</h3>
      <p className="muted">{t.tutor.searchWhat} {t.tutor.searchLater}</p>
      {index.state === "missing-model" && (
        <button type="button" className="btn" disabled={busy || !ollama.running} onClick={() => void startSetup([settings.embedModel]).catch(onError)}>{fill(t.tutor.searchGet, { gb: f.gbNumber(status.embedBytes) })}</button>
      )}
      {(index.state === "running" || index.state === "idle") && (
        <div className="pull">
          <span className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={index.total} aria-valuenow={index.done} aria-label={t.tutor.stepSearch}><i style={{ width: `${(index.done / Math.max(index.total, 1)) * 100}%` }} /></span>
          <span className="pull-text">{fill(t.tutor.searchRunning, { done: index.done, total: index.total })}</span>
        </div>
      )}
      {index.state === "ready" && <p className="acct-sync" data-state="saved">{fill(t.tutor.searchReady, { total: index.total })}</p>}
      {index.state === "error" && <p className="auth-error" role="alert">{fill(t.tutor.searchError, { error: index.error ?? "" })}</p>}
    </details>
  );
}

/** The tutor's setup: what this computer can run, one button that installs everything, and every model. */
export function TutorSetup() {
  const { lang, t } = useLang();
  const status = useTutorStatus();
  const [error, setError] = useState("");
  const [welcome, setWelcome] = useState(false);
  const fail = (e: unknown) => setError(say(lang, e instanceof Error ? e.message : "That didn't work. Try again."));

  useEffect(() => setWelcome(new URLSearchParams(window.location.search).has("welcome")), []);
  // Seen once is enough: the app stops opening on this page.
  const welcomed = status?.settings.welcomed;
  useEffect(() => {
    if (welcomed === "") void saveSettings({ welcomed: "1" }).catch(() => undefined);
  }, [welcomed]);

  if (!status) return <p className="muted" aria-busy="true">{t.common.loading}</p>;
  const job = status.job;
  const busy = job?.state === "running";
  const showJob = !!job && job.steps.length > 0 && (busy || job.state === "failed" || job.state === "cancelled");
  const ready = tutorReady(status);

  return (
    <div className="setup">
      <header className="page-head">
        <h1>{t.tutor.setupTitle}</h1>
        <p className="lede">{t.tutor.setupLede}</p>
      </header>
      {welcome && !ready && (
        <div className="setup-welcome">
          <p>{t.tutor.welcome}</p>
          <Link href="/" className="link-btn">{t.tutor.skip}</Link>
        </div>
      )}
      {error && <p className="auth-error" role="alert">{error}</p>}

      <Computer status={status} />
      {showJob && job && <JobPanel job={job} status={status} onError={fail} />}
      {!busy && (ready ? <Ready status={status} /> : !showJob && <Recommend status={status} onError={fail} />)}
      <Models status={status} busy={busy} onError={fail} />
      <Advanced status={status} busy={busy} onError={fail} />
    </div>
  );
}
