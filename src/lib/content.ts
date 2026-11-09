/**
 * Loads lessons and guides (server only). A document is one Markdown file with
 * front matter plus a few additions:
 *
 *   ?? Question                 multiple choice; write the right option first,
 *   + right option              it gets a stable shuffled position.
 *   - wrong option
 *   => why
 *
 *   ?! Written question         answered in the learner's own words
 *   @drill <id>                 a generated drill
 *   @range <id>                 terminal missions
 *   @flow A > B > C             a small flow diagram
 *   @seq, @stack, @pyramid, @bits, @perm   larger diagrams: see diagrams.ts
 *   @term name (alias) = text   a glossary entry, shown on hover everywhere
 *   ::: key|tip|trap|try|why|law Title … :::   a callout
 *
 * In a project, each `## Step N` starts with these. They stay visible, and the
 * rest of the step becomes a walkthrough the learner can switch on:
 *   @goal What to achieve, with any names and addresses later steps rely on
 *   @search first search | second search
 *   @docs Label | url      extra documentation; tool docs are added automatically
 *
 * Lessons sort by file name, and the number in that name is the lesson number.
 * Machines (content/machines) are lessons built around one simulated box;
 * sheets (content/reference) are printable reference pages.
 *
 * Modules live outside content/, in modules/<NN-domain>/<MM-name>.md, and their
 * slug is NN-MM-name. They are the master's-level reference that sits beside the
 * 24-month roadmap. scripts/check-content.ts enforces their seven-part template.
 *
 * Tools live in tools/<NN-category>/<slug>.md: one page per tool, in four parts.
 * Their `use` field decides how much they may show. See src/data/toolcats.ts.
 */
import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";
import { bitsHtml, permHtml, pyramidHtml, seqSvg, stackHtml } from "./diagrams";
import { TOOLS } from "@/data/tools";
import { TRAIN, type TrainLink } from "@/data/train";
import type { Check, Doc, DocBrief, DocLink, DocMeta, HelpLevel, Question, Segment, StepSegment, Term, TocEntry, ToolUse, Written } from "./types";

const ROOT = path.join(process.cwd(), "content");
const MODULES = path.join(process.cwd(), "modules");
const TOOL_PAGES = path.join(process.cwd(), "tools");

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Marked escapes headings; the table of contents needs plain text. */
const decode = (s: string) =>
  s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const slugify = (s: string) =>
  s.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Shuffles with a seed from the text, so positions stay put between builds. */
