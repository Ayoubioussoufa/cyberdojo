/**
 * Usage statistics, kept in the site's own database: who came, for how long,
 * and which pages they read. Nothing leaves this server.
 *
 * A visit is one person's stretch of activity: it ends after 30 minutes of
 * silence. The browser reports page views and the seconds it was actually in
 * use; the server never credits more time than really passed, so a forged
 * report can't inflate the figures. No IP address or user agent is stored.
 */
import { db } from "./db";
import type { User } from "./session";

const MIN = 60_000;
const DAY = 86_400_000;
const VISIT_GAP = 30 * MIN;
const MAX_BEAT = 90_000;
const SLACK = 5_000;
const KEEP_DAYS = 400;
const MAX_VISITS_A_DAY = 20_000;
const MAX_PATHS_A_DAY = 2_500;
const MAX_NEW_PER_IP = 60;

const VISITOR = /^[A-Za-z0-9_-]{16,40}$/;
const PATH = /^\/[A-Za-z0-9\-_.~/]{0,119}$/;
const HOST = /^[a-z0-9.-]{1,80}$/;

export const dayOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Admins are named in CYBERDOJO_ADMINS, separated by commas. With it unset, nobody is one. */
export function isAdmin(user: Pick<User, "username"> | null): boolean {
  if (!user) return false;
  const names = (process.env.CYBERDOJO_ADMINS ?? "").split(",").map((n) => n.trim().toLowerCase()).filter(Boolean);
  return names.includes(user.username.toLowerCase());
}

export interface Hit {
  visitor: string;
  path: string;
  /** True when a page was opened; false for a report of time spent on it. */
  view: boolean;
  ms: number;
  referrer: string;
}

/** Reads what the browser sent. Null means ignore it. */
export function readHit(body: Record<string, unknown>): Hit | null {
  const visitor = typeof body.v === "string" ? body.v : "";
  const raw = typeof body.p === "string" ? body.p : "";
  if (!VISITOR.test(visitor) || !PATH.test(raw)) return null;
  const ms = typeof body.ms === "number" && Number.isFinite(body.ms) ? Math.max(0, Math.floor(body.ms)) : 0;
  let referrer = typeof body.r === "string" ? body.r.toLowerCase() : "";
  if (!HOST.test(referrer)) referrer = "";
  return { visitor, path: raw, view: body.view === true, ms, referrer };
}

/** "/fr/courses/x/" and "/courses/x" are the same page, read in two languages. */
function splitPath(raw: string): { lang: string; path: string } {
  const fr = raw === "/fr" || raw.startsWith("/fr/");
  let path = fr ? raw.slice(3) || "/" : raw;
  if (!path.endsWith("/")) path += "/";
  return { lang: fr ? "fr" : "en", path: path.replace(/\/{2,}/g, "/") };
}

const deviceOf = (ua: string) => (/bot|crawl|spider|headless|preview|monitor/i.test(ua) ? "bot" : /ipad|tablet/i.test(ua) ? "tablet" : /mobi|iphone|android/i.test(ua) ? "phone" : "computer");

const slot = globalThis as { __cyberdojoMetrics?: { swept: string; perIp: Map<string, { hour: number; n: number }> } };
const mem = () => (slot.__cyberdojoMetrics ??= { swept: "", perIp: new Map() });

/** One address can't open visits without end. Only counted behind a proxy that reports real addresses. */
function ipBusy(ip: string, now: number): boolean {
  if (ip === "direct" || ip === "unknown") return false;
  const m = mem().perIp;
  const hour = Math.floor(now / 3_600_000);
  if (m.size > 5_000) m.clear();
  const seen = m.get(ip);
  if (!seen || seen.hour !== hour) {
    m.set(ip, { hour, n: 1 });
    return false;
  }
  return ++seen.n > MAX_NEW_PER_IP;
}

