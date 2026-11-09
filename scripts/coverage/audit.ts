/**
 * Measures the course against scripts/coverage/taxonomy.ts.
 *
 *   pnpm audit:coverage            writes COVERAGE.md, the README's generated blocks,
 *                                  and the index in every modules/ folder
 *   pnpm audit:coverage --print    also prints each topic's evidence, for review
 *   pnpm audit:coverage --check    fails if any of those files is out of date
 *
 * The baseline scans the course without modules/. Its rule, in order:
 *   present  a heading or the front matter names it AND one document mentions it
 *            at least 5 times; or one document mentions it at least 12 times
 *   partial  at least 3 mentions in prose, or a practice surface plus one mention
 *   missing  anything less
 * A word count can't judge depth, so review.ts overrides it, with a reason each.
 *
 * "Now" starts from the baseline and adds modules/: a topic counts as present
 * when one module mentions it at least 3 times, or names it in a heading and
 * mentions it twice.
 */
import fs from "node:fs";
import path from "node:path";
import { DOMAINS } from "../../src/data/domains";
import { NOT_TAUGHT_BY, NOW, REVIEW } from "./review";
import { TAXONOMY, type Topic, type Verdict } from "./taxonomy";

interface Doc {
  file: string;
  body: string;
  heads: string;
  practice: boolean;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function load(): Doc[] {
  const docs: Doc[] = [];
  // content/fr holds translations of pages already counted in English.
  for (const file of walk("content").filter((f) => f.endsWith(".md") && !f.startsWith(path.join("content", "fr")))) {
    const raw = fs.readFileSync(file, "utf8");
    const front = /^---\n([\s\S]*?)\n---\n/.exec(raw)?.[1] ?? "";
    const named = front.split("\n").filter((l) => /^(title|summary|words):/.test(l)).join("\n");
    const heads = raw.split("\n").filter((l) => /^#{1,4} /.test(l)).join("\n");
    docs.push({ file, body: raw.slice(front.length), heads: `${named}\n${heads}`, practice: false });
  }
  const practice = [...walk("src/lib/missions"), ...walk("src/lib/drills"), ...walk("src/lib/cases"), "src/data/dojo.ts"];
  for (const file of practice.filter((f) => f.endsWith(".ts"))) {
    docs.push({ file, body: fs.readFileSync(file, "utf8"), heads: "", practice: true });
  }
  return docs;
}

const count = (text: string, re: RegExp) => {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  return [...text.matchAll(new RegExp(re.source, flags))].length;
};

interface Row {
  domain: string;
  group: string;
  topic: Topic;
  auto: Verdict;
  verdict: Verdict;
  prose: number;
  docs: number;
  practice: number;
  top: string;
  topHits: number;
  headed: boolean;
}

function score(topic: Topic, docs: Doc[]): Omit<Row, "domain" | "group" | "topic"> {
  const prose = docs.filter((d) => !d.practice).map((d) => ({ d, n: count(d.body, topic.re), h: count(d.heads, topic.re) }));
  const hit = prose.filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const total = hit.reduce((s, x) => s + x.n, 0);
  const practice = docs.filter((d) => d.practice).reduce((s, d) => s + count(d.body, topic.re), 0);
  const best = hit[0];
  const headed = hit.some((x) => x.h > 0 && x.n >= 5);
  const auto: Verdict =
    headed || (best && best.n >= 12) ? "present" : total >= 3 || (practice > 0 && total >= 1) ? "partial" : "missing";
  return {
    auto,
    verdict: REVIEW[topic.label]?.verdict ?? auto,
    prose: total,
    docs: hit.length,
    practice,
    top: best ? path.basename(best.d.file, ".md") : "",
    topHits: best?.n ?? 0,
    headed,
  };
}

const docs = load();
const rows: Row[] = TAXONOMY.flatMap((d) =>
  d.groups.flatMap((g) => g.topics.map((t) => ({ domain: d.id, group: g.name, topic: t, ...score(t, docs) }))),
);

/** Front matter of a module, without the content engine: this script stays dependency-free. */
interface Module {
  slug: string;
  folder: string;
  file: string;
  title: string;
  summary: string;
  level: string;
  needs: string[];
  pair: string[];
  body: string;
  heads: string;
}

function loadModules(): Module[] {
  if (!fs.existsSync("modules")) return [];
  return fs
    .readdirSync("modules")
    .filter((d) => /^\d\d-/.test(d))
    .sort()
    .flatMap((folder) =>
      fs
        .readdirSync(path.join("modules", folder))
        .filter((f) => /^\d\d-.*\.md$/.test(f))
        .sort()
        .map((file) => {
          const raw = fs.readFileSync(path.join("modules", folder, file), "utf8");
          const front = /^---\n([\s\S]*?)\n---\n/.exec(raw)?.[1] ?? "";
          const get = (k: string) => new RegExp(`^${k}:\\s*(.*)$`, "m").exec(front)?.[1]?.trim() ?? "";
          const list = (k: string) => get(k).split(",").map((x) => x.trim()).filter(Boolean);
          const heads = raw.split("\n").filter((l) => /^#{1,4} /.test(l)).join("\n");
          return {
            slug: `${folder.slice(0, 2)}-${file.replace(/\.md$/, "")}`,
            folder,
            file,
            title: get("title"),
            summary: get("summary"),
            level: get("level"),
            needs: list("needs"),
            pair: list("pair"),
            body: raw.slice(front.length),
            heads: `${get("title")}\n${get("summary")}\n${heads}`,
          };
        }),
    );
}

const mods = loadModules();

/** A module that teaches the topic: the best one, so the matrix can name it. */
function teacher(topic: Topic): Module | null {
  let best: Module | null = null;
  let top = 0;
  for (const m of mods) {
    if (NOT_TAUGHT_BY[topic.label] === m.slug) continue;
    const n = count(m.body, topic.re);
    const named = count(m.heads, topic.re) > 0;
    if ((n >= 3 || (named && n >= 2)) && n > top) {
      best = m;
      top = n;
    }
  }
  return best;
}

interface Final extends Row {
  before: Verdict;
  now: Verdict;
  by: Module | null;
}

const baseline = new Map<string, Verdict>(
  (JSON.parse(fs.readFileSync("scripts/coverage/baseline.json", "utf8")) as { label: string; verdict: Verdict }[]).map((r) => [r.label, r.verdict]),
);
const finals: Final[] = rows.map((r) => {
  const hand = NOW[r.topic.label];
  const by = hand?.by ? (mods.find((m) => m.slug === hand.by) ?? null) : teacher(r.topic);
  const before = baseline.get(r.topic.label) ?? r.verdict;
  return { ...r, before, by, now: hand?.verdict ?? (by ? "present" : r.verdict) };
});

const MARK: Record<Verdict, string> = { present: "●", partial: "◐", missing: "○" };
const tally = (list: Final[], key: "before" | "now") => {
  const n = (v: Verdict) => list.filter((r) => r[key] === v).length;
  return { present: n("present"), partial: n("partial"), missing: n("missing"), total: list.length };
};

if (process.argv.includes("--print")) {
  for (const r of finals) {
    const o = REVIEW[r.topic.label] ? ` [auto ${r.auto}]` : "";
    const b = r.by ? ` by ${r.by.slug}` : "";
    console.log(`${r.domain} ${MARK[r.before]}>${MARK[r.now]} ${r.topic.label} | prose ${r.prose} in ${r.docs} docs, practice ${r.practice}, top ${r.top}:${r.topHits}${r.headed ? " H" : ""}${o}${b}`);
  }
}

const moduleHref = (m: Module) => `modules/${m.folder}/${m.file}`;

// ── COVERAGE.md: every topic, with its evidence
const full: string[] = [];
const allBefore = tally(finals, "before");
const allNow = tally(finals, "now");
full.push("# Coverage matrix", "");
full.push("Generated by `pnpm audit:coverage` from `scripts/coverage/taxonomy.ts`. Don't edit it by hand.", "");
full.push(`**${allNow.total} topics. Before the modules: ${allBefore.present} present, ${allBefore.partial} partial, ${allBefore.missing} missing. Now: ${allNow.present} present, ${allNow.partial} partial, ${allNow.missing} missing.**`, "");
full.push("● present: explains the mechanism and the defence. ◐ partial: a table row, a definition, or one side only. ○ missing: absent, or a passing mention. `*` marks a verdict corrected by hand review, with the reason given.", "");
full.push("For attack techniques, ● means that the course explains the root cause, the traces and the defence. It doesn't mean that it teaches how to carry the attack out: modules hold no exploits, payloads or evasion steps. Active Directory attacks and exploit development stay open on purpose.", "");
full.push("Sources for the list: the 21 CyBOK v1.1 knowledge areas, OWASP Top 10:2025, the 2025 CWE Top 25, the 15 Enterprise ATT&CK v20 tactics, and the twelve domains of the brief.", "");
for (const d of TAXONOMY) {
  full.push(`## ${d.id} ${d.title}`, "", `Basis: ${d.basis}.`, "");
  for (const g of d.groups) {
    full.push(`### ${g.name}`, "", "| Before | Now | Topic | Evidence in the course | Taught in module |", "|---|---|---|---|---|");
    for (const r of finals.filter((x) => x.domain === d.id && x.group === g.name)) {
      const kind = r.topic.tool ? " (tool)" : "";
      const note = NOW[r.topic.label]?.why ?? REVIEW[r.topic.label]?.why;
      const why = note ? ` *${note}*` : "";
      const ev = r.prose ? `${r.prose} mentions in ${r.docs} docs, most in ${r.top}${r.practice ? `, practice ${r.practice}` : ""}.` : r.practice ? `Practice only (${r.practice}).` : "None.";
      const by = r.by ? `[${r.by.title}](${moduleHref(r.by)})` : "";
      full.push(`| ${MARK[r.before]}${REVIEW[r.topic.label] ? "*" : ""} | ${MARK[r.now]} | ${r.topic.label}${kind} | ${ev}${why} | ${by} |`);
    }
    full.push("");
  }
}

// ── README blocks and folder indexes
const matrix: string[] = [
  `**${allNow.total} topics.** Before the modules: ${allBefore.present} present, ${allBefore.partial} partial, ${allBefore.missing} missing. Now: **${allNow.present} present, ${allNow.partial} partial, ${allNow.missing} missing.** Every row and its evidence is in [COVERAGE.md](COVERAGE.md).`,
  "",
  "| Domain | Before ● ◐ ○ | Now ● ◐ ○ | Modules |",
  "|---|---|---|---|",
];
for (const d of DOMAINS) {
  const list = finals.filter((r) => r.domain === d.id);
  const b = tally(list, "before");
  const n = tally(list, "now");
  const count2 = mods.filter((m) => m.folder === d.folder).length;
  matrix.push(`| [${d.id} ${d.title}](modules/${d.folder}/README.md) | ${b.present} · ${b.partial} · ${b.missing} | ${n.present} · ${n.partial} · ${n.missing} | ${count2} |`);
}
const prereq: string[] = ["```mermaid", "graph LR"];
for (const d of DOMAINS) prereq.push(`  D${d.id}["${d.id} ${d.title.replace(/"/g, "")}"]`);
for (const d of DOMAINS) for (const n of d.needs) prereq.push(`  D${n} --> D${d.id}`);
prereq.push("```");

const LEVELS = ["foundation", "intermediate", "advanced"];
const titleOf = (slug: string) => mods.find((m) => m.slug === slug)?.title ?? slug;
const hrefFrom = (slug: string, up: string) => {
  const m = mods.find((x) => x.slug === slug);
  return m ? `${up}${m.folder}/${m.file}` : `${up}../content/lessons/${slug}.md`;
};

const index: string[] = ["# Modules", "", "Generated by `pnpm audit:coverage`. One folder per domain, and in each one the modules run from foundation to advanced. Every module has the same seven parts: Concept, Threat model, Tools, Defence, Pitfalls, Exercise, Further reading.", ""];
for (const d of DOMAINS) {
  const mine = mods.filter((m) => m.folder === d.folder);
  index.push(`- [${d.id} ${d.title}](${d.folder}/README.md): ${mine.length} modules. ${d.blurb}`);
}
index.push("", "## Prerequisites, module by module", "", "| Module | Level | Read first | The other side |", "|---|---|---|---|");
for (const m of mods) {
  const links = (list: string[]) => list.map((s) => `[${titleOf(s)}](${hrefFrom(s, "")})`).join(", ") || "none";
  index.push(`| [${m.title}](${m.folder}/${m.file}) | ${m.level} | ${links(m.needs)} | ${links(m.pair)} |`);
}

function folderIndex(d: (typeof DOMAINS)[number]): string {
  const out = [`# ${d.id} ${d.title}`, "", d.blurb, "", "Generated by `pnpm audit:coverage`.", ""];
  const needs = d.needs.flatMap((n) => DOMAINS.find((x) => x.id === n) ?? []);
  if (needs.length) out.push(`Study first: ${needs.map((n) => `[${n.title}](../${n.folder}/README.md)`).join(", ")}.`, "");
  if (d.lessons.length) {
    const files = fs.readdirSync("content/lessons");
    out.push("## Basics, on the 24-month roadmap", "");
    for (const n of d.lessons) {
      const f = files.find((x) => x.startsWith(String(n).padStart(4, "0")));
      if (f) out.push(`- [${f.replace(/\.md$/, "")}](../../content/lessons/${f})`);
    }
    out.push("");
  }
  out.push("## Modules", "");
  for (const level of LEVELS) {
    const mine = mods.filter((m) => m.folder === d.folder && m.level === level);
    if (!mine.length) continue;
    out.push(`### ${level[0]?.toUpperCase()}${level.slice(1)}`, "");
    for (const m of mine) out.push(`- [${m.title}](${m.file}): ${m.summary}`);
    out.push("");
  }
  const left = finals.filter((r) => r.domain === d.id && r.now !== "present");
  if (left.length) {
    out.push("## Still not covered", "");
    for (const r of left) out.push(`- ${MARK[r.now]} ${r.topic.label}`);
    out.push("");
  }
  return `${out.join("\n").trimEnd()}\n`;
}

const block = (text: string, name: string, body: string[]) => {
  const open = `<!-- ${name}:start -->`;
  const close = `<!-- ${name}:end -->`;
  const a = text.indexOf(open);
  const b = text.indexOf(close);
  if (a < 0 || b < 0) throw new Error(`README.md has no ${name} block`);
  return `${text.slice(0, a + open.length)}\n${body.join("\n")}\n${text.slice(b)}`;
};

const outputs = new Map<string, string>();
outputs.set("COVERAGE.md", `${full.join("\n").trimEnd()}\n`);
outputs.set("modules/README.md", `${index.join("\n").trimEnd()}\n`);
for (const d of DOMAINS) if (fs.existsSync(`modules/${d.folder}`)) outputs.set(`modules/${d.folder}/README.md`, folderIndex(d));
const readme = fs.readFileSync("README.md", "utf8");
if (readme.includes("<!-- coverage:start -->")) outputs.set("README.md", block(block(readme, "coverage", matrix), "prereqs", prereq));

if (process.argv.includes("--check")) {
  const stale = [...outputs].filter(([f, text]) => !fs.existsSync(f) || fs.readFileSync(f, "utf8") !== text).map(([f]) => f);
  if (stale.length) {
    console.log(`✗ out of date, run pnpm audit:coverage: ${stale.join(", ")}`);
    process.exit(1);
  }
} else {
  for (const [f, text] of outputs) fs.writeFileSync(f, text);
}
console.log(`${allNow.total} topics. Before: ${allBefore.present} present, ${allBefore.partial} partial, ${allBefore.missing} missing. Now: ${allNow.present} present, ${allNow.partial} partial, ${allNow.missing} missing. ${mods.length} modules.`);
for (const d of DOMAINS) {
  const n = tally(finals.filter((r) => r.domain === d.id), "now");
  console.log(`  ${d.id} ${d.title.padEnd(50)} ● ${String(n.present).padStart(3)}  ◐ ${String(n.partial).padStart(3)}  ○ ${String(n.missing).padStart(3)}`);
}
