/**
 * Appearance settings: the rules in src/lib/appearance.ts, then /api/prefs on the
 * built server with a throwaway database. Needs `pnpm build` first.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { APPEARANCE_SCRIPT, cleanPrefs, contrast, cssVars, DEFAULT_PREFS, inkOn, PALETTES, randomPalette, THEME_DEFAULTS, THEME_TEXT, unreadable, type Prefs } from "../src/lib/appearance";

const PORT = 3104;
const BASE = `http://localhost:${PORT}`;
let bad = 0;
let checks = 0;
const ok = (cond: boolean, what: string, detail?: unknown) => {
  checks++;
  if (cond) return;
  bad++;
  console.log(`✗ ${what}${detail === undefined ? "" : `: ${JSON.stringify(detail)}`}`);
};

function unit() {
  // The colours in the code are the ones the stylesheet really uses.
  const css = fs.readFileSync("src/app/globals.css", "utf8");
  const block = (sel: string) => css.slice(css.indexOf(sel), css.indexOf("}", css.indexOf(sel)));
  const blocks = { dark: block(':root, :root[data-theme="dark"] {'), light: block(':root[data-theme="light"] {') };
  for (const theme of ["dark", "light"] as const) {
    for (const t of THEME_TEXT[theme]) ok(blocks[theme].includes(`--${t.name}: ${t.colour};`), `${theme} --${t.name} in globals.css is ${t.colour}`);
    const d = THEME_DEFAULTS[theme];
    const fallbacks = [`--bg: var(--u-bg-${theme}, ${d.bg})`, `--surface: var(--u-surface-${theme}, ${d.surface})`, `--accent: var(--u-accent-${theme}, ${d.accent})`, `--accent-ink: var(--u-accent-ink-${theme}, ${d.accentInk})`, `--accent-soft: var(--u-accent-soft-${theme}, ${d.accentSoft})`];
    ok(fallbacks.every((f) => blocks[theme].includes(f)), `${theme} colours in globals.css fall back to the theme's own`, fallbacks.filter((f) => !blocks[theme].includes(f)));
    ok(unreadable(theme, { bg: null, surface: null, accent: null }) === null, `the ${theme} theme's own colours pass the readability check`, unreadable(theme, { bg: null, surface: null, accent: null }));
  }
  ok(Math.abs(contrast("#000000", "#ffffff") - 21) < 1e-9 && Math.abs(contrast("#777777", "#777777") - 1) < 1e-9, "contrast is 21 for black on white and 1 for a colour on itself");

  const good = (v: unknown) => "prefs" in cleanPrefs(v);
  const why = (v: unknown) => {
    const r = cleanPrefs(v);
    return "problem" in r ? r.problem : "accepted";
  };
  ok(good({}) && JSON.stringify((cleanPrefs({}) as { prefs: unknown }).prefs) === JSON.stringify(DEFAULT_PREFS), "an empty object gives the defaults");
  ok(why({ font: "Comic Sans" }) === "font" && why({ code: "x" }) === "font", "a font outside the list is refused");
  ok(why({ dark: { bg: "red; background: url(https://evil.example/x)" } }) === "colour", "CSS text in a colour is refused");
  ok(why({ dark: { bg: "#fff" } }) === "colour" && why({ dark: { bg: "rgb(0,0,0)" } }) === "colour" && why({ dark: { bg: 123 } }) === "colour", "only #rrggbb is accepted");
  ok(why({ dark: { bg: "#ffffff" } }) === "contrast" && why({ light: { surface: "#000000" } }) === "contrast", "a background that makes text unreadable is refused");
  // The accent: any colour that stands out and keeps its button text readable.
  const green = cleanPrefs({ dark: { accent: "#3FB950" }, light: { accent: "#1a7f37" } });
  ok("prefs" in green && green.prefs.dark.accent === "#3fb950" && green.prefs.light.accent === "#1a7f37", "a green accent is accepted in both themes", green);
  ok(why({ dark: { accent: "#1a2a1f" } }) === "contrast", "a dark-theme accent too close to the page is refused");
  ok(why({ light: { accent: "#f4f0e0" } }) === "contrast", "a light-theme accent too close to the page is refused");
  ok(inkOn("#3fb950") === "#111111" && inkOn("#0b3d91") === "#ffffff", "button text turns black on light accents and white on dark ones");
  const vars = cssVars((green as { prefs: Prefs }).prefs);
  ok(vars["--u-accent-dark"] === "#3fb950" && vars["--u-accent-ink-dark"] === "#111111" && /^#[0-9a-f]{6}$/.test(vars["--u-accent-soft-dark"] ?? "") && contrast(vars["--u-accent-dark"] as string, vars["--u-accent-soft-dark"] as string) >= 3, "an accent sets its own ink and soft tint, all checked hex", vars);
  ok(Object.keys(cssVars(DEFAULT_PREFS)).length === 0, "the defaults set no variables");
  ok(why({ dark: { bg: "#3a4a2a", accent: "#3fb950" } }) === "contrast", "colours are judged together: a background that makes the accent vanish is refused");
  // Palettes: the fixed ones and the random blends must all pass the same checks.
  ok(PALETTES.every((p) => !unreadable("dark", p.dark) && !unreadable("light", p.light) && "prefs" in cleanPrefs({ dark: p.dark, light: p.light })), "every fixed palette passes the checks in both themes", PALETTES.filter((p) => unreadable("dark", p.dark) || unreadable("light", p.light)).map((p) => p.id));
  const blends = (["dark", "light"] as const).flatMap((t) => Array.from({ length: 300 }, () => ({ t, c: randomPalette(t) })));
  ok(blends.every(({ t, c }) => c.harmony !== "none" && !unreadable(t, c) && "prefs" in cleanPrefs({ [t]: { bg: c.bg, surface: c.surface, accent: c.accent } })), "600 random blends all pass the checks, with no fallback");
  ok(new Set(blends.map(({ c }) => `${c.bg}${c.accent}`)).size > 590 && new Set(blends.map(({ c }) => c.harmony)).size === 4, "random blends differ every time and use all four harmony rules");
  const up = cleanPrefs({ dark: { bg: "#0A0F14" } });
  ok("prefs" in up && up.prefs.dark.bg === "#0a0f14", "colours are stored in lower case", up);
  ok(why("x") === "bad" && why(null) === "bad" && why([1]) === "bad" && why({ dark: "x" }) === "bad", "anything but an object is refused");
  const extra = cleanPrefs({ font: "inter", evil: "<script>", dark: { bg: null, surface: "#0b1016", x: 1 } });
  ok("prefs" in extra && !JSON.stringify(extra.prefs).includes("evil") && !JSON.stringify(extra.prefs).includes("\"x\""), "unknown keys are dropped, not stored", extra);
  ok(APPEARANCE_SCRIPT.includes("^#[0-9a-f]{6}$") && APPEARANCE_SCRIPT.includes("--u-(bg|surface|accent|accent-ink|accent-soft)-(dark|light)") && !APPEARANCE_SCRIPT.includes("innerHTML") && !APPEARANCE_SCRIPT.includes("eval"), "the pre-paint script only sets allowed variables to checked colours, and builds no HTML");
}

async function http() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cyberdojo-prefs-"));
  const file = path.join(dir, "test.db");
  const server = spawn("node_modules/.bin/next", ["start", "-p", String(PORT)], { env: { ...process.env, TURSO_DATABASE_URL: "", CYBERDOJO_DB: file, NODE_ENV: "production" }, stdio: "pipe" });
  let log = "";
  server.stderr.on("data", (d: Buffer) => (log += d.toString()));
  let cookie = "";
  const call = async (method: string, url: string, body?: unknown, headers: Record<string, string> = {}) => {
    const res = await fetch(BASE + url, {
      method,
      headers: { origin: BASE, ...(body === undefined ? {} : { "content-type": "application/json" }), ...(cookie ? { cookie } : {}), ...headers },
      body: body === undefined ? null : JSON.stringify(body),
    });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0] as string;
    return { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  };
  try {
    let up = false;
    for (let i = 0; i < 60 && !up; i++) {
      up = await fetch(`${BASE}/api/auth/me/`).then((r) => r.ok, () => false);
      if (!up) await new Promise((r) => setTimeout(r, 250));
    }
    ok(up, "server starts");
    if (!up) return;
    const prefs = { font: "lexend", code: "jetbrains", dark: { bg: "#0b1016", surface: null, accent: "#3fb950" }, light: { bg: null, surface: "#ffffff", accent: null } };
    ok((await call("GET", "/api/prefs/")).status === 401, "a stranger can't read settings");
    ok((await call("PUT", "/api/prefs/", { prefs })).status === 401, "a stranger can't save settings");
    const pw = "river tiger lamp 42";
    ok((await call("POST", "/api/auth/signup/", { username: "ada", password: pw })).status === 201, "a learner signs up");
    const first = await call("GET", "/api/prefs/");
    ok(first.status === 200 && first.json.saved === false && JSON.stringify(first.json.prefs) === JSON.stringify(DEFAULT_PREFS), "a new account has the defaults, not yet saved", first.json);
    ok((await call("PUT", "/api/prefs/", { prefs }, { origin: "https://evil.example" })).status === 403, "another site can't change the settings");
    ok((await call("PUT", "/api/prefs/", { prefs: { ...prefs, font: "Comic Sans" } })).status === 400, "an unknown font is refused by the server");
    ok((await call("PUT", "/api/prefs/", { prefs: { ...prefs, dark: { bg: "red;}body{display:none", surface: null } } })).status === 400, "CSS text in a colour is refused by the server");
    ok((await call("PUT", "/api/prefs/", { prefs: { ...prefs, dark: { bg: null, surface: null, accent: "#141c25" } } })).status === 400, "an accent that vanishes into the page is refused by the server");
    ok((await call("PUT", "/api/prefs/", { prefs: { ...prefs, dark: { bg: "#f0f0f0", surface: null } } })).status === 400, "an unreadable background is refused by the server");
    const saved = await call("PUT", "/api/prefs/", { prefs });
    ok(saved.status === 200, "valid settings are saved", saved.json);
    const back = await call("GET", "/api/prefs/");
    ok(back.json.saved === true && JSON.stringify(back.json.prefs) === JSON.stringify(prefs), "the settings come back as saved", back.json);
    const raw = new DatabaseSync(file);
    const count = () => Number((raw.prepare("SELECT COUNT(*) AS n FROM user_prefs").get() as { n: number }).n);
    ok(count() === 1, "one row per account");
    ok((await call("DELETE", "/api/account/", { password: pw })).status === 200 && count() === 0, "deleting the account deletes its settings");
    raw.close();
  } finally {
    server.kill();
    fs.rmSync(dir, { recursive: true, force: true });
    if (bad) console.log(log.slice(-1500));
  }
}

unit();
void http().then(() => {
  console.log(`${checks} appearance checks, ${bad} failures`);
  process.exit(bad ? 1 : 0);
});