export function record(hit: Hit, user: User | null, ua: string, ip: string, now = Date.now()): void {
  const device = deviceOf(ua);
  if (device === "bot") return;
  const conn = db();
  const day = dayOf(now);
  const state = mem();
  if (state.swept !== day) {
    state.swept = day;
    conn.prepare("DELETE FROM visits WHERE started_at < ?").run(now - KEEP_DAYS * DAY);
    conn.prepare("DELETE FROM page_stats WHERE day < ?").run(dayOf(now - KEEP_DAYS * DAY));
  }
  const { lang, path } = splitPath(hit.path);
  const uid = user?.id ?? null;

  const open = conn
    .prepare("SELECT id, last_at AS lastAt, user_id AS userId FROM visits WHERE visitor = ? AND last_at > ? ORDER BY last_at DESC LIMIT 1")
    .get(hit.visitor, now - VISIT_GAP) as { id: number; lastAt: number; userId: string | null } | undefined;
  // A second account in the same browser is a second person.
  const same = open && (open.userId === null || uid === null || open.userId === uid);

  let credit = 0;
  if (open && same) {
    credit = Math.min(hit.ms, MAX_BEAT, Math.max(0, now - open.lastAt) + SLACK);
    conn.prepare("UPDATE visits SET last_at = ?, active_ms = active_ms + ?, views = views + ?, user_id = COALESCE(user_id, ?) WHERE id = ?").run(now, credit, hit.view ? 1 : 0, uid, open.id);
  } else {
    const today = conn.prepare("SELECT COUNT(*) AS n FROM visits WHERE day = ?").get(day) as { n: number };
    if (today.n >= MAX_VISITS_A_DAY || ipBusy(ip, now)) return;
    conn.prepare("INSERT INTO visits (visitor, user_id, day, started_at, last_at, active_ms, views, lang, device, referrer, entry) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)").run(hit.visitor, uid, day, now, now, hit.view ? 1 : 0, lang, device, hit.referrer, path);
  }

  if (!hit.view && credit === 0) return;
  const known = conn.prepare("SELECT 1 FROM page_stats WHERE day = ? AND path = ?").get(day, path);
  if (!known) {
    const paths = conn.prepare("SELECT COUNT(*) AS n FROM page_stats WHERE day = ?").get(day) as { n: number };
    if (paths.n >= MAX_PATHS_A_DAY) return;
  }
  conn
    .prepare("INSERT INTO page_stats (day, path, views, active_ms) VALUES (?, ?, ?, ?) ON CONFLICT (day, path) DO UPDATE SET views = views + excluded.views, active_ms = active_ms + excluded.active_ms")
    .run(day, path, hit.view ? 1 : 0, credit);
}

export interface Report {
  days: number;
  generatedAt: number;
  accounts: { total: number; new7: number; new30: number; withProgress: number };
  active: { now: number; visitors1: number; visitors7: number; visitors30: number; accounts1: number; accounts7: number; accounts30: number };
  range: { visitors: number; returning: number; visits: number; accounts: number; views: number; totalMs: number; avgVisitMs: number; medianVisitMs: number; avgVisitorMs: number; avgAccountMs: number; bounces: number };
  daily: { day: string; visitors: number; visits: number; accounts: number; views: number; ms: number; signups: number }[];
  pages: { path: string; views: number; ms: number }[];
  entries: { path: string; visits: number }[];
  referrers: { host: string; visits: number }[];
  devices: { name: string; visits: number }[];
  langs: { name: string; visits: number }[];
  users: { username: string; createdAt: number; lastSeen: number | null; visits: number; days: number; totalMs: number; done: number }[];
}

const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0)) || 0;

