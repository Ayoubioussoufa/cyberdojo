/**
 * The simulated sqlite3 and curl against the real things. Every query runs in
 * real SQLite, and every request goes to a real HTTP server with the real curl.
 * Output must match, so a learner is never taught behaviour that isn't true.
 */
import { spawnSync } from "node:child_process";
import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import { curl, makeReq, type Site } from "../src/lib/shell/http";
import { runQuery, type Cell, type Table } from "../src/lib/shell/sql";
import { machine } from "../src/lib/shell/world";

let bad = 0;
let total = 0;

// ---------- SQL ----------
const TABLES: Table[] = [
  {
    name: "secrets",
    columns: [["id", "INTEGER"], ["tag", "TEXT"], ["value", "TEXT"], ["seen", "INTEGER"]],
    rows: [
      [1, "decoy", "CD{aaaa}", 10],
      [2, "flag", "CD{bbbb}", 30],
      [3, "note", "buy Milk", 20],
      [4, "flag", "cd{lower}", null],
      [5, null, "no tag", 5],
      [6, "decoy", "it's quoted", 30],
      [7, "NOTE", "%percent_", 0],
    ],
  },
  { name: "staff", columns: [["name", "TEXT"], ["level", "INTEGER"]], rows: [["ana", 2], ["omar", 3], ["sara", 1]] },
];

const QUERIES = `
SELECT * FROM secrets
select * from secrets
SELECT value FROM secrets
SELECT id, value FROM secrets
SELECT VALUE FROM SECRETS
SELECT value AS v FROM secrets
SELECT value v FROM secrets
SELECT * FROM secrets WHERE id = 3
SELECT * FROM secrets WHERE id = '3'
SELECT * FROM secrets WHERE id != 3
SELECT * FROM secrets WHERE id <> 3
SELECT * FROM secrets WHERE id > 2 AND id < 6
SELECT * FROM secrets WHERE id >= 6 OR id <= 1
SELECT * FROM secrets WHERE tag = 'flag'
SELECT * FROM secrets WHERE tag = 'FLAG'
SELECT * FROM secrets WHERE tag != 'decoy'
SELECT * FROM secrets WHERE NOT tag = 'decoy'
SELECT * FROM secrets WHERE tag IS NULL
SELECT * FROM secrets WHERE tag IS NOT NULL
SELECT * FROM secrets WHERE tag = NULL
SELECT * FROM secrets WHERE tag IN ('flag', 'note')
SELECT * FROM secrets WHERE tag NOT IN ('flag', 'note')
SELECT * FROM secrets WHERE id IN (1, 2, 9)
SELECT * FROM secrets WHERE value LIKE 'CD{%'
SELECT * FROM secrets WHERE value LIKE 'cd{%'
SELECT * FROM secrets WHERE value LIKE '%m%'
SELECT * FROM secrets WHERE value LIKE '__{____}'
SELECT * FROM secrets WHERE value NOT LIKE 'CD{%'
SELECT * FROM secrets WHERE tag = 'flag' AND value LIKE 'CD%'
SELECT * FROM secrets WHERE tag = 'flag' OR tag = 'note' AND id > 3
SELECT * FROM secrets WHERE (tag = 'flag' OR tag = 'note') AND id > 3
SELECT * FROM secrets WHERE seen > 15 AND NOT tag = 'decoy'
SELECT substr(value, 1, 2) FROM secrets
SELECT substr(value, 3) FROM secrets
SELECT substr(value, -3) FROM secrets
SELECT substr(value, -3, 2) FROM secrets
SELECT substr(value, 0, 3) FROM secrets
SELECT substr(value, 2, 0) FROM secrets
SELECT substr(value, 100) FROM secrets
SELECT substr(tag, 1, 1) FROM secrets
SELECT * FROM secrets WHERE substr(value, 1, 3) = 'CD{'
SELECT length(value) FROM secrets
SELECT length(tag) FROM secrets
SELECT upper(value), lower(value) FROM secrets
SELECT typeof(id), typeof(tag) FROM secrets
SELECT id + 1, id * 2, id - 1, id / 2, id % 2 FROM secrets
SELECT id / 0 FROM secrets
SELECT tag || '-' || value FROM secrets
SELECT count(*) FROM secrets
SELECT count(tag) FROM secrets
SELECT count(*) FROM secrets WHERE tag = 'flag'
SELECT min(seen), max(seen), sum(seen) FROM secrets
SELECT min(value), max(value) FROM secrets
SELECT max(seen) + 1 FROM secrets
SELECT count(*) FROM secrets WHERE id > 100
SELECT sum(seen) FROM secrets WHERE id > 100
SELECT DISTINCT tag FROM secrets
SELECT DISTINCT seen FROM secrets
SELECT * FROM secrets ORDER BY seen
SELECT * FROM secrets ORDER BY seen DESC
SELECT * FROM secrets ORDER BY seen ASC, id DESC
SELECT value FROM secrets ORDER BY value
SELECT tag FROM secrets ORDER BY tag DESC
SELECT * FROM secrets LIMIT 2
SELECT * FROM secrets LIMIT 2 OFFSET 3
SELECT * FROM secrets LIMIT 0
SELECT * FROM secrets ORDER BY seen DESC LIMIT 1
SELECT * FROM secrets WHERE tag = 'flag' LIMIT 1
SELECT rowid, value FROM secrets
SELECT 1 + 1
SELECT 'a' || 'b'
SELECT 'it''s'
SELECT substr('abcdef', 2, 3)
SELECT 1 = 1, 1 = 2, 'a' = 'a', 'a' < 'b', 1 < 'a'
SELECT NULL = NULL, NULL IS NULL, NULL AND 0, NULL OR 1
SELECT type, name, tbl_name FROM sqlite_master
SELECT name FROM sqlite_master WHERE type = 'table'
SELECT sql FROM sqlite_master WHERE name = 'staff'
SELECT name FROM sqlite_schema
SELECT name, level FROM staff WHERE level >= 2
SELECT * FROM staff;
SELECT -level FROM staff
`.trim().split("\n");