function shuffled<T>(items: T[], seed: number): T[] {
  const a = [...items];
  let x = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    const j = x % (i + 1);
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

function makeMarked(toc: TocEntry[]) {
  const seen = new Map<string, number>();
  const m = new Marked({ gfm: true });
  m.use({
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        if (depth !== 2) return `<h${depth}>${inner}</h${depth}>\n`;
        const text = decode(inner.replace(/<[^>]+>/g, ""));
        const stepN = /^Step (\d+)/.exec(text);
        let id = stepN ? `step-${stepN[1]}` : slugify(text);
        const n = seen.get(id) ?? 0;
        seen.set(id, n + 1);
        if (n) id += `-${n}`;
        toc.push({ id, text });
        return `<h2 id="${id}">${inner}</h2>\n`;
      },
      link({ href, tokens }) {
        const inner = this.parser.parseInline(tokens);
        return href.startsWith("/") || href.startsWith("#")
          ? `<a href="${href}">${inner}</a>`
          : `<a href="${href}" target="_blank" rel="noreferrer">${inner}</a>`;
      },
      table(token) {
        const cell = (c: (typeof token.header)[number], tag: string) => `<${tag}>${this.parser.parseInline(c.tokens)}</${tag}>`;
        const head = token.header.map((c) => cell(c, "th")).join("");
        const body = token.rows.map((r) => `<tr>${r.map((c) => cell(c, "td")).join("")}</tr>`).join("");
        return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>\n`;
      },
    },
  });
  return m;
}

const CALLOUTS: Record<string, string> = {
  key: "The idea to keep",
  tip: "Tip",
  trap: "Common trap",
  try: "Try it",
  why: "Why this matters",
  law: "Stay legal",
  ai: "With your AI tutor",
  job: "On the job",
};

function flowHtml(spec: string): string {
  const parts = spec.split(/\s+>\s+/).map((p) => p.trim());
  const cells = parts
    .map((p, i) => `${i ? '<span class="flow-arrow" aria-hidden="true">→</span>' : ""}<span class="flow-box">${esc(p)}</span>`)
    .join("");
  return `<div class="flow noterms" role="img" aria-label="${esc(parts.join(", then "))}">${cells}</div>\n`;
}

interface Parsed {
  front: Record<string, string>;
  body: string;
}

function splitFront(raw: string, file: string): Parsed {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!m) throw new Error(`${file}: no front matter`);
  const front: Record<string, string> = {};
  for (const line of (m[1] as string).split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) front[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { front, body: m[2] as string };
}

const LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g;

/** The tools' official docs, then what the author chose, then links from the walkthrough. */
function stepDocs(step: StepSegment, raw: string): DocLink[] {
  const seen = new Set<string>();
  const out: DocLink[] = [];
  const add = (d: DocLink) => {
    const key = d.href.replace(/[#?].*$/, "").replace(/\/$/, "");
    if (seen.has(key)) return;
    seen.add(key);
    // "lesson 14" reads better capitalised; "draw.io" and "gitleaks" keep their own spelling.
    const label = d.href.startsWith("/") ? d.label.charAt(0).toUpperCase() + d.label.slice(1) : d.label;
    out.push({ label, href: d.href });
  };
  for (const t of step.tools) (TOOLS[t.tool]?.docs ?? []).forEach(add);
  step.docs.forEach(add);
  for (const m of raw.matchAll(LINK)) add({ label: (m[1] as string).replace(/[*`]/g, ""), href: m[2] as string });
  return out;
}

/** Every segment, including those inside project steps. */
export const flatSegments = (list: Segment[]): Segment[] =>
  list.flatMap((s) => (s.kind === "step" ? [s, ...flatSegments(s.body), ...s.after] : [s]));

