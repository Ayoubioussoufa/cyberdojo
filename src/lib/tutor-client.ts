/**
 * The browser side of the tutor: whether its panel is open, messages queued for
 * it by buttons elsewhere on the page, and the calls to its routes.
 */
"use client";

import { useSyncExternalStore } from "react";
import type { Lang } from "@/i18n/lang";
import { jsonLines } from "./ndjson";
import type { ChatEvent, Grade, Mode, PullEvent, TutorMessage, TutorSettings, TutorStatus } from "./tutor-types";

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
export const saveSettings = async (patch: Partial<TutorSettings>) => json<TutorSettings>(await send("PUT", "/api/tutor/settings/", patch));
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

/** Download progress from 0 to 1, or null before any size is known. Throws if the download fails. */
export async function* pullModel(model: string, signal: AbortSignal): AsyncGenerator<number | null> {
  const layers = new Map<string, { total: number; completed: number }>();
  let finished = false;
  for await (const e of stream<PullEvent>(await send("POST", "/api/tutor/pull/", { model }, signal))) {
    if (e.error) throw new TutorError(e.error);
    if (e.status === "success") finished = true;
    if (e.digest && e.total) layers.set(e.digest, { total: e.total, completed: e.completed ?? 0 });
    const total = [...layers.values()].reduce((n, l) => n + l.total, 0);
    yield total ? [...layers.values()].reduce((n, l) => n + l.completed, 0) / total : null;
  }
  if (!finished) throw new TutorError("The download stopped before the end. Try again.");
}