export function report(days: number, now = Date.now()): Report {
  const conn = db();
  const one = (sql: string, ...args: (string | number)[]) => num((conn.prepare(sql).get(...args) as { n: unknown } | undefined)?.n);
  const since = dayOf(now - (days - 1) * DAY);
  const d7 = dayOf(now - 6 * DAY);
  const d30 = dayOf(now - 29 * DAY);
  const today = dayOf(now);

  const r = conn
    .prepare(
      `SELECT COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS visits, COUNT(DISTINCT user_id) AS accounts, COALESCE(SUM(views), 0) AS views,
              COALESCE(SUM(active_ms), 0) AS totalMs, COALESCE(SUM(views <= 1 AND active_ms < 10000), 0) AS bounces,
              COALESCE(SUM(CASE WHEN user_id IS NOT NULL THEN active_ms END), 0) AS accountMs
       FROM visits WHERE day >= ?`,
    )
    .get(since) as Record<string, unknown>;
  const visits = num(r.visits);
  const visitors = num(r.visitors);
  const accounts = num(r.accounts);
  const median = visits ? one("SELECT active_ms AS n FROM visits WHERE day >= ? ORDER BY active_ms LIMIT 1 OFFSET ?", since, Math.floor((visits - 1) / 2)) : 0;

  const byDay = new Map<string, Report["daily"][number]>();
  for (let i = days - 1; i >= 0; i--) {
    const day = dayOf(now - i * DAY);
    byDay.set(day, { day, visitors: 0, visits: 0, accounts: 0, views: 0, ms: 0, signups: 0 });
  }
  const rows = conn
    .prepare("SELECT day, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS visits, COUNT(DISTINCT user_id) AS accounts, SUM(views) AS views, SUM(active_ms) AS ms FROM visits WHERE day >= ? GROUP BY day")
    .all(since) as Record<string, unknown>[];
  for (const row of rows) {
    const slot = byDay.get(String(row.day));
    if (slot) Object.assign(slot, { visitors: num(row.visitors), visits: num(row.visits), accounts: num(row.accounts), views: num(row.views), ms: num(row.ms) });
  }
  const signups = conn.prepare("SELECT created_at AS at FROM users WHERE created_at >= ?").all(Date.parse(`${since}T00:00:00Z`)) as { at: number }[];
  for (const s of signups) {
    const slot = byDay.get(dayOf(s.at));
    if (slot) slot.signups++;
  }

  const list = <T>(sql: string, ...args: (string | number)[]) => conn.prepare(sql).all(...args) as T[];
  const users = list<Record<string, unknown>>(
    `SELECT u.username, u.created_at AS createdAt, MAX(v.last_at) AS lastSeen, COUNT(v.id) AS visits, COUNT(DISTINCT v.day) AS days,
            COALESCE(SUM(v.active_ms), 0) AS totalMs, p.data AS data
     FROM users u LEFT JOIN visits v ON v.user_id = u.id LEFT JOIN progress p ON p.user_id = u.id
     GROUP BY u.id ORDER BY lastSeen DESC NULLS LAST, u.created_at DESC LIMIT 500`,
  ).map((u) => {
    let done = 0;
    try {
      done = Object.keys((JSON.parse(String(u.data ?? "{}")) as { done?: object }).done ?? {}).length;
    } catch {
      // Unreadable progress counts as none.
    }
    return { username: String(u.username), createdAt: num(u.createdAt), lastSeen: u.lastSeen === null ? null : num(u.lastSeen), visits: num(u.visits), days: num(u.days), totalMs: num(u.totalMs), done };
  });

  return {
    days,
    generatedAt: now,
    accounts: {
      total: one("SELECT COUNT(*) AS n FROM users"),
      new7: one("SELECT COUNT(*) AS n FROM users WHERE created_at >= ?", now - 7 * DAY),
      new30: one("SELECT COUNT(*) AS n FROM users WHERE created_at >= ?", now - 30 * DAY),
      withProgress: one("SELECT COUNT(*) AS n FROM progress WHERE version > 0"),
    },
    active: {
      now: one("SELECT COUNT(DISTINCT visitor) AS n FROM visits WHERE last_at > ?", now - 5 * MIN),
      visitors1: one("SELECT COUNT(DISTINCT visitor) AS n FROM visits WHERE day = ?", today),
      visitors7: one("SELECT COUNT(DISTINCT visitor) AS n FROM visits WHERE day >= ?", d7),
      visitors30: one("SELECT COUNT(DISTINCT visitor) AS n FROM visits WHERE day >= ?", d30),
      accounts1: one("SELECT COUNT(DISTINCT user_id) AS n FROM visits WHERE day = ?", today),
      accounts7: one("SELECT COUNT(DISTINCT user_id) AS n FROM visits WHERE day >= ?", d7),
      accounts30: one("SELECT COUNT(DISTINCT user_id) AS n FROM visits WHERE day >= ?", d30),
    },
    range: {
      visitors,
      returning: one("SELECT COUNT(*) AS n FROM (SELECT visitor FROM visits WHERE day >= ? GROUP BY visitor HAVING COUNT(DISTINCT day) > 1)", since),
      visits,
      accounts,
      views: num(r.views),
      totalMs: num(r.totalMs),
      avgVisitMs: visits ? Math.round(num(r.totalMs) / visits) : 0,
      medianVisitMs: median,
      avgVisitorMs: visitors ? Math.round(num(r.totalMs) / visitors) : 0,
      avgAccountMs: accounts ? Math.round(num(r.accountMs) / accounts) : 0,
      bounces: num(r.bounces),
    },
    daily: [...byDay.values()],
    pages: list("SELECT path, SUM(views) AS views, SUM(active_ms) AS ms FROM page_stats WHERE day >= ? GROUP BY path ORDER BY views DESC, ms DESC LIMIT 25", since),
    entries: list("SELECT entry AS path, COUNT(*) AS visits FROM visits WHERE day >= ? GROUP BY entry ORDER BY visits DESC LIMIT 10", since),
    referrers: list("SELECT referrer AS host, COUNT(*) AS visits FROM visits WHERE day >= ? AND referrer <> '' GROUP BY referrer ORDER BY visits DESC LIMIT 10", since),
    devices: list("SELECT device AS name, COUNT(*) AS visits FROM visits WHERE day >= ? GROUP BY device ORDER BY visits DESC", since),
    langs: list("SELECT lang AS name, COUNT(*) AS visits FROM visits WHERE day >= ? GROUP BY lang ORDER BY visits DESC", since),
    users,
  };
}