function parseBody(slug: string, title: string, body: string, href: string) {
  const toc: TocEntry[] = [];
  const marked = makeMarked(toc);
  const inline = (s: string) => marked.parseInline(s, { async: false }) as string;
  const md = (s: string) => marked.parse(s, { async: false }) as string;

  const segments: Segment[] = [];
  const questions: Question[] = [];
  const written: Written[] = [];
  const terms: Term[] = [];
  const checks: Check[] = [];
  const tools: ToolUse[] = [];
  let step = 0;
  let buf: string[] = [];
  const flush = () => {
    const text = buf.join("\n").trim();
    buf = [];
    if (text) out.push({ kind: "html", html: md(text) });
  };

  // Project steps. `out` is wherever the parser is writing now.
  const isProject = href.startsWith("/projects/");
  let out: Segment[] = segments;
  let current: StepSegment | null = null;
  const stepRaw: string[] = [];
  const stopStep = () => {
    if (!current) return;
    current.docs = stepDocs(current, stepRaw.join("\n"));
    current = null;
    stepRaw.length = 0;
    out = segments;
  };

  const lines = body.split("\n");
  let i = 0;
  let inFence = false;
  while (i < lines.length) {
    const line = lines[i] as string;
    if (line.startsWith("```")) inFence = !inFence;
    if (inFence) {
      buf.push(line);
      i++;
      continue;
    }
    const stepHead = /^## Step (\d+)/.exec(line);
    if (stepHead) step = Number(stepHead[1]);
    if (isProject && line.startsWith("## ")) {
      flush();
      stopStep();
      if (stepHead) {
        current = { kind: "step", n: Number(stepHead[1]), headingHtml: md(line), goalHtml: "", tools: [], notices: [], docs: [], search: [], body: [], after: [] };
        segments.push(current);
        out = current.body;
        i++;
        continue;
      }
    }
    if (current) {
      stepRaw.push(line);
      const goal = /^@goal\s+(.+)$/.exec(line);
      if (goal) {
        current.goalHtml = inline(goal[1] as string);
        i++;
        continue;
      }
      const search = /^@search\s+(.+)$/.exec(line);
      if (search) {
        current.search.push(...(search[1] as string).split("|").map((t) => t.trim()).filter(Boolean));
        i++;
        continue;
      }
      const doc = /^@docs\s+(.+?)\s*\|\s*(\S+)\s*$/.exec(line);
      if (doc) {
        current.docs.push({ label: doc[1] as string, href: doc[2] as string });
        i++;
        continue;
      }
    }
    const help = /^@help\s+(\S+)\s+(guided|recall|solo)\s*$/.exec(line);
    if (help) {
      flush();
      const tool = help[1] as string;
      const level = help[2] as HelpLevel;
      tools.push({ tool, level, step });
      if (current) current.tools.push({ tool, level });
      else out.push({ kind: "help", tool, level });
      i++;
      continue;
    }
    if (line.startsWith("@done ")) {
      flush();
      const check: Check = { id: `${slug}:${checks.length + 1}`, step, text: line.slice(6).trim() };
      checks.push(check);
      (current?.after ?? out).push({ kind: "check", id: check.id, html: inline(check.text) });
      i++;
      continue;
    }
    const reveal = /^@reveal\s+(.+)$/.exec(line);
    if (reveal) {
      const inner: string[] = [];
      i++;
      while (i < lines.length && (lines[i] as string).trim() !== "@endreveal") inner.push(lines[i++] as string);
      i++;
      buf.push("", `<details class="reveal"><summary>${esc(reveal[1] as string)}</summary>${md(inner.join("\n"))}</details>`, "");
      continue;
    }
    if (line.startsWith("?? ")) {
      flush();
      const prompt = line.slice(3).trim();
      const right: string[] = [];
      const wrong: string[] = [];
      let why = "";
      i++;
      while (i < lines.length && (lines[i] as string).trim() !== "") {
        const l = lines[i] as string;
        if (l.startsWith("+ ")) right.push(l.slice(2).trim());
        else if (l.startsWith("- ")) wrong.push(l.slice(2).trim());
        else if (l.startsWith("=> ")) why = l.slice(3).trim();
        else if (why) why += ` ${l.trim()}`;
        else throw new Error(`${slug}: bad line in question "${prompt}": ${l}`);
        i++;
      }
      if (right.length !== 1 || wrong.length < 2 || !why) throw new Error(`${slug}: malformed question "${prompt}"`);
      const options = shuffled([...right, ...wrong], hash(prompt));
      const q: Question = {
        id: `${slug}#${questions.length + 1}`,
        prompt,
        options,
        correct: options.indexOf(right[0] as string),
        why,
        promptHtml: inline(prompt),
        optionsHtml: options.map(inline),
        whyHtml: inline(why),
      };
      questions.push(q);
      (current?.after ?? out).push({ kind: "question", question: q });
      continue;
    }
    if (line.startsWith("?! ")) {
      flush();
      const prompt = line.slice(3).trim();
      const w: Written = { id: `${slug}~${written.length + 1}`, prompt, promptHtml: inline(prompt) };
      written.push(w);
      (current?.after ?? out).push({ kind: "written", written: w });
      i++;
      continue;
    }
    const drill = /^@drill\s+(\S+)/.exec(line);
    if (drill) {
      flush();
      out.push({ kind: "drill", id: drill[1] as string });
      i++;
      continue;
    }
    const range = /^@range\s+(\S+)/.exec(line);
    if (range) {
      flush();
      out.push({ kind: "range", id: range[1] as string });
      i++;
      continue;
    }
    const block = /^@(seq|stack|pyramid)\b\s*(.*)$/.exec(line);
    if (block) {
      const rows: string[] = [];
      i++;
      while (i < lines.length && (lines[i] as string).trim() !== "") rows.push((lines[i++] as string).trim());
      const html = block[1] === "seq" ? seqSvg(block[2] as string, rows) : block[1] === "stack" ? stackHtml(rows) : pyramidHtml(rows);
      buf.push("", html, "");
      continue;
    }
    const bits = /^@bits\s+(\d+)\s+(\S+)/.exec(line);
    if (bits) {
      buf.push("", bitsHtml(Number(bits[1]), bits[2] as string), "");
      i++;
      continue;
    }
    const perm = /^@perm\s+(\S+)/.exec(line);
    if (perm) {
      buf.push("", permHtml(perm[1] as string), "");
      i++;
      continue;
    }
    if (line.startsWith("@flow ")) {
      buf.push("", flowHtml(line.slice(6)), "");
      i++;
      continue;
    }
    const term = /^@term\s+(.+?)(?:\s+\(([^)]*)\))?\s+=\s+(.+)$/.exec(line);
    if (term) {
      terms.push({
        term: term[1] as string,
        aliases: term[2] ? term[2].split(",").map((a) => a.trim()) : [],
        definition: term[3] as string,
        doc: slug,
        docTitle: title,
        href,
      });
      i++;
      continue;
    }
    const call = /^:::\s*(\w+)\s*(.*)$/.exec(line);
    if (call) {
      const kind = call[1] as string;
      if (!CALLOUTS[kind]) throw new Error(`${slug}: unknown callout ${kind}`);
      const label = call[2]?.trim() || CALLOUTS[kind];
      const inner: string[] = [];
      i++;
      while (i < lines.length && (lines[i] as string).trim() !== ":::") inner.push(lines[i++] as string);
      i++;
      const box = `<div class="callout ${kind}"><span class="label">${esc(label as string)}</span>${md(inner.join("\n"))}</div>`;
      // A safety notice must be seen whether or not the walkthrough is open.
      if (current && kind === "law") current.notices.push(box);
      else buf.push("", box, "");
      continue;
    }
    buf.push(line);
    i++;
  }
  flush();
  stopStep();
  const text = body
    .split("\n")
    .filter((l) => !/^(\?\?|\?!|\+ |=> |@|:::)/.test(l))
    .join("\n");
  return { segments, questions, written, terms, toc, text, checks, tools };
}

