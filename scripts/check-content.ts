/** Content rules: equal-length quiz options, known components, valid internal links. */
import fs from "node:fs";
import path from "node:path";
import { DRILLS } from "../src/lib/drills";
import { PLACEMENT } from "../src/data/path";
import { TOOLS } from "../src/data/tools";
import { DOMAINS } from "../src/data/domains";
import { findDoc, flatSegments, guides, lessons, glossary, machines, modules, projects, sheets, toolDocs } from "../src/lib/content";
import { TOOL_CATS } from "../src/data/toolcats";
import { PROJECTS } from "../src/lib/data";
import { buildPath } from "../src/lib/path";
import type { HelpLevel, StepSegment } from "../src/lib/types";
import { RANGES } from "../src/lib/missions";
import { AD_DEFENCE, ELSEWHERE, TRAIN, type TrainLink } from "../src/data/train";
import { TIPS } from "../src/data/tips";

let bad = 0;
const fail = (msg: string) => {
  bad++;
  console.log(`✗ ${msg}`);
};
const docs = [...lessons(), ...guides(), ...machines(), ...projects(), ...modules(), ...toolDocs()];
const words = (s: string) => s.trim().split(/\s+/).length;
const plain = (s: string) => s.replace(/`/g, "");
let questions = 0;

for (const d of docs) {
  const name = d.meta.slug;
  if (!d.meta.summary) fail(`${name}: no summary`);
  if ((d.meta.kind === "lesson" || d.meta.kind === "module") && !d.meta.source) fail(`${name}: no primary source`);
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
  for (const s of flatSegments(d.segments)) {
    if (s.kind === "drill" && !DRILLS[s.id]) fail(`${name}: unknown drill ${s.id}`);
    if (s.kind === "range" && !RANGES[s.id]) fail(`${name}: unknown range ${s.id}`);
  }
}

// Every section of the deepened lessons needs a question: the student's format.
// Lessons 1–45 predate this rule and are reported, not failed, until they catch up.
const DEEP_FROM = 46; // the word minimum applies to the deepened months
const ASKED_FROM = 1; // every section of every lesson has a question
// A diagram typed inside a code block would print as text, so it fails here.
for (const f of fs.readdirSync("content/lessons")) {
  let fenced = false;
  for (const line of fs.readFileSync(path.join("content/lessons", f), "utf8").split("\n")) {
    if (line.startsWith("```")) fenced = !fenced;
    else if (fenced && /^@(seq|stack|pyramid|flow|bits|perm)\b/.test(line)) fail(`${f}: a diagram sits inside a code block`);
  }
}
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

