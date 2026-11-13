/**
 * The tutor's setup, run in the background: install or start Ollama, then
 * download each model. It belongs to the server, not to a page, so the learner
 * can keep studying while gigabytes come down; the status route reports it.
 * One job at a time.
 */
import { jsonLines } from "@/lib/ndjson";
import type { JobStep, PullEvent, SetupJob } from "@/lib/tutor-types";
import { hardware } from "./hardware";
import { catalogBytes } from "./models";
import { hasModel, installed, OllamaError, pull, version } from "./ollama";
import { findOllama, install, isLocal, RuntimeError, start } from "./runtime";
import { readSettings, writeSettings } from "./settings";

interface Running {
  job: SetupJob;
  stop: AbortController;
}

const slot = globalThis as { __cyberdojoJob?: Running; __cyberdojoJobId?: number };

export const currentJob = (): SetupJob | null => slot.__cyberdojoJob?.job ?? null;

export function cancelJob(): void {
  slot.__cyberdojoJob?.stop.abort();
}

const reason = (e: unknown) => (e instanceof RuntimeError || e instanceof OllamaError ? e.message : "That didn't work. Try again.");

async function pullModel(host: string, step: JobStep, signal: AbortSignal) {
  const model = step.model as string;
  const bytes = catalogBytes(model);
  const free = (await hardware()).diskFreeGb;
  if (bytes && free !== null && free < bytes / 2 ** 30 + 1) throw new RuntimeError("There isn't enough free disk space for this model.");
  const layers = new Map<string, { total: number; completed: number }>();
  let finished = false;
  for await (const e of jsonLines<PullEvent>(await pull(host, model, signal))) {
    if (e.error) throw new OllamaError(e.error);
    if (e.status === "success") finished = true;
    if (e.digest && e.total) layers.set(e.digest, { total: e.total, completed: e.completed ?? 0 });
    step.total = Math.max(bytes ?? 0, [...layers.values()].reduce((n, l) => n + l.total, 0));
    step.done = [...layers.values()].reduce((n, l) => n + l.completed, 0);
  }
  if (!finished) throw new OllamaError("The download stopped before the end. Try again.");
  step.done = step.total;
}

async function execute(run: Running) {
  const { job, stop } = run;
  const { signal } = stop;
  const { host } = await readSettings();
  for (const step of job.steps) {
    if (signal.aborted) break;
    step.state = "running";
    try {
      if (step.kind === "install") {
        await install((done, total) => Object.assign(step, { done, total }), signal);
      } else if (step.kind === "start") {
        await start(host, signal);
      } else {
        await pullModel(host, step, signal);
      }
      step.state = "done";
    } catch (e) {
      if (signal.aborted) break;
      step.state = "failed";
      step.error = reason(e);
      job.state = "failed";
      return;
    }
  }
  if (signal.aborted) {
    for (const step of job.steps) if (step.state === "running" || step.state === "waiting") step.state = "cancelled";
    job.state = "cancelled";
    return;
  }
  if (job.use) await writeSettings({ chatModel: job.use });
  job.state = "done";
}

/**
 * Plans and starts a setup: what is already in place is skipped. `pulls` are
 * the models to download, `use` the one to talk to afterwards. Returns an
 * error message, or null.
 */
export async function startSetup(pulls: string[], use: string | undefined): Promise<string | null> {
  if (slot.__cyberdojoJob?.job.state === "running") return "A setup is already running.";
  const { host } = await readSettings();
  const running = (await version(host)) !== null;
  const steps: JobStep[] = [];
  if (!running) {
    if (!isLocal(host)) return "Ollama isn't answering. Start it, then try again.";
    if (!findOllama()) steps.push({ kind: "install", state: "waiting", done: 0, total: 0 });
    steps.push({ kind: "start", state: "waiting", done: 0, total: 0 });
  }
  const have = running ? await installed(host).catch(() => []) : [];
  for (const model of new Set(pulls)) {
    if (!hasModel(have, model)) steps.push({ kind: "pull", model, state: "waiting", done: 0, total: catalogBytes(model) ?? 0 });
  }
  const id = (slot.__cyberdojoJobId = (slot.__cyberdojoJobId ?? 0) + 1);
  const run: Running = { job: { id, state: "running", steps, use, startedAt: Date.now() }, stop: new AbortController() };
  slot.__cyberdojoJob = run;
  void execute(run).catch((e: unknown) => {
    run.job.state = "failed";
    const step = run.job.steps.find((s) => s.state === "running");
    if (step) Object.assign(step, { state: "failed", error: reason(e) });
  });
  return null;
}

const once = globalThis as { __cyberdojoAutoStarted?: boolean };

/**
 * When the tutor was set up before and Ollama is installed here but stopped,
 * the app starts it once per launch, so the tutor is simply there.
 */
export function autoStart(chatModel: string, running: boolean, local: boolean, installed: boolean): void {
  if (once.__cyberdojoAutoStarted || running || !local || !installed || !chatModel || currentJob()?.state === "running") return;
  once.__cyberdojoAutoStarted = true;
  void startSetup([], undefined);
}