type DocDir = "lessons" | "guides" | "machines" | "reference" | "projects" | "modules" | "tools";
const KIND = { lessons: "lesson", guides: "guide", machines: "machine", reference: "sheet", projects: "project", modules: "module", tools: "tool" } as const;
const BASE = { lessons: "/courses/", guides: "/guides/", machines: "/machines/", reference: "/sheets/", projects: "/projects/", modules: "/modules/", tools: "/tools/" } as const;

const fileOf = (kindDir: DocDir, file: string) =>
  kindDir === "modules" ? path.join(MODULES, file) : kindDir === "tools" ? path.join(TOOL_PAGES, file) : path.join(ROOT, kindDir, file);

/** "01-networking/07-netcat.md" has the slug "01-07-netcat". */
const moduleSlug = (file: string) => {
  const [dir, name] = file.replace(/\.md$/, "").split("/") as [string, string];
  return `${dir.slice(0, 2)}-${name}`;
};
const list = (s?: string) => (s ? s.split(",").map((w) => w.trim()).filter(Boolean) : []);

function toolFiles(): string[] {
  try {
    return fs
      .readdirSync(TOOL_PAGES)
      .filter((d) => /^\d\d-/.test(d))
      .sort()
      .flatMap((d) => fs.readdirSync(path.join(TOOL_PAGES, d)).filter((f) => f.endsWith(".md") && f !== "README.md").sort().map((f) => `${d}/${f}`));
  } catch {
    return [];
  }
}

function moduleFiles(): string[] {
  try {
    return fs
      .readdirSync(MODULES)
      .filter((d) => /^\d\d-/.test(d))
      .sort()
      .flatMap((d) => fs.readdirSync(path.join(MODULES, d)).filter((f) => /^\d\d-.*\.md$/.test(f)).sort().map((f) => `${d}/${f}`));
  } catch {
    return [];
  }
}