// Modules: the same seven parts in every one, links that work both ways, a
// legal notice on every exercise, and no attack recipes. Understanding and
// detection are the point, so a working payload here is a bug.
const TEMPLATE = ["Concept", "Threat model", "Tools", "Defence", "Pitfalls", "Exercise", "Further reading"];
const LEVELS = ["foundation", "intermediate", "advanced"];
const SIDES = ["attack", "defence", "both"];
const RECIPES: [RegExp, string][] = [
  [/\/dev\/tcp\//, "a bash network redirect"],
  [/\bbash -i\b/, "an interactive shell one-liner"],
  [/\bnc\b[^\n]*\s-[a-z]*[eE]\s/, "netcat program execution"],
  [/\bncat\b[^\n]*--(exec|sh-exec)/, "ncat program execution"],
  [/\bsocat\b[^\n]*(EXEC|SYSTEM):/i, "socat program execution"],
  [/\bmkfifo\b/, "a named-pipe shell"],
  [/msfvenom|msfconsole/, "Metasploit commands"],
  [/sekurlsa::|lsadump::|kerberos::golden/i, "Mimikatz commands"],
  [/Invoke-(Mimikatz|Kerberoast|Shellcode)/i, "offensive PowerShell"],
  [/AmsiScanBuffer|amsiInitFailed/i, "an AMSI bypass"],
  [/--os-shell|--os-pwn/, "sqlmap shell flags"],
  [/\bOR\s+['"]?1['"]?\s*=\s*['"]?1/i, "an injection payload"],
  [/<script>\s*alert/i, "an XSS payload"],
  [/\\x[0-9a-f]{2}\\x[0-9a-f]{2}\\x[0-9a-f]{2}\\x[0-9a-f]{2}/i, "byte-string shellcode"],
];
const moduleText = (slug: string) => {
  const domain = DOMAINS.find((x) => x.id === slug.slice(0, 2));
  if (!domain) return null;
  const file = path.join("modules", domain.folder, `${slug.slice(3)}.md`);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
};
for (const d of modules()) {
  const at = d.meta.slug;
  const raw = moduleText(at);
  if (!raw) {
    fail(`${at}: its domain has no folder in src/data/domains.ts`);
    continue;
  }
  const heads = d.toc.map((t) => t.text);
  if (heads.join("|") !== TEMPLATE.join("|")) fail(`${at}: sections must be ${TEMPLATE.join(", ")}, found ${heads.join(", ")}`);
  if (!LEVELS.includes(d.meta.level ?? "")) fail(`${at}: level must be one of ${LEVELS.join(", ")}`);
  if (!SIDES.includes(d.meta.side ?? "")) fail(`${at}: side must be one of ${SIDES.join(", ")}`);
  if (!d.meta.attack?.length) fail(`${at}: no ATT&CK technique. Use "attack: none" only where no technique fits`);
  for (const t of d.meta.attack ?? []) if (t !== "none" && !/^T\d{4}(\.\d{3})?$/.test(t)) fail(`${at}: bad ATT&CK ID ${t}`);
  if (d.text.split(/\s+/).length < 600) fail(`${at}: only ${d.text.split(/\s+/).length} words`);
  if (d.questions.length < 2) fail(`${at}: needs at least two multiple-choice questions`);
  if (d.written.length < 1) fail(`${at}: needs at least one written question`);
  const part = (name: string) => raw.split(/^## /m).find((p) => p.startsWith(name)) ?? "";
  if (!/^::: law/m.test(part("Exercise"))) fail(`${at}: the exercise has no ::: law notice scoping it to a lab`);
  if ((part("Further reading").match(/\]\(https?:/g) ?? []).length < 2) fail(`${at}: needs at least two references`);
  for (const [re, what] of RECIPES) if (re.test(raw)) fail(`${at}: contains ${what}`);
  for (const s of [...(d.meta.needs ?? []), ...(d.meta.pair ?? [])]) if (!findDoc(s)) fail(`${at}: links to ${s}, which doesn't exist`);
  for (const s of d.meta.pair ?? []) {
    const other = findDoc(s);
    if (other?.meta.kind === "module" && !other.meta.pair?.includes(at)) fail(`${at}: pairs with ${s}, but not the other way round`);
  }
  if (d.meta.pair?.includes(at)) fail(`${at}: pairs with itself`);
}
// Prerequisites must be a map, not a loop.
const visiting = new Set<string>();
const clear = new Set<string>();
const walk = (slug: string, trail: string[]) => {
  if (clear.has(slug)) return;
  if (visiting.has(slug)) return fail(`modules: prerequisites loop: ${[...trail, slug].join(" > ")}`);
  visiting.add(slug);
  for (const n of findDoc(slug)?.meta.needs ?? []) walk(n, [...trail, slug]);
  visiting.delete(slug);
  clear.add(slug);
};
for (const d of modules()) walk(d.meta.slug, []);

// Tool guides. The `use` field sets how much a page may show. Attack tools get
// no commands at all, and the rest may only aim at a lab or the reserved domains.
const TOOL_PARTS: Record<string, string[]> = {
  open: ["What it's for", "How it works", "Try it", "What defenders see"],
  own: ["What it's for", "How it works", "Try it", "What defenders see"],
  know: ["What it's for", "How it works", "Practise safely", "What defenders see"],
};
const SAFE_HOST = /^(example\.(com|org|net)|[a-z0-9.-]*\.example\.(com|org|net)|scanme\.nmap\.org|ghcr\.io|docker\.io|github\.com|.*\.(local|lab|test|internal))$/;
const toolSeen = new Map<string, string>();
for (const d of toolDocs()) {
  const m = d.meta;
  const at = `tools/${m.category}/${m.slug}`;
  const raw = fs.readFileSync(`${at}.md`, "utf8");
  const parts = TOOL_PARTS[m.use ?? ""];
  if (!parts) {
    fail(`${at}: use must be open, own or know`);
    continue;
  }
  const heads = d.toc.map((t) => t.text);
  if (heads.join("|") !== parts.join("|")) fail(`${at}: sections must be ${parts.join(", ")}, found ${heads.join(", ")}`);
  if (!TOOL_CATS.some((c) => c.folder === m.category)) fail(`${at}: folder isn't in src/data/toolcats.ts`);
  if (!SIDES.includes(m.side ?? "")) fail(`${at}: side must be attack, defence or both`);
  if (!/^https:\/\//.test(m.docs ?? "")) fail(`${at}: needs an https docs link`);
  if (!m.summary.endsWith(".") || m.summary.length > 130) fail(`${at}: summary must be one sentence under 130 characters`);
  if (d.text.split(/\s+/).length < 110) fail(`${at}: too short`);
  if (!/^\?! /m.test(raw)) fail(`${at}: needs a written question`);
  for (const [re, what] of RECIPES) if (re.test(raw)) fail(`${at}: contains ${what}`);
  if (m.use === "know") {
    if (raw.includes("\`\`\`")) fail(`${at}: an attack tool's page must not show commands`);
    if (/\`[^\`\n]*\s--?[a-zA-Z][^\`\n]*\`/.test(raw)) fail(`${at}: an attack tool's page must not show flags`);
  }
  if (m.use === "own" && !raw.includes("::: law")) fail(`${at}: needs a legal notice`);
  for (const block of raw.matchAll(/\`\`\`[a-z]*\n([\s\S]*?)\`\`\`/g)) {
    for (const h of (block[1] as string).matchAll(/\b(?:[a-z0-9-]+\.)+(?:com|org|net|io|ai|co)\b/gi)) {
      if (!SAFE_HOST.test(h[0].toLowerCase()) && m.use === "own") fail(`${at}: command aims at ${h[0]}`);
    }
  }
  for (const n of [m.title, ...(m.aka ?? [])]) {
    const k = n.toLowerCase();
    if (toolSeen.has(k)) fail(`${at}: name "${n}" is also used by ${toolSeen.get(k)}`);
    toolSeen.set(k, at);
  }
}

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
  // With the walkthrough off, a step must still say what to do and where to look.
  const stepSegs = d.segments.filter((s): s is StepSegment => s.kind === "step");
  if (stepSegs.length !== steps.length) fail(`${p.id}: ${steps.length} steps but ${stepSegs.length} step blocks`);
  for (const s of stepSegs) {
    const at = `${p.id} step ${s.n}`;
    if (!s.goalHtml) fail(`${at}: no @goal`);
    if (s.goalHtml.includes("<pre")) fail(`${at}: a goal says what to achieve, so no code blocks`);
    if (!/\.|:/.test(s.goalHtml)) fail(`${at}: the goal isn't a sentence`);
    if (s.search.length === 0) fail(`${at}: no @search terms`);
    if (s.docs.length === 0) fail(`${at}: no documentation`);
    if (!s.after.some((x) => x.kind === "check")) fail(`${at}: its checkpoint would be hidden`);
    const hidden = flatSegments(s.body).map((x) => (x.kind === "html" ? x.html : "")).join("");
    if (hidden.includes('class="callout law"')) fail(`${at}: a safety notice is inside the walkthrough`);
  }
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
  const html = flatSegments(d.segments).map((s) => (s.kind === "html" ? s.html : "")).join("");
  for (const m of html.matchAll(/href="\/(courses|guides|machines|sheets|modules|tools)\/([^/"#]+)/g)) {
    if (!slugs.has(m[2] as string)) fail(`${d.meta.slug}: broken internal link /${m[1]}/${m[2]}`);
  }
}

// Links out to legal training platforms, shown under each attack subject.
// Only labs that serve themselves over plain http (flaws.cloud) may skip https.
const PLAIN_HTTP = new Set(["flaws.cloud", "flaws2.cloud"]);
const checkLinks = (where: string, links: TrainLink[]) => {
  if (!links.length) fail(`train: ${where} has no links`);
  const urls = new Set<string>();
  for (const l of links) {
    const u = new URL(l.url);
    if (u.protocol !== "https:" && !PLAIN_HTTP.has(u.hostname)) fail(`train: ${where}: ${l.url} is not https`);
    if (urls.has(l.url)) fail(`train: ${where}: ${l.url} listed twice`);
    urls.add(l.url);
    if (!l.label.trim()) fail(`train: ${where}: empty label`);
  }
};
for (const [slug, links] of Object.entries(TRAIN)) {
  if (!findDoc(slug)) fail(`train: ${slug} is not a module or lesson`);
  checkLinks(slug, links);
}
for (const e of ELSEWHERE) {
  if (!DOMAINS.some((d) => d.id === e.domain)) fail(`train: ${e.title}: unknown domain ${e.domain}`);
  if (modules().some((m) => m.meta.title === e.title)) fail(`train: ${e.title} now has a module: move its links to TRAIN`);
  for (const l of e.lessons) if (!findDoc(l)) fail(`train: ${e.title}: unknown lesson ${l}`);
  checkLinks(e.title, e.links);
}
checkLinks("AD defence", AD_DEFENCE);

// Tips of the day: every link must reach a real page, and no tip is repeated.
const APP_PAGES = new Set(["/practice/mix/", "/practice/mistakes/", "/practice/flashcards/", "/review/"]);
const tipTexts = new Set<string>();
for (const t of TIPS) {
  if (tipTexts.has(t.text)) fail(`tips: duplicate tip "${t.text.slice(0, 40)}"`);
  tipTexts.add(t.text);
  if (t.text.length > 170) fail(`tips: too long for one glance: "${t.text.slice(0, 40)}"`);
  const m = /^\/(guides|sheets|modules|courses)\/([^/]+)\/$/.exec(t.href);
  if (m ? !slugs.has(m[2] as string) : !APP_PAGES.has(t.href)) fail(`tips: broken link ${t.href}`);
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
