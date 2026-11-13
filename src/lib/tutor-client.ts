/**
 * The browser side of the tutor: whether its panel is open, messages queued for
 * it by buttons elsewhere on the page, and the calls to its routes.
 */
"use client";

import { useSyncExternalStore } from "react";
import type { Lang } from "@/i18n/lang";
import { jsonLines } from "./ndjson";
import type { ChatEvent, Grade, Mode, SetupJob, Thread, TutorMessage, TutorSettings, TutorStatus } from "./tutor-types";

interface Dock {
  open: boolean;
  /** A message another button asked the tutor to answer, sent as soon as the panel can. */
  queued: { text: string; mode: Mode } | null;
}

let dock: Dock = { open: false, queued: null };
const listeners = new Set<() => void>();
const set = (patch: Partial<Dock>) => {
  dock = { ...dock, ...patch };
  listeners.forEach((fn) => fn());
};
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const CLOSED: Dock = { open: false, queued: null };

export const useDock = () => useSyncExternalStore(subscribe, () => dock, () => CLOSED);
export const setDockOpen = (open: boolean) => set({ open });
/** Opens the tutor and hands it a message, from any "Ask the tutor" button. */
export const askTutor = (text: string, mode: Mode) => set({ open: true, queued: { text, mode } });
export const takeQueued = () => set({ queued: null });

export class TutorError extends Error {}

async function json<T>(res: Response): Promise<T> {
  const out = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || out === null) throw new TutorError(out?.error ?? "That didn't work. Try again.");
  return out;
}

const send = (method: string, url: string, body?: unknown, signal?: AbortSignal) =>
  fetch(url, { method, signal, credentials: "same-origin", headers: body === undefined ? {} : { "Content-Type": "application/json" }, body: body === undefined ? null : JSON.stringify(body) });

export const getStatus = async () => json<TutorStatus>(await send("GET", "/api/tutor/status/"));
export const saveSettings = async (patch: Partial<TutorSettings>) => {
  const out = await json<TutorSettings>(await send("PUT", "/api/tutor/settings/", patch));
  void refreshStatus();
  return out;
};
export const getHistory = async (page: string) => json<TutorMessage[]>(await send("GET", `/api/tutor/chat/?page=${encodeURIComponent(page)}`));
export const clearChat = async (page: string) => json<{ ok: boolean }>(await send("DELETE", `/api/tutor/chat/?page=${encodeURIComponent(page)}`));
export const getGrade = async (questionId: string) => json<Grade | null>(await send("GET", `/api/tutor/grade/?question=${encodeURIComponent(questionId)}`)).catch(() => null);
export const gradeAnswer = async (href: string, lang: Lang, questionId: string, answer: string) => json<Grade>(await send("POST", "/api/tutor/grade/", { href, lang, questionId, answer }));

async function* stream<T>(res: Response): AsyncGenerator<T> {
  if (!res.ok || !res.body) throw new TutorError(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "That didn't work. Try again.");
  yield* jsonLines<T>(res.body);
}

export interface Ask {
  href: string;
  lang: Lang;
  mode: Mode;
  reveal: boolean;
  message: string;
}

export async function* chat(ask: Ask, signal: AbortSignal): AsyncGenerator<ChatEvent> {
  yield* stream<ChatEvent>(await send("POST", "/api/tutor/chat/", ask, signal));
}

/** Starts installing or starting Ollama and downloading models, in the background. */
export const startSetup = async (pull: string[], use?: string) => {
  const job = await json<SetupJob>(await send("POST", "/api/tutor/setup/", { pull, use }));
  if (timer) clearTimeout(timer);
  timer = null;
  void refreshStatus().then(schedule);
  return job;
};
export const cancelSetup = async () => {
  await json<{ ok: boolean }>(await send("DELETE", "/api/tutor/setup/"));
  void refreshStatus();
};
export const deleteModel = async (name: string) => {
  await json<{ ok: boolean }>(await send("DELETE", `/api/tutor/models/?name=${encodeURIComponent(name)}`));
  void refreshStatus();
};
export const getThreads = async (lang: Lang) => json<{ threads: Thread[]; pages: Thread[] }>(await send("GET", `/api/tutor/threads/?lang=${lang}`));

/**
 * One status for the whole window, shared by the nav, the tutor panel and the
 * setup page: asked every few seconds while visible, every second while a
 * setup runs.
 */
const FAST_MS = 1000;
const SLOW_MS = 5000;
let status: TutorStatus | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let asking: Promise<void> | null = null;
const watchers = new Set<() => void>();

export function refreshStatus(): Promise<void> {
  asking ??= getStatus()
    .then((s) => {
      status = s;
      watchers.forEach((fn) => fn());
    })
    .catch(() => undefined)
    .finally(() => {
      asking = null;
    });
  return asking;
}

/** The next poll is planned after each answer, so it follows what the answer says: fast while a setup runs. */
function schedule() {
  if (timer || !watchers.size) return;
  timer = setTimeout(async () => {
    timer = null;
    if (document.visibilityState === "visible") await refreshStatus();
    schedule();
  }, status?.job?.state === "running" ? FAST_MS : SLOW_MS);
}

function watch(fn: () => void) {
  watchers.add(fn);
  if (watchers.size === 1) void refreshStatus().then(schedule);
  return () => {
    watchers.delete(fn);
  };
}

export const useTutorStatus = () => useSyncExternalStore(watch, () => status, () => null);

/** How far a setup has gone, 0 to 1: finished steps count whole, downloads by their bytes. */
export function jobShare(job: SetupJob): number {
  const total = job.steps.reduce((n, s) => n + s.total, 0);
  if (!total) return job.steps.filter((s) => s.state === "done").length / Math.max(job.steps.length, 1);
  return job.steps.reduce((n, s) => n + (s.state === "done" ? s.total : s.done), 0) / total;
}

/** Ready to answer: Ollama answers and a chat model is chosen and present. */
export const tutorReady = (s: TutorStatus | null) =>
  !!s?.ollama.running && !!s.settings.chatModel && s.installed.some((m) => m.name === s.settings.chatModel || m.name === `${s.settings.chatModel}:latest`);