function readDir(kind: DocDir): string[] {
  const dir = path.join(ROOT, kind);
  try {
    return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  } catch {
    return [];
  }
}

function load(kindDir: DocDir, file: string): Doc {
  const raw = fs.readFileSync(fileOf(kindDir, file), "utf8");
  const isModule = kindDir === "modules";
  const isTool = kindDir === "tools";
  const slug = isModule ? moduleSlug(file) : isTool ? path.basename(file, ".md") : file.replace(/\.md$/, "");
  const { front, body } = splitFront(raw, file);
  const kind = KIND[kindDir];
  const title = front.title ?? slug;
  const parsed = parseBody(slug, title, body, `${BASE[kindDir]}${slug}/`);
  const src = front.source?.split("|").map((s) => s.trim());
  const meta: DocMeta = {
    slug,
    kind,
    number: isModule ? Number(slug.slice(3, 5)) : Number(/^\d+/.exec(slug)?.[0] ?? 0),
    title,
    summary: front.summary ?? "",
    month: Number(front.month ?? 0),
    minutes: Number(front.minutes ?? 20),
    words: front.words ? front.words.split(",").map((w) => w.trim()) : [],
    questions: parsed.questions.length,
  };
  if (front.builds) meta.builds = front.builds;
  if (front.group) meta.group = front.group;
  if (front.level) meta.level = front.level;
  if (isTool) {
    meta.category = path.dirname(file);
    if (front.side) meta.side = front.side;
    if (front.use) meta.use = front.use;
    if (front.docs) meta.docs = front.docs;
    if (front.kali) meta.kali = front.kali;
    meta.aka = list(front.aka);
    meta.alt = list(front.alt);
  }
  if (isModule) {
    meta.domain = slug.slice(0, 2);
    meta.attack = list(front.attack);
    meta.needs = list(front.needs);
    meta.pair = list(front.pair);
    if (front.side) meta.side = front.side;
    if (front.series) meta.series = front.series;
  }
  if (front.hours) meta.hours = Number(front.hours);
  if (front.tested) meta.tested = front.tested;
  if (front.parts) {
    meta.parts = front.parts.split(",").map((p) => {
      const m = /(\d+)-(\d+)\s*@\s*(\d+)h/.exec(p);
      if (!m) throw new Error(`${slug}: bad parts: ${p}`);
      return { from: Number(m[1]), to: Number(m[2]), hours: Number(m[3]) };
    });
  }
  if (src && src.length === 2) meta.source = { label: src[0] as string, url: src[1] as string };
  return { meta, ...parsed };
}

interface Library {
  lessons: Doc[];
  guides: Doc[];
  machines: Doc[];
  sheets: Doc[];
  projects: Doc[];
  modules: Doc[];
  tools: Doc[];
}

/**
 * Parsing every document takes seconds, so it happens once. In development each
 * file is re-parsed only when it changes on disk, so an edited lesson still shows
 * up at once. The state sits on globalThis because `next dev` loads this module
 * once per route. After editing the parser itself, restart the dev server.
 */
interface ContentCache {
  files: Map<string, { stamp: string; doc: Doc }>;
  library: Library | null;
  checked: number;
  glossary: Term[] | null;
  terms: WeakMap<Doc, Term[]>;
}
const memo = ((globalThis as { __cyberdojoContent?: ContentCache }).__cyberdojoContent ??= {
  files: new Map(),
  library: null,
  checked: 0,
  glossary: null,
  terms: new WeakMap(),
});

function cached(kindDir: DocDir, file: string): Doc {
  const at = fileOf(kindDir, file);
  const { mtimeMs, size } = fs.statSync(at);
  const stamp = `${mtimeMs}:${size}`;
  const hit = memo.files.get(at);
  if (hit?.stamp === stamp) return hit.doc;
  const doc = load(kindDir, file);
  memo.files.set(at, { stamp, doc });
  return doc;
}

/** One page asks for documents many times, so disk is checked at most this often. */
const RECHECK_MS = 300;

