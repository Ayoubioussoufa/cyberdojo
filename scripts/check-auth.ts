/**
 * Accounts and saved progress, end to end: starts the built server on a
 * throwaway database and attacks it the way a real client would.
 * Needs `pnpm build` first. `pnpm test` runs it after the build.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { request } from "node:http";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { cleanProgress, EMPTY_STORE, hasProgress, MAX_PROGRESS_BYTES, mergeStores } from "../src/lib/merge";
import { BELTS } from "../src/data/path";
import { buildPath } from "../src/lib/path";
import type { Store } from "../src/lib/progress-types";
import { safeNext } from "../src/lib/safe-next";
import { hashPassword, needsRehash, passwordProblem, verifyPassword } from "../src/server/password";

const PORT = 3102;
const BASE = `http://localhost:${PORT}`;
let bad = 0;
let checks = 0;
const ok = (cond: boolean, what: string, detail?: unknown) => {
  checks++;
  if (cond) return;
  bad++;
  console.log(`✗ ${what}${detail === undefined ? "" : `: ${JSON.stringify(detail)}`}`);
};

/** A client with its own cookie jar. */
function client() {
  let cookie = "";
  return async (method: string, url: string, body?: unknown, headers: Record<string, string> = {}) => {
    const res = await fetch(BASE + url, {
      method,
      redirect: "manual",
      headers: { origin: BASE, ...(body === undefined ? {} : { "content-type": "application/json" }), ...(cookie ? { cookie } : {}), ...headers },
      body: body === undefined ? null : typeof body === "string" ? body : JSON.stringify(body),
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
    return { status: res.status, json, setCookie: set, cookie: () => cookie };
  };
}

async function unit() {
  // Where sign-in sends you next: this site only, however the address is disguised.
  const site = "https://cyberdojo.example";
  const next = (v: string) => safeNext(`?next=${encodeURIComponent(v)}`, site);
  ok(next("/courses/0001-x/?q=1#a") === "/courses/0001-x/?q=1#a", "a page on this site is kept, with its query and anchor");
  for (const evil of ["//evil.com", "/\\evil.com", "/\t/evil.com", "/\n/evil.com", "/\r\n/evil.com", "https://evil.com/", "javascript:alert(1)", " //evil.com", "\\/evil.com"]) {
    ok(next(evil) === "/" || next(evil).startsWith("/") && new URL(next(evil), site).origin === site, `a disguised address stays home: ${JSON.stringify(evil)}`, next(evil));
  }
  ok(safeNext("", site) === "/", "no next, home");

  const stored = await hashPassword("correct horse battery");
  ok(stored.startsWith("scrypt$17$8$1$"), "hash records its parameters");
  ok(await verifyPassword(stored, "correct horse battery"), "right password verifies");
  ok(!(await verifyPassword(stored, "correct horse batterz")), "wrong password fails");
  ok((await hashPassword("x")) !== (await hashPassword("x")), "each hash has its own salt");
  ok(!needsRehash(stored) && needsRehash("scrypt$14$8$1$a$b"), "weaker hashes are flagged for upgrade");
  ok(passwordProblem("short", "ana") !== null, "short password refused");
  ok(passwordProblem("aaaaaaaaaaaaaaaa", "ana") !== null, "repetitive password refused");
  ok(passwordProblem("xx-ana-is-my-name", "ana") !== null, "password containing the username refused");
  ok(passwordProblem("mypassword-2026!", "ana") !== null, "common pattern refused");
  ok(passwordProblem("river tiger lamp 42", "ana") === null, "a good passphrase is accepted");

  const a: Store = { ...EMPTY_STORE, done: { l1: "2026-11-01", l2: "2026-11-05" }, picks: { q1: 1 }, written: { w: "kept" }, days: { "2026-11-01": 3 }, drills: { d: { best: 0.9, plays: 2 } }, first: { q1: false }, srs: { q1: { box: 2, due: "2026-11-20" } }, mistakes: [{ key: "m1", source: "", prompt: "", right: "", given: "", why: "", date: "2026-11-01" }], seen: { d: [1, 2] } };
  const b: Store = { ...EMPTY_STORE, done: { l2: "2026-11-02", l3: "2026-11-06" }, picks: { q1: 2, q2: 0 }, written: { w: "   " }, days: { "2026-11-01": 1, "2026-11-06": 4 }, drills: { d: { best: 0.5, plays: 7 } }, first: { q1: true }, srs: { q1: { box: 1, due: "2026-11-08" } }, mistakes: [{ key: "m2", source: "", prompt: "", right: "", given: "", why: "", date: "2026-11-06" }], seen: { d: [2, 3] } };
  const m = mergeStores(a, b);
  ok(Object.keys(m.done).length === 3 && m.done.l2 === "2026-11-02", "merge keeps every finished lesson with its earliest date", m.done);
  ok(m.picks.q1 === 2 && m.picks.q2 === 0, "merge prefers the newer answer");
  ok(m.written.w === "kept", "merge never replaces writing with blanks");
  ok(m.days["2026-11-01"] === 3 && m.days["2026-11-06"] === 4, "merge keeps the streak");
  ok(m.drills.d?.best === 0.9 && m.drills.d?.plays === 7, "merge keeps best score and most plays");
  ok(m.first.q1 === false, "merge keeps the first attempt from the saved copy");
  ok(m.srs.q1?.box === 2, "merge keeps the further review date");
  ok(m.mistakes.length === 2 && m.mistakes[0]?.key === "m2", "merge unions mistakes, newest first");
  ok((m.seen.d ?? []).length === 3, "merge unions seen rows");
  ok(JSON.stringify(mergeStores(m, m)) === JSON.stringify(m), "merging a copy with itself changes nothing");
  ok(JSON.stringify(mergeStores(EMPTY_STORE, a).done) === JSON.stringify(a.done), "merging into an empty account keeps all guest work");

  ok(cleanProgress({}) !== null, "empty progress is valid");
  ok(cleanProgress({ picks: "x" }) === null, "wrong type refused");
  ok(cleanProgress({ srs: { a: { box: "1" } } }) === null, "bad card refused");
  ok(cleanProgress([]) === null && cleanProgress(null) === null, "non-objects refused");
  ok(!("admin" in (cleanProgress({ admin: true }) as object)), "unknown fields are dropped");
  ok(!hasProgress(EMPTY_STORE) && hasProgress(a), "guest work is detected");
}

async function http() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cyberdojo-auth-"));
  const file = path.join(dir, "test.db");
  const server = spawn("node_modules/.bin/next", ["start", "-p", String(PORT)], { env: { ...process.env, TURSO_DATABASE_URL: "", CYBERDOJO_DB: file, NODE_ENV: "production", SIGNUP_LIMIT: "12" }, stdio: "pipe" });
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

    const pw = "river tiger lamp 42";
    const ana = client();
    const omar = client();
    ok((await ana("GET", "/api/auth/me/")).json.user === null, "a stranger is nobody");
    ok((await ana("GET", "/api/progress/")).status === 401, "progress needs a session");

    ok((await ana("POST", "/api/auth/signup/", { username: "a", password: pw })).status === 400, "short username refused");
    ok((await ana("POST", "/api/auth/signup/", { username: "<script>", password: pw })).status === 400, "markup in a username refused");
    ok((await ana("POST", "/api/auth/signup/", { username: "ana", password: "short" })).status === 400, "weak password refused by the server");
    const made = await ana("POST", "/api/auth/signup/", { username: "ana", password: pw });
    ok(made.status === 201, "sign-up works", made.json);
    ok(/httponly/i.test(made.setCookie ?? "") && /samesite=lax/i.test(made.setCookie ?? ""), "session cookie is HttpOnly and SameSite", made.setCookie);
    ok(!/secure/i.test(made.setCookie ?? ""), "on this computer the cookie works over plain http", made.setCookie);
    const liveCookie = await new Promise<string>((done) => {
      // fetch() won't set Host, so this one goes through node:http.
      const body = JSON.stringify({ username: "onlinehost", password: pw });
      const req = request({ port: PORT, path: "/api/auth/signup/", method: "POST", headers: { host: "cyberdojo.example", origin: "https://cyberdojo.example", "content-type": "application/json", "content-length": Buffer.byteLength(body) } }, (res) => {
        res.resume();
        done(res.headers["set-cookie"]?.[0] ?? "");
      });
      req.end(body);
    });
    ok(/^__Host-cyberdojo=/.test(liveCookie) && /;\s*secure/i.test(liveCookie), "on a real hostname the cookie is __Host- and Secure", liveCookie);
    ok((await omar("POST", "/api/auth/signup/", { username: "ANA", password: pw })).status === 409, "usernames ignore case");
    ok((await omar("POST", "/api/auth/signup/", { username: "omar", password: pw })).status === 201, "second user signs up");

    // Other sites.
    ok((await ana("POST", "/api/auth/logout/", undefined, { origin: "https://evil.example" })).status === 403, "cross-site logout refused");
    ok((await ana("PUT", "/api/progress/", { data: {}, version: 0 }, { origin: "https://evil.example" })).status === 403, "cross-site save refused");
    ok((await ana("DELETE", "/api/account/", { password: pw }, { origin: "https://evil.example" })).status === 403, "cross-site delete refused");
    const noOrigin = await fetch(`${BASE}/api/auth/login/`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    ok(noOrigin.status === 403, "a request with no Origin refused");

    // Each person sees only their own data.
    const put = await ana("PUT", "/api/progress/", { data: { done: { l1: "2026-11-06" } }, version: 0 });
    ok(put.status === 200 && put.json.version === 1, "progress saves", put.json);
    const mine = await ana("GET", "/api/progress/");
    ok((mine.json.data as Store).done.l1 === "2026-11-06", "progress reads back");
    ok(Object.keys(((await omar("GET", "/api/progress/")).json.data as Partial<Store>).done ?? {}).length === 0, "one user can't see another's progress");

    // Two devices.
    const stale = await ana("PUT", "/api/progress/", { data: { done: {} }, version: 0 });
    ok(stale.status === 409 && stale.json.version === 1, "a stale save is refused and gets the newer copy", stale.json);
    ok(((await ana("GET", "/api/progress/")).json.data as Store).done.l1 === "2026-11-06", "a stale save overwrites nothing");

    // Bad input.
    ok((await ana("PUT", "/api/progress/", "not json")).status === 400, "garbage refused");
    ok((await ana("PUT", "/api/progress/", { data: { picks: 1 }, version: 1 })).status === 400, "malformed progress refused");
    ok((await ana("PUT", "/api/progress/", { data: {}, version: "1" })).status === 400, "bad version refused");
    ok((await ana("PUT", "/api/progress/", { data: { written: { a: "x".repeat(MAX_PROGRESS_BYTES) } }, version: 1 })).status === 413, "oversized progress refused");
    const huge = await ana("POST", "/api/auth/login/", { username: "ana", password: "x".repeat(5000) });
    ok(huge.status === 400, "oversized login refused before hashing", huge.status);
    ok((await ana("POST", "/api/auth/login/", { username: "ana' OR '1'='1", password: "' OR '1'='1" })).status === 401, "SQL in the login form is just a wrong name");

    // Sessions.
    const second = client();
    ok((await second("POST", "/api/auth/login/", { username: "ana", password: pw })).status === 200, "login on a second device");
    ok(((await second("GET", "/api/auth/me/")).json.user as { username: string }).username === "ana", "second device is signed in");
    const wrongNow = await second("POST", "/api/auth/password/", { current: "wrong wrong wrong", next: "a brand new passphrase 7" });
    ok(wrongNow.status === 403, "changing the password needs the current one");
    ok((await second("POST", "/api/auth/password/", { current: pw, next: "short" })).status === 400, "new password must pass the rules");
    const next = "a brand new passphrase 7";
    ok((await second("POST", "/api/auth/password/", { current: pw, next })).status === 200, "password changes");
    ok((await ana("GET", "/api/auth/me/")).json.user === null, "changing the password signs out other devices");
    ok((await second("GET", "/api/auth/me/")).json.user !== null, "the device that changed it stays signed in");
    ok((await ana("POST", "/api/auth/login/", { username: "ana", password: pw })).status === 401, "the old password stops working");
    const rejoin = await ana("POST", "/api/auth/login/", { username: "ana", password: next });
    ok(rejoin.status === 200, "the new password works");
    const before = rejoin.cookie();
    ok((await ana("POST", "/api/auth/logout/")).status === 200, "logout works");
    const replay = await fetch(`${BASE}/api/auth/me/`, { headers: { cookie: before } });
    ok(((await replay.json()) as { user: unknown }).user === null, "a logged-out session can't be replayed");

    // Enumeration: same answer for a real name and an unknown one.
    const real = await ana("POST", "/api/auth/login/", { username: "omar", password: "wrong wrong wrong" });
    const fake = await ana("POST", "/api/auth/login/", { username: "nobody-here", password: "wrong wrong wrong" });
    ok(real.status === fake.status && real.json.error === fake.json.error, "wrong password and unknown user look identical");

    // Brute force.
    const guess = client();
    let last = 0;
    for (let i = 0; i < 9; i++) last = (await guess("POST", "/api/auth/login/", { username: "omar", password: `guess number ${i}` })).status;
    ok(last === 429, "repeated guesses get locked out", last);
    ok((await guess("POST", "/api/auth/login/", { username: "omar", password: pw })).status === 429, "even the right password waits out the lockout");

    // What is on disk.
    const raw = new DatabaseSync(file);
    const row = raw.prepare("SELECT password_hash FROM users WHERE username = 'omar'").get() as { password_hash: string };
    ok(row.password_hash.startsWith("scrypt$") && !row.password_hash.includes(pw), "passwords are stored hashed");
    const tokens = (raw.prepare("SELECT token_hash FROM sessions").all() as { token_hash: string }[]).map((r) => r.token_hash);
    const liveToken = decodeURIComponent(((await second("GET", "/api/auth/me/")).cookie().split("=")[1]) as string);
    ok(tokens.length > 0 && !tokens.includes(liveToken), "session tokens are stored hashed");

    // Deleting.
    ok((await second("DELETE", "/api/account/", { password: "wrong wrong wrong" })).status === 403, "deleting needs the password");
    ok((await second("DELETE", "/api/account/", { password: next })).status === 200, "account deletes");
    ok(raw.prepare("SELECT COUNT(*) AS n FROM users WHERE username = 'ana'").get()?.n === 0, "the user row is gone");
    ok(raw.prepare("SELECT COUNT(*) AS n FROM progress p WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id)").get()?.n === 0, "no orphaned progress");
    ok(raw.prepare("SELECT COUNT(*) AS n FROM sessions s WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id)").get()?.n === 0, "no orphaned sessions");
    raw.close();

    // The front door: content is for members.
    const lesson = "/courses/0006-pipes-and-redirection/";
    const shut = await fetch(BASE + lesson, { redirect: "manual" });
    ok(shut.status === 307 && shut.headers.get("location")?.endsWith(`/signin/?next=${encodeURIComponent(lesson)}`) === true, "a stranger asking for a lesson is sent to sign in", shut.headers.get("location"));
    const shutFr = await fetch(`${BASE}/fr/dojo/`, { redirect: "manual" });
    ok(shutFr.status === 307 && shutFr.headers.get("location")?.includes("/fr/signin/?next=%2Fdojo%2F") === true, "in French, to the French sign-in page", shutFr.headers.get("location"));
    ok((await fetch(`${BASE}/data/questions.json`, { redirect: "manual" })).status === 307, "the question data is behind the door too");
    ok((await fetch(BASE + lesson, { redirect: "manual", headers: { cookie: "cyberdojo=made-up-token" } })).status === 307, "a made-up cookie opens nothing");
    ok((await fetch(BASE + lesson, { redirect: "manual", headers: { cookie: before } })).status === 307, "nor does a logged-out session");
    ok((await fetch(`${BASE}/signin/`, { redirect: "manual" })).status === 200 && (await fetch(`${BASE}/fr/signin/`, { redirect: "manual" })).status === 200, "the sign-in page is open to all");
    ok((await fetch(`${BASE}/download/`, { redirect: "manual" })).status === 200 && (await fetch(`${BASE}/fr/download/`, { redirect: "manual" })).status === 200, "the app's download page is open to all");
    ok((await fetch(`${BASE}/downloads-secret/`, { redirect: "manual" })).status === 307, "and only that page: a look-alike address stays shut");
    const door = await fetch(`${BASE}/`, { redirect: "manual" });
    ok(door.status === 200 && (await door.text()).includes("/signin/?mode=up"), "a visitor at the front door sees the landing page");
    const doorFr = await fetch(`${BASE}/fr/`, { redirect: "manual" });
    ok(doorFr.status === 200 && (await doorFr.text()).includes("Apprenez la cybersécurité"), "in French too");
    const member = { cookie: (await omar("GET", "/api/auth/me/")).cookie() };
    const page = await fetch(BASE + lesson, { headers: member });
    ok(page.status === 200 && page.headers.get("x-frame-options") === "DENY" && page.headers.get("x-content-type-options") === "nosniff", "pages carry the security headers");
    const csp = page.headers.get("content-security-policy") ?? "";
    ok(/default-src 'self'/.test(csp) && /frame-ancestors 'none'/.test(csp) && /object-src 'none'/.test(csp) && !/unsafe-eval/.test(csp), "pages carry a content security policy", csp);
    ok(!page.headers.has("x-powered-by"), "the server doesn't advertise itself");
    const data = await fetch(`${BASE}/data/questions.json`, { headers: member });
    ok(data.status === 200 && (((await data.json()) as unknown[]).length) > 300, "question data is served");

    // Certificates: a shared certificate is public; issuing one needs an earned belt.
    ok((await fetch(`${BASE}/cert/does-not-exist/`, { redirect: "manual" })).status === 404, "a shared certificate is open to all; an unknown one is just not found");
    ok((await fetch(`${BASE}/certificates/`, { redirect: "manual" })).status === 307, "but the learner's own certificates page needs sign-in");
    ok((await fetch(`${BASE}/api/cert/`, { method: "POST", headers: { origin: BASE, "content-type": "application/json" }, body: "{}" })).status === 401, "issuing a certificate needs an account");
    const beforeEarn = await omar("GET", "/api/cert/");
    ok(beforeEarn.status === 200 && Array.isArray(beforeEarn.json.earned) && (beforeEarn.json.earned as number[]).length === 0, "a fresh account has earned no belts", beforeEarn.json);
    ok((await omar("POST", "/api/cert/", { belt: 1 })).status === 400 && (await omar("POST", "/api/cert/", { belt: 99 })).status === 400, "an unearned or out-of-range belt is refused");

    // Complete every required step up to the yellow belt (month 0) in the stored progress, the real way the roadmap defines it.
    const need = buildPath("en").filter((s) => s.required && s.month <= 0);
    const store = structuredClone(EMPTY_STORE);
    for (const s of need) {
      if (s.slug) store.done[s.slug] = "2026-11-14";
      for (const k of s.checks ?? []) store.checks[k] = "2026-11-14";
      for (const k of s.gates ?? []) store.gates[k] = true;
      for (const k of s.missions ?? []) store.missions[k] = "2026-11-14";
    }
    const raw2 = new DatabaseSync(file);
    const omarId = (raw2.prepare("SELECT id FROM users WHERE username = 'omar'").get() as { id: string }).id;
    raw2.prepare("UPDATE progress SET data = ?, version = version + 1 WHERE user_id = ?").run(JSON.stringify(store), omarId);
    raw2.close();

    const earned = await omar("GET", "/api/cert/");
    ok((earned.json.earned as number[]).includes(1) && !(earned.json.earned as number[]).includes(2), "finishing the required steps earns exactly the yellow belt", earned.json.earned);
    const issued = await omar("POST", "/api/cert/", { belt: 1, name: "  Omar  the  Learner  " });
    ok(issued.status === 200 && typeof issued.json.id === "string", "an earned belt issues a certificate", issued.json);
    const certId = String(issued.json.id);
    const view = await fetch(`${BASE}/cert/${certId}/`, { redirect: "manual" });
    const html = await view.text();
    ok(view.status === 200 && html.includes("Omar the Learner") && html.includes(BELTS[1]?.name as string), "the certificate is public and shows the tidied name and the belt", { status: view.status });
    ok(String((await omar("POST", "/api/cert/", { belt: 1, name: "Someone Else" })).json.id) === certId, "re-creating a certificate returns the same one, keeping the first name");
  } finally {
    server.kill();
    fs.rmSync(dir, { recursive: true, force: true });
    if (bad) console.log(log.slice(-1500));
  }
}

void unit().then(http).then(() => {
  console.log(`${checks} account checks, ${bad} failures`);
  process.exit(bad ? 1 : 0);
});
