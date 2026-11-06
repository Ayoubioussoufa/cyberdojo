/** Content rules: equal-length quiz options, known components, valid internal links. */
import fs from "node:fs";
import path from "node:path";
import { DRILLS } from "../src/lib/drills";
import { PLACEMENT } from "../src/data/path";
import { TOOLS } from "../src/data/tools";
import { guides, lessons, glossary, machines, projects, sheets } from "../src/lib/content";
import { PROJECTS } from "../src/lib/data";
import { buildPath } from "../src/lib/path";
import type { HelpLevel } from "../src/lib/types";
import { RANGES } from "../src/lib/missions";

let bad = 0;
const fail = (msg: string) => {
  bad++;
  console.log(`✗ ${msg}`);
};
const docs = [...lessons(), ...guides(), ...machines(), ...projects()];
const words = (s: string) => s.trim().split(/\s+/).length;
const plain = (s: string) => s.replace(/`/g, "");
let questions = 0;

for (const d of docs) {
  const name = d.meta.slug;
  if (!d.meta.summary) fail(`${name}: no summary`);
  if (d.meta.kind === "lesson" && !d.meta.source) fail(`${name}: no primary source`);
  for (const q of d.questions) {
    questions++;
    const opts = q.options.map(plain);
    const counts = new Set(opts.map(words));
    // Options that are all commands can't share a word count: only their length is compared.
    const allCode = q.options.every((o) => /^`[^`]+`$/.test(o));
    if (!allCode && counts.size !== 1) fail(`${name}: option word counts differ: ${q.prompt}\n    ${opts.map((o) => `${words(o)}w ${o}`).join("\n    ")}`);
    const lens = opts.map((o) => o.length);
    const max = Math.max(...lens);
    const min = Math.min(...lens);
    if (max / min > 1.6) fail(`${name}: option lengths ${min}..${max}: ${q.prompt}\n    ${opts.join("\n    ")}`);
    const right = (opts[q.correct] as string).length;
    const others = opts.filter((_, i) => i !== q.correct).map((o) => o.length);
    if (right > Math.max(...others) + 8) fail(`${name}: the right answer is the longest by far: ${q.prompt}\n    ${opts.join("\n    ")}`);
  }
  const positions = new Set(d.questions.map((q) => q.correct));
  if (d.questions.length >= 4 && positions.size < 2) fail(`${name}: the right answer always sits in the same place`);
  for (const s of d.segments) {
    if (s.kind === "drill" && !DRILLS[s.id]) fail(`${name}: unknown drill ${s.id}`);
    if (s.kind === "range" && !RANGES[s.id]) fail(`${name}: unknown range ${s.id}`);
  }
}