function all(): Library {
  const now = Date.now();
  if (memo.library && (process.env.NODE_ENV === "production" || now - memo.checked < RECHECK_MS)) return memo.library;
  memo.checked = now;
  const before = memo.library;
  const next: Library = {
    lessons: readDir("lessons").map((f) => cached("lessons", f)),
    guides: readDir("guides").map((f) => cached("guides", f)),
    machines: readDir("machines").map((f) => cached("machines", f)),
    sheets: readDir("reference").map((f) => cached("reference", f)),
    projects: readDir("projects").map((f) => cached("projects", f)),
    modules: moduleFiles().map((f) => cached("modules", f)),
    tools: toolFiles().map((f) => cached("tools", f)),
  };
  const same = before && (Object.keys(next) as (keyof Library)[]).every((k) => next[k].length === before[k].length && next[k].every((d, i) => d === before[k][i]));
  if (same) return before;
  memo.library = next;
  memo.glossary = null;
  memo.terms = new WeakMap();
  return next;
}

export const lessons = () => all().lessons;
export const guides = () => all().guides;
export const machines = () => all().machines;
export const sheets = () => all().sheets;
export const projects = () => all().projects;
export const modules = () => all().modules;
export const getModule = (slug: string) => modules().find((d) => d.meta.slug === slug);
export const toolDocs = () => all().tools;
export const getToolDoc = (slug: string) => toolDocs().find((d) => d.meta.slug === slug);
export const getProject = (slug: string) => projects().find((d) => d.meta.slug === slug);
export const getMachine = (slug: string) => machines().find((d) => d.meta.slug === slug);
export const getSheet = (slug: string) => sheets().find((d) => d.meta.slug === slug);
export const lessonMetas = (): DocMeta[] => lessons().map((d) => d.meta);
export const guideMetas = (): DocMeta[] => guides().map((d) => d.meta);
export const getLesson = (slug: string) => lessons().find((d) => d.meta.slug === slug);
export const getGuide = (slug: string) => guides().find((d) => d.meta.slug === slug);

export function glossary(): Term[] {
  const lib = all();
  if (memo.glossary) return memo.glossary;
  const out = [...lib.lessons, ...lib.guides, ...lib.machines, ...lib.sheets, ...lib.projects, ...lib.modules].flatMap((d) => d.terms);
  memo.glossary = out.sort((a, b) => a.term.toLowerCase().localeCompare(b.term.toLowerCase()));
  return memo.glossary;
}

export function brief(doc: Doc): DocBrief {
  const { slug, kind, title, summary, number, words } = doc.meta;
  return { slug, kind, title, summary, number, words, questions: doc.questions, written: doc.written };
}

/** Every question, for spaced review. */
export function allQuestions(): { q: Question; title: string; href: string }[] {
  return [
    ...lessons().flatMap((d) => d.questions.map((q) => ({ q, title: d.meta.title, href: `/courses/${d.meta.slug}/` }))),
    ...guides().flatMap((d) => d.questions.map((q) => ({ q, title: d.meta.title, href: `/guides/${d.meta.slug}/` }))),
    ...machines().flatMap((d) => d.questions.map((q) => ({ q, title: d.meta.title, href: `/machines/${d.meta.slug}/` }))),
  ];
}

/** A slug in a module's front matter: lessons start with four digits, modules with NN-MM. */
export function findDoc(slug: string): Doc | undefined {
  return /^\d{4}-/.test(slug) ? getLesson(slug) : getModule(slug);
}
const hrefOf = (d: Doc) => `${d.meta.kind === "lesson" ? "/courses/" : "/modules/"}${d.meta.slug}/`;
const linkTo = (d: Doc) => `<a href="${hrefOf(d)}">${esc(d.meta.title)}</a>`;
const linkLine = (label: string, docs: Doc[]) => (docs.length ? `<p><span>${label}</span> ${docs.map(linkTo).join(", ")}</p>` : "");
const SIDES: Record<string, string> = { attack: "Mostly the attacker's view", defence: "Mostly the defender's view", both: "Attack and defence" };