/** Errors only need to agree that it's an error, and on the reason where it's useful. */
const ERRORS: [string, RegExp][] = [
  ["SELECT * FROM nothere", /no such table: nothere/],
  ["SELECT nope FROM secrets", /no such column: nope/],
  ["SELECT FROM secrets", /syntax error/],
  ["SELEC * FROM secrets", /syntax error/],
  ["SELECT * FROM secrets WHERE", /incomplete input/],
  ["SELECT nofn(1)", /no such function: nofn/],
];

const real = new DatabaseSync(":memory:");
for (const t of TABLES) {
  real.exec(`CREATE TABLE ${t.name} (${t.columns.map(([c, ty]) => `${c} ${ty}`).join(", ")})`);
  const ins = real.prepare(`INSERT INTO ${t.name} VALUES (${t.columns.map(() => "?").join(",")})`);
  for (const r of t.rows) ins.run(...r);
}
for (const q of QUERIES) {
  total++;
  const rows = real.prepare(q).all() as Record<string, Cell>[];
  // Real rows come back as objects, which merge columns of the same name, so compare values.
  const want = JSON.stringify(rows.map((r) => Object.values(r)));
  let got: string;
  try {
    const r = runQuery(TABLES, q);
    const names = r.names;
    got = JSON.stringify(r.rows.map((row) => Object.values(Object.fromEntries(row.map((c, i) => [names[i], c])))));
  } catch (e) {
    got = `threw ${(e as Error).message}`;
  }
  if (want !== got) {
    bad++;
    console.log(`✗ ${q}\n  real ${want}\n  sim  ${got}`);
  }
}
for (const [q, re] of ERRORS) {
  total++;
  let realErr = "";
  try {
    real.prepare(q).all();
  } catch (e) {
    realErr = (e as Error).message;
  }
  let simErr = "";
  try {
    runQuery(TABLES, q);
  } catch (e) {
    simErr = (e as Error).message;
  }
  if (!re.test(realErr) || !re.test(simErr)) {
    bad++;
    console.log(`✗ ${q}\n  real: ${realErr}\n  sim:  ${simErr}`);
  }
}

// ---------- HTTP ----------
const SITE: Site = (r) => {
  const say = (body: string, headers: [string, string][] = []) => ({ status: 200, headers, body });
  if (r.path === "/") return say("<h1>home</h1>\n<!-- hidden -->\n");
  if (r.path === "/plain") return say("hello\n", [["Content-Type", "text/plain"], ["X-Secret", "abc"]]);
  if (r.path === "/annual report") return say("spaces work\n");
  if (r.path === "/echo") return say(`${r.method} ${JSON.stringify(r.query)} ${JSON.stringify(r.form)} ${r.headers["user-agent"]} ${r.headers["x-token"] ?? "-"} ${r.headers.accept}\n`);
  if (r.path === "/host") return say(`host=${r.headers.host}\n`);
  if (r.path === "/a") return { status: 302, headers: [["Location", "/b"]], body: "go to b\n" };
  if (r.path === "/b") return { status: 301, headers: [["Location", "/c"]], body: "go to c\n" };
  if (r.path === "/c") return say(`end of chain ${r.method}\n`);
  if (r.path === "/login") return { status: 200, headers: [["Set-Cookie", "session=s3cret; Path=/"], ["Set-Cookie", "theme=dark"]], body: "welcome\n" };
  if (r.path === "/loginback") return { status: 302, headers: [["Set-Cookie", "session=s3cret; Path=/"], ["Location", "/me"]], body: "" };
  if (r.path === "/me") return r.cookies.session === "s3cret" ? say(`you, with ${Object.keys(r.cookies).join(",")}\n`) : { status: 401, body: "who are you\n" };
  if (r.path === "/forbidden") return { status: 403, body: "no\n" };
  return { status: 404, body: "not here\n" };
};

