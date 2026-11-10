/**
 * Usage statistics, end to end: starts the built server on a throwaway
 * database, reports visits the way a browser would, and checks that only an
 * admin can read the figures. Needs `pnpm build` first; `pnpm test` runs it after.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { isAdmin, readHit, type Report } from "../src/server/metrics";

const PORT = 3103;
const BASE = `http://localhost:${PORT}`;
const UA = "Mozilla/5.0 (X11; Linux x86_64) Firefox/140.0";
let bad = 0;
let checks = 0;
const ok = (cond: boolean, what: string, detail?: unknown) => {
  checks++;
  if (cond) return;
  bad++;
  console.log(`✗ ${what}${detail === undefined ? "" : `: ${JSON.stringify(detail)}`}`);
};

function client() {
  let cookie = "";
  return async (method: string, url: string, body?: unknown, headers: Record<string, string> = {}) => {
    const res = await fetch(BASE + url, {
      method,
      headers: { origin: BASE, "user-agent": UA, ...(body === undefined ? {} : { "content-type": "application/json" }), ...(cookie ? { cookie } : {}), ...headers },
      body: body === undefined ? null : JSON.stringify(body),
    });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0] as string;
    const text = await res.text();
    let json: Record<string, unknown> = {};
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      // Not JSON.
    }
    return { status: res.status, json };
  };
}

function unit() {
  const v = "a".repeat(32);
  ok(readHit({ v, p: "/courses/", view: true }) !== null, "a plain page view is read");
  ok(readHit({ v: "short", p: "/" }) === null, "a short visitor number is refused");
  ok(readHit({ v, p: "courses" }) === null && readHit({ v, p: "/a?b=<script>" }) === null, "odd paths are refused");
  ok(readHit({ v, p: `/${"x".repeat(200)}` }) === null, "long paths are refused");
  ok(readHit({ v, p: "/", ms: -5 })?.ms === 0 && readHit({ v, p: "/", ms: "9" })?.ms === 0, "bad durations count as zero");
  ok(readHit({ v, p: "/", r: "Evil.example/<x>" })?.referrer === "", "a referrer that isn't a hostname is dropped");
  const before = process.env.CYBERDOJO_ADMINS;
  delete process.env.CYBERDOJO_ADMINS;
  ok(!isAdmin({ username: "root" }), "with no admins named, nobody is one");
  process.env.CYBERDOJO_ADMINS = " Root , ops";
  ok(isAdmin({ username: "root" }) && isAdmin({ username: "OPS" }) && !isAdmin({ username: "roo" }) && !isAdmin(null), "admins are matched by whole name, any case");
  if (before === undefined) delete process.env.CYBERDOJO_ADMINS;
  else process.env.CYBERDOJO_ADMINS = before;
}

async function http() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cyberdojo-metrics-"));
  const file = path.join(dir, "test.db");
  const server = spawn("node_modules/.bin/next", ["start", "-p", String(PORT)], { env: { ...process.env, TURSO_DATABASE_URL: "", CYBERDOJO_DB: file, NODE_ENV: "production", CYBERDOJO_ADMINS: "boss" }, stdio: "pipe" });
  let log = "";
  server.stderr.on("data", (d: Buffer) => (log += d.toString()));
  try {
    let up = false;
    for (let i = 0; i < 60 && !up; i++) {
      up = await fetch(`${BASE}/api/auth/me/`).then((r) => r.ok, () => false);
      if (!up) await new Promise((r) => setTimeout(r, 250));
    }
    ok(up, "server starts");
    if (!up) return;
    const raw = new DatabaseSync(file);
    const count = (sql: string) => Number((raw.prepare(sql).get() as { n: number }).n);

    const pw = "river tiger lamp 42";
    const guest = client();
    const lea = client();
    const boss = client();
    const g = "g".repeat(32);
    const l = "l".repeat(32);

    // Who may read the figures.
    ok((await guest("GET", "/api/admin/stats/")).status === 404, "a stranger gets a 404 for the figures");
    ok((await lea("POST", "/api/auth/signup/", { username: "lea", password: pw })).status === 201, "a learner signs up");
    ok((await lea("GET", "/api/admin/stats/")).status === 404, "a signed-in learner gets the same 404");
    ok(!("admin" in (await lea("GET", "/api/auth/me/")).json), "a learner isn't told about admins");
    const made = await boss("POST", "/api/auth/signup/", { username: "Boss", password: pw });
    ok(made.status === 201 && made.json.admin === true, "the named admin is recognised at sign-up", made.json);
    ok((await boss("GET", "/api/auth/me/")).json.admin === true, "and on later visits");
    ok((await fetch(`${BASE}/admin/`)).status === 200, "the admin page shell is served");

    // What is refused.
    const send = (who: ReturnType<typeof client>, body: unknown, headers: Record<string, string> = {}) => who("POST", "/api/track/", body, headers);
    ok((await send(guest, { v: g, p: "/", view: true }, { origin: "https://evil.example" })).status === 204 && count("SELECT COUNT(*) AS n FROM visits") === 0, "another site can't add visits");
    await send(guest, { v: "x", p: "/", view: true });
    await send(guest, { v: g, p: "/<script>", view: true });
    await send(guest, { v: g, p: "/", view: true }, { "user-agent": "Googlebot/2.1" });
    ok(count("SELECT COUNT(*) AS n FROM visits") === 0, "bad visitors, bad paths and crawlers aren't counted");

    // A guest visit.
    await send(guest, { v: g, p: "/", view: true, r: "www.example.org" });
    await send(guest, { v: g, p: "/fr/courses/0001-what-a-computer-is", view: true });
    await send(guest, { v: g, p: "/fr/courses/0001-what-a-computer-is", view: false, ms: 3_600_000 });
    const visit = raw.prepare("SELECT * FROM visits WHERE visitor = ?").get(g) as Record<string, number | string | null>;
    ok(count("SELECT COUNT(*) AS n FROM visits") === 1 && visit.views === 2, "two pages in a row are one visit", visit);
    ok(Number(visit.active_ms) > 0 && Number(visit.active_ms) <= 6_000, "an hour claimed in a second is credited as the time that passed", visit.active_ms);
    ok(visit.referrer === "www.example.org" && visit.entry === "/" && visit.lang === "en" && visit.device === "computer" && visit.user_id === null, "the visit keeps where it came from", visit);
    const page = raw.prepare("SELECT views, active_ms FROM page_stats WHERE path = '/courses/0001-what-a-computer-is/'").get() as { views: number; active_ms: number } | undefined;
    ok(page?.views === 1 && page.active_ms === visit.active_ms, "French and English addresses count as one page", page);
    ok(JSON.stringify(Object.keys(visit)).search(/ip|agent/i) === -1, "no address or user agent column exists");

    // A signed-in visit.
    await send(lea, { v: l, p: "/roadmap/", view: true }, { "user-agent": "Mozilla/5.0 (iPhone) Mobile Safari" });
    await new Promise((r) => setTimeout(r, 1_200));
    await send(lea, { v: l, p: "/roadmap/", view: false, ms: 1_000 }, { "user-agent": "Mozilla/5.0 (iPhone) Mobile Safari" });
    const mine = raw.prepare("SELECT v.active_ms, v.device, u.username FROM visits v JOIN users u ON u.id = v.user_id WHERE v.visitor = ?").get(l) as Record<string, unknown> | undefined;
    ok(mine?.username === "lea" && mine.active_ms === 1_000 && mine.device === "phone", "a signed-in visit is tied to the account, with real time credited in full", mine);

    // The report.
    const res = await boss("GET", "/api/admin/stats/?days=7");
    const rep = res.json as unknown as Report;
    ok(res.status === 200 && rep.days === 7 && rep.daily.length === 7, "the admin reads the report");
    ok(rep.accounts.total === 2 && rep.accounts.new7 === 2, "accounts are counted", rep.accounts);
    ok(rep.range.visitors === 2 && rep.range.visits === 2 && rep.range.accounts === 1 && rep.range.views === 3, "visitors, visits and views add up", rep.range);
    ok(rep.active.now === 2 && rep.active.visitors1 === 2 && rep.active.accounts7 === 1, "active people are counted", rep.active);
    ok(rep.range.totalMs === Number(visit.active_ms) + 1_000 && rep.range.avgVisitMs === Math.round(rep.range.totalMs / 2) && rep.range.avgAccountMs === 1_000, "averages come from the stored time", rep.range);
    const today = rep.daily[rep.daily.length - 1];
    ok(today?.visitors === 2 && today.signups === 2, "today's row has today's figures", today);
    const row = rep.users.find((u) => u.username === "lea");
    ok(row?.visits === 1 && row.totalMs === 1_000 && rep.users.some((u) => u.username === "Boss" && u.visits === 0), "each account has its own line, visited or not", rep.users);
    ok(rep.referrers[0]?.host === "www.example.org" && rep.pages.length === 3 && rep.langs.length === 1, "pages and sources are listed", { r: rep.referrers, p: rep.pages });
    ok(!JSON.stringify(rep).includes("password") && !JSON.stringify(rep).includes(g), "the report holds no hashes and no visitor numbers");
    ok((await boss("GET", "/api/admin/stats/?days=99999")).json.days === 30, "an odd period falls back to 30 days");

    // Leaving.
    ok((await lea("DELETE", "/api/account/", { password: pw })).status === 200, "the learner deletes the account");
    ok(count("SELECT COUNT(*) AS n FROM visits WHERE visitor = '" + l + "' AND user_id IS NULL") === 1, "their visits stay as anonymous counts, with no name attached");
    raw.close();
  } finally {
    server.kill();
    fs.rmSync(dir, { recursive: true, force: true });
    if (bad) console.log(log.slice(-1500));
  }
}

unit();
void http().then(() => {
  console.log(`${checks} statistics checks, ${bad} failures`);
  process.exit(bad ? 1 : 0);
});