/** The panel at the top of a module: where it fits, what to read first, its other half. */
export function moduleContext(doc: Doc): Segment {
  const m = doc.meta;
  const need = (m.needs ?? []).flatMap((s) => findDoc(s) ?? []);
  const pair = (m.pair ?? []).flatMap((s) => findDoc(s) ?? []);
  const techniques = (m.attack ?? []).filter((t) => t !== "none").map((t) => `<a href="https://attack.mitre.org/techniques/${t.replace(".", "/")}/" target="_blank" rel="noreferrer">${esc(t)}</a>`);
  const html = [
    m.series ? `<p><span>Series</span> ${esc(m.series)}</p>` : "",
    linkLine("Read first", need),
    linkLine("The other side", pair),
    techniques.length ? `<p><span>ATT&amp;CK</span> ${techniques.join(", ")}</p>` : "",
    m.side ? `<p><span>View</span> ${SIDES[m.side] ?? esc(m.side)}</p>` : "",
  ].join("");
  return { kind: "html", html: `<div class="module-context noterms">${html}</div>\n` };
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Tools named after ordinary words, which would link from every page that says "dig deeper". */
const PLAIN_WORDS = new Set(["dig", "strings", "ping", "curl", "whois", "ssh", "sudo", "find", "age", "pass", "volatility", "autopsy", "responder", "sigma", "empire", "sliver", "tor", "reg", "net"]);
const toolRe = new Map<string, RegExp | null>();
/** Finds a tool's names in text, exact case. Only letters and digits count as a word edge, so `nc` won't match `sync`. */
function toolPattern(d: Doc): RegExp | null {
  const slug = d.meta.slug;
  if (!toolRe.has(slug)) {
    const names = [d.meta.title, ...(d.meta.aka ?? [])];
    toolRe.set(slug, PLAIN_WORDS.has(slug) ? null : new RegExp(`(?<![A-Za-z0-9_-])(${names.map(escapeRe).join("|")})(?![A-Za-z0-9_-])`));
  }
  return toolRe.get(slug) ?? null;
}

/** Guides for the tools a page names, so a table row always leads somewhere. */
export function toolGuides(doc: Doc): Segment[] {
  const hits = toolDocs().filter((t) => toolPattern(t)?.test(doc.text));
  if (!hits.length) return [];
  const links = hits.map((t) => `<a href="/tools/${t.meta.slug}/">${esc(t.meta.title)}</a>`);
  return [{ kind: "html", html: `<div class="module-context noterms"><p><span>Tool guides</span> ${links.join(", ")}</p></div>\n` }];
}

/** Every page that uses a tool, for the panel on the tool's own page. */
function usedIn(doc: Doc): { label: string; href: string }[] {
  const re = toolPattern(doc);
  if (!re) return [];
  const lib = all();
  const rows: [Doc[], string][] = [[lib.lessons, "/courses/"], [lib.modules, "/modules/"], [lib.projects, "/projects/"]];
  return rows.flatMap(([docs, base]) => docs.filter((d) => re.test(d.text)).map((d) => ({ label: d.meta.title, href: `${base}${d.meta.slug}/` })));
}

const TIER: Record<string, string> = {
  own: "Point this only at systems you own or have written permission to test.",
  know: "This is an attack tool. This page explains it so that you can recognise and stop it. It shows no commands, and you should run it only in an authorised lab.",
};

/** The panel at the top of a tool's page. */
export function toolContext(doc: Doc): Segment {
  const m = doc.meta;
  const near = (m.alt ?? []).map((name) => {
    const hit = toolDocs().find((d) => d.meta.slug === name || d.meta.title.toLowerCase() === name.toLowerCase());
    return hit ? `<a href="/tools/${hit.meta.slug}/">${esc(hit.meta.title)}</a>` : esc(name);
  });
  const used = usedIn(doc).slice(0, 12).map((u) => `<a href="${u.href}">${esc(u.label)}</a>`);
  const html = [
    m.use && TIER[m.use] ? `<p class="tool-tier"><span>Stay legal</span> ${esc(TIER[m.use] as string)}</p>` : "",
    m.side ? `<p><span>View</span> ${SIDES[m.side] ?? esc(m.side)}</p>` : "",
    m.docs ? `<p><span>Official docs</span> <a href="${esc(m.docs)}" target="_blank" rel="noreferrer">${esc(m.docs.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a></p>` : "",
    m.kali ? `<p><span>Kali package</span> <code>${esc(m.kali)}</code></p>` : "",
    near.length ? `<p><span>Similar tools</span> ${near.join(", ")}</p>` : "",
    used.length ? `<p><span>Used in</span> ${used.join(", ")}</p>` : "",
  ].join("");
  return { kind: "html", html: `<div class="module-context noterms">${html}</div>\n` };
}

/** A list of outside training links, opened in a new tab. */
export function trainList(links: TrainLink[]): string {
  return `<ul>${links.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noreferrer">${esc(l.label)}</a></li>`).join("")}</ul>`;
}

const PANELS = {
  attack: { head: "Learn the attack hands-on", text: "This page teaches the defender's side. To learn the attack itself, use these legal platforms, and only against their labs or a lab you own:" },
  practice: { head: "Practise it hands-on", text: "Courses and labs where you do this for real, on systems built for it:" },
  tool: { head: "Practise with this tool", text: "Courses and labs that use this tool, or the job it does, on targets built for it. Point it at nothing else without written permission:" },
  defenceTool: { head: "Practise with this tool", text: "Courses and labs that use this tool, or the job it does:" },
};

/** Which wording a page's panel takes. A tool's depends on whether it can hurt someone else's system. */
function panelFor(key: string, side?: string) {
  const t = TRAIN[key];
  if (!t?.links.length) return null;
  const words = side === undefined ? PANELS[t.kind] : side === "defence" ? PANELS.defenceTool : PANELS.tool;
  return { ...words, links: t.links };
}

/**
 * The hands-on panel for any page with links out, or "" for one without.
 * Keys are the ones in TRAIN: a slug, a project id, "dojo:id" or "case:id".
 */
export function trainHtml(key: string, side?: string): string {
  const p = panelFor(key, side);
  if (!p) return "";
  return `<section class="train-panel noterms" id="hands-on" aria-labelledby="hands-on-head"><h2 class="train-head" id="hands-on-head">${p.head}</h2><p>${p.text}</p>${trainList(p.links)}</section>\n`;
}

/** The panel as a page segment. Lessons, modules and tools show it first; machines and projects last. */
export function trainPanel(doc: Doc, key = doc.meta.slug): Segment[] {
  const html = trainHtml(key, doc.meta.kind === "tool" ? (doc.meta.side ?? "both") : undefined);
  return html ? [{ kind: "html", html }] : [];
}

/** The page's contents with the panel in them, so the rail shows where the links are. */
export function tocWith(doc: Doc, key = doc.meta.slug, at: "start" | "end" = "start"): TocEntry[] {
  const p = panelFor(key, doc.meta.kind === "tool" ? (doc.meta.side ?? "both") : undefined);
  if (!p) return doc.toc;
  const entry = { id: "hands-on", text: p.head };
  return at === "start" ? [entry, ...doc.toc] : [...doc.toc, entry];
}

/** Modules that build on a lesson, shown at its end. Nothing when there are none. */
export function deeperModules(doc: Doc): Segment[] {
  const found = modules().filter((d) => d.meta.needs?.includes(doc.meta.slug));
  if (!found.length) return [];
  return [{ kind: "html", html: `<div class="module-context noterms">${linkLine("Go deeper", found)}</div>\n` }];
}

/** Glossary entries whose name appears in this document, for hover definitions. */
export function termsFor(doc: Doc): Term[] {
  const every = glossary();
  const hit = memo.terms.get(doc);
  if (hit) return hit;
  const hay = doc.text.toLowerCase();
  const found = every.filter((t) => [t.term, ...t.aliases].some((n) => hay.includes(n.toLowerCase())));
  memo.terms.set(doc, found);
  return found;
}
