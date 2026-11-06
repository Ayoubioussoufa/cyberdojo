/**
 * The signed-in account, and keeping progress in step with the server.
 *
 * localStorage stays the working copy, so pages render instantly and work
 * offline. Three rules keep one person's data from reaching another:
 *  - OWNER records whose progress this browser holds;
 *  - a different account's copy is dropped, never merged;
 *  - signing out empties the browser.
 * Progress made as a guest is merged into the account at first sign-in.
 */
"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_STORE, hasProgress, mergeStores } from "./merge";
import { getStore, onEdit, replaceStore } from "./progress";
import type { Store } from "./progress-types";

export interface User {
  id: string;
  username: string;
  createdAt: number;
}

export type Sync = "idle" | "saving" | "saved" | "offline";

interface State {
  ready: boolean;
  user: User | null;
  sync: Sync;
}

const OWNER = "cyberdojo-owner";
const DIRTY = "cyberdojo-dirty";
const SAVE_AFTER_MS = 1500;
const KEEPALIVE_LIMIT = 60_000;

let state: State = { ready: false, user: null, sync: "idle" };
let version = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let saving = false;
let again = false;

const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
};
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const SERVER: State = { ready: false, user: null, sync: "idle" };
export const useAccount = () => useSyncExternalStore(subscribe, () => state, () => SERVER);

const get = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const put = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    // Without storage, progress lasts for this visit and still saves to the server.
  }
};

const send = (method: string, url: string, body?: unknown) =>
  fetch(url, { method, credentials: "same-origin", headers: body === undefined ? {} : { "Content-Type": "application/json" }, body: body === undefined ? null : JSON.stringify(body) });

async function save() {
  if (!state.user) return;
  if (saving) {
    again = true;
    return;
  }
  saving = true;
  set({ sync: "saving" });
  try {
    let res = await send("PUT", "/api/progress/", { data: getStore(), version });
    if (res.status === 409) {
      const newer = (await res.json()) as { data: Partial<Store>; version: number };
      const merged = mergeStores({ ...EMPTY_STORE, ...newer.data }, getStore());
      replaceStore(merged);
      version = newer.version;
      res = await send("PUT", "/api/progress/", { data: merged, version });
    }
    if (res.status === 401) {
      set({ user: null, sync: "idle" });
      return;
    }
    if (!res.ok) throw new Error(String(res.status));
    version = ((await res.json()) as { version: number }).version;
    put(DIRTY, null);
    set({ sync: "saved" });
  } catch {
    // Still marked dirty, so the next visit or the next edit tries again.
    set({ sync: "offline" });
  } finally {
    saving = false;
    if (again) {
      again = false;
      void save();
    }
  }
}

function edited() {
  if (!state.user) return;
  put(DIRTY, "1");
  if (timer !== null) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void save();
  }, SAVE_AFTER_MS);
}

/** Leaving the page: a normal fetch would be cancelled, a keepalive one finishes. */
function leaving() {
  if (timer === null || !state.user) return;
  clearTimeout(timer);
  timer = null;
  const body = JSON.stringify({ data: getStore(), version });
  if (body.length > KEEPALIVE_LIMIT) return;
  void fetch("/api/progress/", { method: "PUT", keepalive: true, credentials: "same-origin", headers: { "Content-Type": "application/json" }, body }).then((r) => {
    if (r.ok) put(DIRTY, null);
  });
}

/** Brings browser and server together for this account. */
async function pull(user: User) {
  const res = await send("GET", "/api/progress/");
  if (!res.ok) throw new Error(String(res.status));
  const saved = (await res.json()) as { data: Partial<Store>; version: number };
  version = saved.version;
  const remote: Store = { ...EMPTY_STORE, ...saved.data };
  const owner = get(OWNER);
  const local = getStore();
  const guestWork = owner === null && hasProgress(local);
  const unsaved = owner === user.id && get(DIRTY) === "1";
  put(OWNER, user.id);
  if (guestWork || unsaved) {
    replaceStore(mergeStores(remote, local));
    put(DIRTY, "1");
    await save();
  } else {
    replaceStore(remote);
    put(DIRTY, null);
  }
}

/** Another device may have saved since this tab was last looked at. */
async function refresh() {
  const user = state.user;
  if (!user || timer !== null || saving || get(DIRTY) === "1") return;
  try {
    const res = await send("GET", "/api/progress/");
    if (!res.ok) return;
    const saved = (await res.json()) as { data: Partial<Store>; version: number };
    if (saved.version !== version && timer === null && get(DIRTY) !== "1") {
      version = saved.version;
      replaceStore({ ...EMPTY_STORE, ...saved.data });
    }
  } catch {
    // Offline. Nothing to do until the next look.
  }
}

let started = false;

export async function startAccount() {
  if (started) return;
  started = true;
  onEdit(edited);
  window.addEventListener("pagehide", leaving);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") leaving();
    else void refresh();
  });
  try {
    const res = await send("GET", "/api/auth/me/");
    const { user } = (await res.json()) as { user: User | null };
    set({ user, ready: true });
    if (user) await pull(user);
  } catch {
    // No server reachable: work as a guest on what this browser holds.
    set({ ready: true, sync: "offline" });
  }
}

async function enter(path: string, body: { username: string; password: string }): Promise<string | null> {
  try {
    const res = await send("POST", path, body);
    const out = (await res.json()) as { user?: User; error?: string };
    if (!res.ok || !out.user) return out.error ?? "That didn't work. Try again.";
    if (get(OWNER) !== null && get(OWNER) !== out.user.id) {
      // This browser still holds someone else's copy. It isn't theirs to inherit.
      replaceStore(EMPTY_STORE);
      put(OWNER, null);
      put(DIRTY, null);
    }
    set({ user: out.user, ready: true });
    await pull(out.user);
    return null;
  } catch {
    return "The server didn't answer. Check your connection and try again.";
  }
}

export const signUp = (username: string, password: string) => enter("/api/auth/signup/", { username, password });
export const signIn = (username: string, password: string) => enter("/api/auth/login/", { username, password });

function forgetHere() {
  if (timer !== null) clearTimeout(timer);
  timer = null;
  version = 0;
  put(OWNER, null);
  put(DIRTY, null);
  replaceStore(EMPTY_STORE);
  set({ user: null, sync: "idle" });
}

export async function signOut(): Promise<string | null> {
  if (get(DIRTY) === "1") await save();
  if (get(DIRTY) === "1") return "Your latest progress hasn't saved yet. Reconnect, then sign out, or it would be lost.";
  const res = await send("POST", "/api/auth/logout/").catch(() => null);
  if (!res?.ok) return "The server didn't answer. Try again.";
  forgetHere();
  return null;
}

export async function changePassword(current: string, next: string): Promise<string | null> {
  try {
    const res = await send("POST", "/api/auth/password/", { current, next });
    if (res.ok) return null;
    return ((await res.json()) as { error?: string }).error ?? "That didn't work. Try again.";
  } catch {
    return "The server didn't answer. Try again.";
  }
}

export async function deleteAccount(password: string): Promise<string | null> {
  try {
    const res = await send("DELETE", "/api/account/", { password });
    if (!res.ok) return ((await res.json()) as { error?: string }).error ?? "That didn't work. Try again.";
    forgetHere();
    return null;
  } catch {
    return "The server didn't answer. Try again.";
  }
}
