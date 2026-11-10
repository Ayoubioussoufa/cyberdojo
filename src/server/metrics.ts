/**
 * Usage statistics, kept in the site's own database: who came, for how long,
 * and which pages they read. Nothing leaves this server.
 *
 * A visit is one person's stretch of activity: it ends after 30 minutes of
 * silence. The browser reports page views and the seconds it was actually in
 * use; the server never credits more time than really passed, so a forged
 * report can't inflate the figures. No IP address or user agent is stored.
 */
import { get, many, type Statement } from "./db";
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

export async function record(hit: Hit, user: User | null, ua: string, ip: string, now = Date.now()): Promise<void> {
  const device = deviceOf(ua);
  if (device === "bot") return;
  const day = dayOf(now);
  const state = mem();
  if (state.swept !== day) {
    state.swept = day;
    await many([
      ["DELETE FROM visits WHERE started_at < ?", now - KEEP_DAYS * DAY],
      ["DELETE FROM page_stats WHERE day < ?", dayOf(now - KEEP_DAYS * DAY)],
    ]);
  }
  const { lang, path } = splitPath(hit.path);
  const uid = user?.id ?? null;
  const view = hit.view ? 1 : 0;

  const open = await get<{ id: number; lastAt: number; userId: string | null }>(
    "SELECT id, last_at AS lastAt, user_id AS userId FROM visits WHERE visitor = ? AND last_at > ? ORDER BY last_at DESC LIMIT 1",
    hit.visitor,
    now - VISIT_GAP,
  );
  // A second account in the same browser is a second person.
  const same = open && (open.userId === null || uid === null || open.userId === uid);
  if (!same && ipBusy(ip, now)) return;

  const credit = open && same ? Math.min(hit.ms, MAX_BEAT, Math.max(0, now - open.lastAt) + SLACK) : 0;
  const visit: Statement =
    open && same
      ? ["UPDATE visits SET last_at = ?, active_ms = active_ms + ?, views = views + ?, user_id = COALESCE(user_id, ?) WHERE id = ?", now, credit, view, uid, open.id]
      : [
          // The day's cap is part of the statement, so a flood can't outrun a separate count.
          `INSERT INTO visits (visitor, user_id, day, started_at, last_at, active_ms, views, lang, device, referrer, entry)
           SELECT ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM visits WHERE day = ?) < ?`,
          hit.visitor, uid, day, now, now, view, lang, device, hit.referrer, path, day, MAX_VISITS_A_DAY,
        ];
  if (!view && credit === 0) {
    await many([visit]);
    return;
  }
  await many([
    visit,
    [
      // A page already seen today always counts; new addresses stop at the cap.
      `INSERT INTO page_stats (day, path, views, active_ms)
       SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM page_stats WHERE day = ? AND path = ?) OR (SELECT COUNT(*) FROM page_stats WHERE day = ?) < ?
       ON CONFLICT (day, path) DO UPDATE SET views = views + excluded.views, active_ms = active_ms + excluded.active_ms`,
      day, path, view, credit, day, path, day, MAX_PATHS_A_DAY,
    ],
  ]);
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

/** Every figure in one trip to the database: on a hosted database each trip costs a network call. */
export async function report(days: number, now = Date.now()): Promise<Report> {
  const since = dayOf(now - (days - 1) * DAY);
  const d7 = dayOf(now - 6 * DAY);
  const d30 = dayOf(now - 29 * DAY);
  const today = dayOf(now);
  const queries = {
    range: [
      `SELECT COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS visits, COUNT(DISTINCT user_id) AS accounts, COALESCE(SUM(views), 0) AS views,
              COALESCE(SUM(active_ms), 0) AS totalMs, COALESCE(SUM(views <= 1 AND active_ms < 10000), 0) AS bounces,
              COALESCE(SUM(CASE WHEN user_id IS NOT NULL THEN active_ms END), 0) AS accountMs
       FROM visits WHERE day >= ?`,
      since,
    ],
    median: ["SELECT active_ms AS n FROM visits WHERE day >= ? ORDER BY active_ms LIMIT 1 OFFSET (SELECT (COUNT(*) - 1) / 2 FROM visits WHERE day >= ?)", since, since],
    returning: ["SELECT COUNT(*) AS n FROM (SELECT visitor FROM visits WHERE day >= ? GROUP BY visitor HAVING COUNT(DISTINCT day) > 1)", since],
    daily: ["SELECT day, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS visits, COUNT(DISTINCT user_id) AS accounts, SUM(views) AS views, SUM(active_ms) AS ms FROM visits WHERE day >= ? GROUP BY day", since],
    signups: ["SELECT created_at AS at FROM users WHERE created_at >= ?", Date.parse(`${since}T00:00:00Z`)],
    accounts: [
      `SELECT COUNT(*) AS total, COALESCE(SUM(created_at >= ?), 0) AS new7, COALESCE(SUM(created_at >= ?), 0) AS new30,
              (SELECT COUNT(*) FROM progress WHERE version > 0) AS withProgress FROM users`,
      now - 7 * DAY,
      now - 30 * DAY,
    ],
    active: [
      `SELECT COUNT(DISTINCT CASE WHEN last_at > ? THEN visitor END) AS now,
              COUNT(DISTINCT CASE WHEN day = ? THEN visitor END) AS visitors1, COUNT(DISTINCT CASE WHEN day >= ? THEN visitor END) AS visitors7, COUNT(DISTINCT visitor) AS visitors30,
              COUNT(DISTINCT CASE WHEN day = ? THEN user_id END) AS accounts1, COUNT(DISTINCT CASE WHEN day >= ? THEN user_id END) AS accounts7, COUNT(DISTINCT user_id) AS accounts30
       FROM visits WHERE day >= ?`,
      now - 5 * MIN, today, d7, today, d7, d30,
    ],
    pages: ["SELECT path, SUM(views) AS views, SUM(active_ms) AS ms FROM page_stats WHERE day >= ? GROUP BY path ORDER BY views DESC, ms DESC LIMIT 25", since],
    entries: ["SELECT entry AS path, COUNT(*) AS visits FROM visits WHERE day >= ? GROUP BY entry ORDER BY visits DESC LIMIT 10", since],
    referrers: ["SELECT referrer AS host, COUNT(*) AS visits FROM visits WHERE day >= ? AND referrer <> '' GROUP BY referrer ORDER BY visits DESC LIMIT 10", since],
    devices: ["SELECT device AS name, COUNT(*) AS visits FROM visits WHERE day >= ? GROUP BY device ORDER BY visits DESC", since],
    langs: ["SELECT lang AS name, COUNT(*) AS visits FROM visits WHERE day >= ? GROUP BY lang ORDER BY visits DESC", since],
    users: [
      `SELECT u.username, u.created_at AS createdAt, MAX(v.last_at) AS lastSeen, COUNT(v.id) AS visits, COUNT(DISTINCT v.day) AS days,
              COALESCE(SUM(v.active_ms), 0) AS totalMs, p.data AS data
       FROM users u LEFT JOIN visits v ON v.user_id = u.id LEFT JOIN progress p ON p.user_id = u.id
       GROUP BY u.id ORDER BY lastSeen DESC NULLS LAST, u.created_at DESC LIMIT 500`,
    ],
  } satisfies Record<string, Statement>;
  const names = Object.keys(queries) as (keyof typeof queries)[];
  const results = await many(names.map((n) => queries[n]), "read");
  const rows = (name: keyof typeof queries) => results[names.indexOf(name)] ?? [];
  const first = (name: keyof typeof queries) => rows(name)[0] ?? {};

  const r = first("range");
  const visits = num(r.visits);
  const visitors = num(r.visitors);
  const accounts = num(r.accounts);

  const byDay = new Map<string, Report["daily"][number]>();
  for (let i = days - 1; i >= 0; i--) {
    const day = dayOf(now - i * DAY);
    byDay.set(day, { day, visitors: 0, visits: 0, accounts: 0, views: 0, ms: 0, signups: 0 });
  }
  for (const row of rows("daily")) {
    const slot = byDay.get(String(row.day));
    if (slot) Object.assign(slot, { visitors: num(row.visitors), visits: num(row.visits), accounts: num(row.accounts), views: num(row.views), ms: num(row.ms) });
  }
  for (const s of rows("signups")) {
    const slot = byDay.get(dayOf(num(s.at)));
    if (slot) slot.signups++;
  }

  const users = rows("users").map((u) => {
    let done = 0;
    try {
      done = Object.keys((JSON.parse(String(u.data ?? "{}")) as { done?: object }).done ?? {}).length;
    } catch {
      // Unreadable progress counts as none.
    }
    return { username: String(u.username), createdAt: num(u.createdAt), lastSeen: u.lastSeen === null ? null : num(u.lastSeen), visits: num(u.visits), days: num(u.days), totalMs: num(u.totalMs), done };
  });
  const a = first("accounts");
  const act = first("active");
  const counts = <K extends string>(name: keyof typeof queries, key: K) => rows(name).map((x) => ({ [key]: String(x[key]), visits: num(x.visits) })) as ({ [P in K]: string } & { visits: number })[];

  return {
    days,
    generatedAt: now,
    accounts: { total: num(a.total), new7: num(a.new7), new30: num(a.new30), withProgress: num(a.withProgress) },
    active: { now: num(act.now), visitors1: num(act.visitors1), visitors7: num(act.visitors7), visitors30: num(act.visitors30), accounts1: num(act.accounts1), accounts7: num(act.accounts7), accounts30: num(act.accounts30) },
    range: {
      visitors,
      returning: num(first("returning").n),
      visits,
      accounts,
      views: num(r.views),
      totalMs: num(r.totalMs),
      avgVisitMs: visits ? Math.round(num(r.totalMs) / visits) : 0,
      medianVisitMs: num(first("median").n),
      avgVisitorMs: visitors ? Math.round(num(r.totalMs) / visitors) : 0,
      avgAccountMs: accounts ? Math.round(num(r.accountMs) / accounts) : 0,
      bounces: num(r.bounces),
    },
    daily: [...byDay.values()],
    pages: rows("pages").map((x) => ({ path: String(x.path), views: num(x.views), ms: num(x.ms) })),
    entries: counts("entries", "path"),
    referrers: counts("referrers", "host"),
    devices: counts("devices", "name"),
    langs: counts("langs", "name"),
    users,
  };
}
