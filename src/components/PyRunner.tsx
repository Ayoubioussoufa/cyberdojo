"use client";

import { useState } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import { DESKTOP } from "@/lib/desktop";
import { fill, plural, useLang } from "@/i18n/LangProvider";
import { pyChallenge } from "@/data/pycode";
import { PY_FR } from "@/data/fr/pycode";
import { interpretResult, PY_HARNESS, type RunResult, testsJson } from "@/lib/pycode";

// Pyodide (Python compiled to WebAssembly) runs the learner's code in their own
// browser; nothing is sent anywhere. v1 loads it from the official CDN, so it
// needs a connection — the desktop app shows a note instead until it is bundled.
const PYODIDE_VERSION = "0.27.7";
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

interface Pyodide {
  runPython(code: string): unknown;
  /** Fetches the standard-library parts Pyodide ships separately (sqlite3, for one) when the code imports them. */
  loadPackagesFromImports(code: string): Promise<unknown>;
  globals: { get(name: string): ((...args: unknown[]) => unknown) & { destroy?: () => void } };
}

let pyodidePromise: Promise<Pyodide> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-pyodide]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.dataset.pyodide = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Pyodide script failed to load"));
    document.head.appendChild(s);
  });
}

function getPyodide(): Promise<Pyodide> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadScript(`${PYODIDE_BASE}pyodide.js`);
      const load = (globalThis as unknown as { loadPyodide?: (o: { indexURL: string }) => Promise<Pyodide> }).loadPyodide;
      if (!load) throw new Error("Pyodide did not register");
      const py = await load({ indexURL: PYODIDE_BASE });
      py.runPython(PY_HARNESS);
      return py;
    })().catch((e: unknown) => {
      pyodidePromise = null;
      throw e;
    });
  }
  return pyodidePromise;
}

export function PyRunner({ id }: { id: string }) {
  const { lang, t } = useLang();
  const P = t.pyrun;
  const challenge = pyChallenge(id);
  const [code, setCode] = useState(challenge?.starter ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [loadError, setLoadError] = useState(false);

  if (!challenge) return null;
  // French shows its own prompt and test names; the code and the tests themselves are shared.
  const fr = lang === "fr" ? PY_FR[id] : undefined;
  const prompt = fr?.prompt ?? challenge.prompt;
  if (DESKTOP) return <section className="pyrun"><p className="pyrun-prompt">{prompt}</p><p className="pyrun-note">{P.desktopNote}</p></section>;

  const run = async () => {
    setBusy(true);
    setLoadError(false);
    try {
      const py = await getPyodide();
      await py.loadPackagesFromImports(code);
      const runFn = py.globals.get("_run");
      const raw = String(runFn(code, testsJson(challenge.tests)));
      runFn.destroy?.();
      setResult(interpretResult(raw));
    } catch {
      setLoadError(true);
    }
    setBusy(false);
  };

  const allPassed = result && !result.userError && result.total > 0 && result.passed === result.total;

  return (
    <section className="pyrun" aria-label={P.title}>
      <p className="pyrun-prompt">{prompt}</p>
      <CodeEditor value={code} onChange={setCode} onRun={() => void run()} label={P.title} />
      <p className="pyrun-keys">{P.keys}</p>
      <div className="pyrun-actions">
        <button type="button" className="btn primary sm" onClick={() => void run()} disabled={busy}>{busy ? P.running : P.run}</button>
        <button type="button" className="btn sm ghost" onClick={() => { setCode(challenge.starter); setResult(null); setLoadError(false); }}>{P.reset}</button>
        {result && !result.userError && <span className={`pyrun-score${allPassed ? " ok" : ""}`}>{fill(P.score, { n: result.passed, total: result.total })}</span>}
      </div>

      {loadError && <p className="pyrun-note pyrun-bad">{P.loadError}</p>}

      {result?.userError && (
        <div className="pyrun-out pyrun-bad">
          <p className="pyrun-out-title">{P.yourError}</p>
          <pre><code>{result.userError}</code></pre>
        </div>
      )}

      {result && !result.userError && (
        <>
          {result.stdout.trim() && (
            <div className="pyrun-out">
              <p className="pyrun-out-title">{P.output}</p>
              <pre><code>{result.stdout}</code></pre>
            </div>
          )}
          <ul className="pyrun-tests">
            {result.results.map((r, i) => (
              <li key={i} className={r.ok ? "ok" : "bad"}>
                <span className="pyrun-mark" aria-hidden>{r.ok ? "✓" : "✗"}</span>
                <span>{fr?.tests[i] ?? r.name}{r.error ? ` — ${r.error}` : ""}</span>
              </li>
            ))}
          </ul>
          {allPassed && <p className="pyrun-win">{plural(lang, P.allPassed, result.total)}</p>}
        </>
      )}
    </section>
  );
}