const server = http.createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on("data", (c: Buffer) => chunks.push(c));
  req.on("end", () => {
    const headers = Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : (v ?? "")]));
    const out = SITE(makeReq(req.method ?? "GET", req.url ?? "/", headers, Buffer.concat(chunks).toString()));
    const list = [...(out.headers ?? [])];
    if (!list.some(([k]) => k.toLowerCase() === "content-type")) list.push(["Content-Type", "text/html; charset=utf-8"]);
    if (!list.some(([k]) => k.toLowerCase() === "content-length")) list.push(["Content-Length", String(Buffer.byteLength(out.body ?? ""))]);
    res.writeHead(out.status, list.flat());
    res.end(req.method === "HEAD" ? undefined : (out.body ?? ""));
  });
});

const CURLS = (b: string) => `
curl -s ${b}/
curl ${b}/plain
curl -i ${b}/plain
curl -si ${b}/plain
curl -I ${b}/plain
curl -s -o /dev/null ${b}/plain
curl -s ${b}/nothere
curl -si ${b}/forbidden
curl -s "${b}/annual%20report"
curl -s "${b}/annual report"
curl -s "${b}/echo?a=1&b=two"
curl -s "${b}/echo?a=one%20two&b=x+y"
curl -s -d "user=ana&pin=1234" ${b}/echo
curl -s --data "a=1" --data "b=2" ${b}/echo
curl -s --data-urlencode "msg=hello world&more" ${b}/echo
curl -s -G -d "q=find" ${b}/echo
curl -s -X PUT ${b}/echo
curl -s -X DELETE -d "x=1" ${b}/echo
curl -s -H "X-Token: t0k" ${b}/echo
curl -s -A "cyberdojo/1" ${b}/echo
curl -s -H "Accept: text/plain" ${b}/echo
curl -s ${b}/host
curl -s -H "Host: admin.lab" ${b}/host
curl -s ${b}/a
curl -si ${b}/a
curl -sL ${b}/a
curl -siL ${b}/a
curl -sL -d "x=1" ${b}/a
curl -sI ${b}/a
curl -s -b "session=s3cret" ${b}/me
curl -s ${b}/me
curl -s -c jar.txt ${b}/login; curl -s -b jar.txt ${b}/me
curl -si -c jar.txt ${b}/login
curl -sL -c jar.txt ${b}/loginback
curl -sL ${b}/loginback
curl -s -b nofile.txt ${b}/me
curl -s -o page.html ${b}/plain; cat page.html
curl -si -o page.html ${b}/plain; cat page.html
curl -s http://nothere.invalid/
curl http://nothere.invalid/
curl "http://local host/"
curl
curl --nonsense ${b}/
`.trim().split("\n");

/** Headers that depend on the moment or the server software, and curl's version. */
const clean = (s: string) =>
  s.replace(/\r/g, "").replace(/^(Date|Connection|Keep-Alive): .*\n/gim, "").replace(/curl\/[0-9.]+/g, "curl/x");
/** Real curl wraps some errors in advice that isn't the point of the comparison. */
const firstErr = (s: string) => /curl: .*/.exec(s)?.[0].replace(/^curl: \((\d+)\).*/, "curl: ($1)").replace(/'/g, "").replace(/ is unknown$/, " is unknown") ?? "";

server.listen(0, "127.0.0.1", () => {
  const { port } = server.address() as { port: number };
  const host = `localhost:${port}`;
  const base = `http://${host}`;
  const list = CURLS(base);
  const run = async () => {
    const { mkdtempSync, rmSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const { spawn } = await import("node:child_process");
    const dir = mkdtempSync(join(tmpdir(), "cd-curl-"));
    for (const c of list) {
      total++;
      spawnSync("rm", ["-f", "jar.txt", "page.html"], { cwd: dir });
      // spawn, not spawnSync: this same process is the server, so it mustn't block.
      const r = await new Promise<{ out: string; err: string; code: number | null }>((done) => {
        const p = spawn("bash", ["-c", c], { cwd: dir });
        let out = "";
        let err = "";
        p.stdout.on("data", (d: Buffer) => (out += d.toString()));
        p.stderr.on("data", (d: Buffer) => (err += d.toString()));
        p.on("close", (code) => done({ out, err, code }));
      });
      const sh = machine("ana", [{ name: "ana", uid: 1000 }]);
      sh.tty = false;
      sh.programs.curl = curl({ [host]: SITE });
      sh.fs.put("/usr/bin/curl", "\x7fELF\0", { mode: 0o755, program: "curl" });
      const { stdout, terminal, code } = sh.exec(c, "", sh.creds);
      const simErr = terminal.slice(0, terminal.length - stdout.length);
      const same = clean(r.out) === clean(stdout) && r.code === code && firstErr(r.err) === firstErr(simErr);
      if (!same) {
        bad++;
        console.log(`✗ ${c}\n  real [${r.code}] ${JSON.stringify(clean(r.out))}  ${firstErr(r.err)}\n  sim  [${code}] ${JSON.stringify(clean(stdout))}  ${firstErr(simErr)}`);
      }
    }
    rmSync(dir, { recursive: true, force: true });
    server.close();
    console.log(`${total - bad}/${total} sqlite3 and curl cases match the real tools`);
    process.exit(bad ? 1 : 0);
  };
  void run();
});
