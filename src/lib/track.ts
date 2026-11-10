/**
 * Tells this site's own server which page is open and how long it was really
 * in use. Time counts only while the tab is visible and someone has moved,
 * typed or scrolled in the last two minutes, so a tab left open isn't study time.
 *
 * The visitor number is random and means nothing outside this site. A browser
 * that sends "do not track" or Global Privacy Control isn't counted at all,
 * and anyone can switch counting off on the account page.
 */
"use client";

const VISITOR = "cyberdojo-visitor";
const OFF = "cyberdojo-stats-off";
const TICK = 5_000;
const SEND_EVERY = 30_000;
const IDLE_AFTER = 120_000;

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};

export function browserRefuses(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
}

export const countingOff = () => read(OFF) === "1";

export function setCounting(on: boolean) {
  try {
    if (on) localStorage.removeItem(OFF);
    else {
      localStorage.setItem(OFF, "1");
      localStorage.removeItem(VISITOR);
    }
  } catch {
    // No storage: nothing was being counted under a lasting number anyway.
  }
}

/** Automated browsers aren't readers. */
const counted = () => !navigator.webdriver && !browserRefuses() && !countingOff();

function visitor(): string | null {
  let id = read(VISITOR);
  if (id && /^[A-Za-z0-9_-]{16,40}$/.test(id)) return id;
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  try {
    localStorage.setItem(VISITOR, id);
  } catch {
    // Without storage every page would look like a new person, which is worse than not counting.
    return null;
  }
  return id;
}

let path = "";
let spent = 0;
let lastTick = 0;
let lastInput = 0;
let lastSent = 0;
let started = false;
/** The tab's state before the event being handled: when it hides, the seconds up to that moment still count. */
let showing = true;

function post(body: { p: string; view: boolean; ms: number; r?: string }) {
  if (!counted()) return;
  const v = visitor();
  if (!v) return;
  void fetch("/api/track/", { method: "POST", keepalive: true, credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ v, ...body }) }).catch(() => {
    // Offline: these seconds go uncounted.
  });
}

function tick() {
  const now = Date.now();
  const gap = now - lastTick;
  lastTick = now;
  // A long gap means the computer slept or the tab was throttled, not that someone read for an hour.
  if (showing && now - lastInput < IDLE_AFTER && gap < 3 * TICK) spent += gap;
}

function flush() {
  tick();
  if (spent < 1_000 || !path) return;
  post({ p: path, view: false, ms: Math.round(spent) });
  spent = 0;
  lastSent = Date.now();
}

function start() {
  started = true;
  showing = document.visibilityState === "visible";
  lastTick = lastInput = lastSent = Date.now();
  const touched = () => {
    lastInput = Date.now();
  };
  for (const name of ["pointerdown", "pointermove", "keydown", "scroll", "wheel", "touchstart"]) window.addEventListener(name, touched, { passive: true, capture: true });
  setInterval(() => {
    tick();
    if (Date.now() - lastSent >= SEND_EVERY) flush();
  }, TICK);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flush();
      showing = false;
    } else {
      showing = true;
      lastTick = lastInput = Date.now();
    }
  });
  window.addEventListener("pagehide", flush);
}

/** Called on every page, including moves between pages without a reload. */
export function pageOpened(next: string) {
  if (next === path) return;
  const first = !started;
  if (first) start();
  else flush();
  path = next;
  let r: string | undefined;
  if (first) {
    try {
      const from = document.referrer ? new URL(document.referrer).host : "";
      if (from && from !== location.host) r = from;
    } catch {
      // An unreadable referrer is no referrer.
    }
  }
  post({ p: next, view: true, ms: 0, ...(r ? { r } : {}) });
}