// Every section of the deepened lessons needs a question: the student's format.
// Lessons 1–45 predate this rule and are reported, not failed, until they catch up.
const DEEP_FROM = 46; // the word minimum applies to the deepened months
const ASKED_FROM = 1; // every section of every lesson has a question
let thin = 0;
for (const d of lessons()) {
  const parts = fs.readFileSync(path.join("content/lessons", `${d.meta.slug}.md`), "utf8").split(/^## /m).slice(1);
  const empty = parts.filter((p) => !/^(\?[?!] |@range )/m.test(p) && !/^What you can do now/.test(p)).map((p) => p.split("\n")[0]);
  if (d.meta.number >= ASKED_FROM) for (const e of empty) fail(`${d.meta.slug}: section with no question: ${e}`);
  else thin += empty.length;
  if (d.meta.number >= DEEP_FROM && d.text.split(/\s+/).length < 550) fail(`${d.meta.slug}: only ${d.text.split(/\s+/).length} words`);
}
if (thin) console.log(`note: ${thin} sections in lessons 1–${DEEP_FROM - 1} have no question yet`);

const slugs = new Set([...docs, ...sheets()].map((d) => d.meta.slug));

// Projects: every step ends in a checkpoint, and help fades tool by tool.
const RANK: Record<HelpLevel, number> = { guided: 0, recall: 1, solo: 2 };
const seenTools = new Map<string, string[]>();
if (projects().length !== PROJECTS.length) fail(`projects: ${projects().length} guides for ${PROJECTS.length} projects`);
for (const p of PROJECTS) {
  const d = projects().find((x) => x.meta.slug === p.id);
  if (!d) {
    fail(`no guide for ${p.id}`);
    continue;
  }
  const steps = [...new Set(d.toc.flatMap((t) => /^Step (\d+)/.exec(t.text)?.[1] ?? []))].map(Number);
  steps.forEach((n, i) => {
    if (n !== i + 1) fail(`${p.id}: steps are out of order at ${n}`);
    if (!d.checks.some((c) => c.step === n)) fail(`${p.id}: step ${n} has no checkpoint`);
  });
  if (steps.length < 5) fail(`${p.id}: only ${steps.length} steps`);
  for (const part of d.meta.parts ?? []) if (part.to > steps.length) fail(`${p.id}: a part goes past the last step`);
  if (d.meta.parts && d.meta.parts[d.meta.parts.length - 1]?.to !== steps.length) fail(`${p.id}: its parts don't reach the last step`);
  if (!d.meta.tested && !["P01", "P02", "P03", "P04", "P05"].includes(p.id)) fail(`${p.id}: doesn't say how it was checked`);
  const best = new Map<string, HelpLevel>();
  for (const t of d.tools) {
    if (!TOOLS[t.tool]) fail(`${p.id}: unknown tool ${t.tool}`);
    const was = best.get(t.tool);
    if (!was || RANK[t.level] < RANK[was]) best.set(t.tool, t.level);
  }
  for (const [tool, level] of best) {
    const before = seenTools.get(tool) ?? [];
    // First use: a full walkthrough. Second: recall at most. Third onwards: no help.
    const most: HelpLevel = before.length === 0 ? "guided" : before.length === 1 ? "recall" : "solo";
    if (before.length === 0 && level !== "guided") fail(`${p.id}: ${tool} is new here, so it needs a full walkthrough`);
    if (RANK[level] < RANK[most]) fail(`${p.id}: ${tool} gets too much help (${level}), as it was used in ${before.join(", ")}`);
    if (before.length === 0 && TOOLS[tool]?.first !== p.id) fail(`${tool}: tools.ts says ${TOOLS[tool]?.first}, but it's taught in ${p.id}`);
    seenTools.set(tool, [...before, p.id]);
  }
}

// The roadmap: everything sits on it exactly once, and every part is reachable.
const roadmap = buildPath();
const refs = Object.values(PLACEMENT).flatMap((m) => [...(m.before ?? []), ...(m.after ?? [])]).map((p) => p.ref);
for (const d of guides()) if (refs.filter((r) => r === `guide:${d.meta.slug}`).length !== 1) fail(`roadmap: ${d.meta.slug} should appear once`);
for (const d of machines()) if (!refs.includes(`machine:${d.meta.slug}`)) fail(`roadmap: ${d.meta.slug} is missing`);
for (const d of projects()) {
  const parts = d.meta.parts?.length ?? 1;
  for (let n = 1; n <= parts; n++) if (!refs.includes(`project:${d.meta.slug}:${n}`)) fail(`roadmap: ${d.meta.slug} part ${n} is missing`);
  const covered = roadmap.filter((s) => s.id.startsWith(`project:${d.meta.slug}:`)).flatMap((s) => s.checks ?? []);
  if (new Set(covered).size !== d.checks.length) fail(`roadmap: ${d.meta.slug} covers ${covered.length} of ${d.checks.length} checkpoints`);
}
if (new Set(roadmap.map((s) => s.id)).size !== roadmap.length) fail("roadmap: a step appears twice");

// The subnet table is arithmetic, so it must match the arithmetic.
const subnet = fs.readFileSync("content/reference/subnetting.md", "utf8");
let prefixes = 0;
for (const m of subnet.matchAll(/^\| \/(\d+) \| `([\d.]+)` \| `([\d.]+)` \| ([\d,]+) \| ([\d,]+) \|/gm)) {
  const p = Number(m[1]);
  const mask = p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
  const dotted = (n: number) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
  const total = 2 ** (32 - p);
  const usable = p <= 30 ? total - 2 : p === 31 ? 2 : 1;
  prefixes++;
  if (m[2] !== dotted(mask) || m[3] !== dotted(~mask >>> 0) || Number((m[4] as string).replace(/,/g, "")) !== total || Number((m[5] as string).replace(/,/g, "")) !== usable) fail(`subnetting: wrong row for /${p}`);
}
if (prefixes !== 25) fail(`subnetting: expected 25 prefixes, found ${prefixes}`);

// Every Sysmon ID on Microsoft's page, as read in Nov 2026, must be on the sheet.
const sysmon = fs.readFileSync("content/reference/sysmon-ids.md", "utf8");
for (const id of [...Array.from({ length: 29 }, (_, i) => i + 1), 255]) {
  if (!new RegExp(`^\\| \\**${id}\\** \\|`, "m").test(sysmon)) fail(`sysmon sheet: ID ${id} is missing`);
}
for (const d of [...docs, ...sheets()]) {
  const html = d.segments.map((s) => (s.kind === "html" ? s.html : "")).join("");
  for (const m of html.matchAll(/href="\/(courses|guides|machines|sheets)\/([^/"#]+)/g)) {
    if (!slugs.has(m[2] as string)) fail(`${d.meta.slug}: broken internal link /${m[1]}/${m[2]}`);
  }
}

const seen = new Set<string>();
for (const t of glossary()) {
  if (seen.has(t.term.toLowerCase())) fail(`duplicate glossary term: ${t.term} (${t.doc})`);
  seen.add(t.term.toLowerCase());
}

void fs;
void path;
console.log(`${roadmap.length} roadmap steps, ${projects().flatMap((p) => p.checks).length} project checkpoints, ${Object.keys(TOOLS).length} tools`);
console.log(`${docs.length} documents, ${questions} questions, ${glossary().length} terms, ${Object.keys(DRILLS).length} drills, ${Object.values(RANGES).reduce((n, r) => n + r.missions.length, 0)} missions`);
process.exit(bad ? 1 : 0);
