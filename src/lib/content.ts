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
 *   @term name (alias) = text   a glossary entry, shown on hover everywhere
 *   ::: key|tip|trap|try|why|law Title … :::   a callout
 *
 * Lessons sort by file name, and the number in that name is the lesson number.
 * Machines (content/machines) are lessons built around one simulated box;
 * sheets (content/reference) are printable reference pages.
 */
import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";
import type { Check, Doc, DocBrief, DocMeta, HelpLevel, Question, Segment, Term, TocEntry, ToolUse, Written } from "./types";

const ROOT = path.join(process.cwd(), "content");

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
        let id = slugify(text);
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
    if (text) segments.push({ kind: "html", html: md(text) });
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
    const help = /^@help\s+(\S+)\s+(guided|recall|solo)\s*$/.exec(line);
    if (help) {
      flush();
      const tool = help[1] as string;
      const level = help[2] as HelpLevel;
      tools.push({ tool, level, step });
      segments.push({ kind: "help", tool, level });
      i++;
      continue;
    }
    if (line.startsWith("@done ")) {
      flush();
      const check: Check = { id: `${slug}:${checks.length + 1}`, step, text: line.slice(6).trim() };
      checks.push(check);
      segments.push({ kind: "check", id: check.id, html: inline(check.text) });
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
      segments.push({ kind: "question", question: q });
      continue;
    }
    if (line.startsWith("?! ")) {
      flush();
      const prompt = line.slice(3).trim();
      const w: Written = { id: `${slug}~${written.length + 1}`, prompt, promptHtml: inline(prompt) };
      written.push(w);
      segments.push({ kind: "written", written: w });
      i++;
      continue;
    }
    const drill = /^@drill\s+(\S+)/.exec(line);
    if (drill) {
      flush();
      segments.push({ kind: "drill", id: drill[1] as string });
      i++;
      continue;
    }
    const range = /^@range\s+(\S+)/.exec(line);
    if (range) {
      flush();
      segments.push({ kind: "range", id: range[1] as string });
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
      buf.push("", `<div class="callout ${kind}"><span class="label">${esc(label as string)}</span>${md(inner.join("\n"))}</div>`, "");
      continue;
    }
    buf.push(line);
    i++;
  }
  flush();
  const text = body
    .split("\n")
    .filter((l) => !/^(\?\?|\?!|\+ |=> |@|:::)/.test(l))
    .join("\n");
  return { segments, questions, written, terms, toc, text, checks, tools };
}

type DocDir = "lessons" | "guides" | "machines" | "reference" | "projects";
const KIND = { lessons: "lesson", guides: "guide", machines: "machine", reference: "sheet", projects: "project" } as const;
const BASE = { lessons: "/courses/", guides: "/guides/", machines: "/machines/", reference: "/sheets/", projects: "/projects/" } as const;

function readDir(kind: DocDir): string[] {
  const dir = path.join(ROOT, kind);
  try {
    return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  } catch {
    return [];
  }
}

function load(kindDir: DocDir, file: string): Doc {
  const raw = fs.readFileSync(path.join(ROOT, kindDir, file), "utf8");
  const slug = file.replace(/\.md$/, "");
  const { front, body } = splitFront(raw, file);
  const kind = KIND[kindDir];
  const title = front.title ?? slug;
  const parsed = parseBody(slug, title, body, `${BASE[kindDir]}${slug}/`);
  const src = front.source?.split("|").map((s) => s.trim());
  const meta: DocMeta = {
    slug,
    kind,
    number: Number(/^\d+/.exec(slug)?.[0] ?? 0),
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
  if (front.hours) meta.hours = Number(front.hours);
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

let cache: { lessons: Doc[]; guides: Doc[]; machines: Doc[]; sheets: Doc[]; projects: Doc[] } | null = null;

function all() {
  if (cache && process.env.NODE_ENV === "production") return cache;
  cache = {
    lessons: readDir("lessons").map((f) => load("lessons", f)),
    guides: readDir("guides").map((f) => load("guides", f)),
    machines: readDir("machines").map((f) => load("machines", f)),
    sheets: readDir("reference").map((f) => load("reference", f)),
    projects: readDir("projects").map((f) => load("projects", f)),
  };
  return cache;
}

export const lessons = () => all().lessons;
export const guides = () => all().guides;
export const machines = () => all().machines;
export const sheets = () => all().sheets;
export const projects = () => all().projects;
export const getProject = (slug: string) => projects().find((d) => d.meta.slug === slug);
export const getMachine = (slug: string) => machines().find((d) => d.meta.slug === slug);
export const getSheet = (slug: string) => sheets().find((d) => d.meta.slug === slug);
export const lessonMetas = (): DocMeta[] => lessons().map((d) => d.meta);
export const guideMetas = (): DocMeta[] => guides().map((d) => d.meta);
export const getLesson = (slug: string) => lessons().find((d) => d.meta.slug === slug);
export const getGuide = (slug: string) => guides().find((d) => d.meta.slug === slug);

export function glossary(): Term[] {
  const out = [...lessons(), ...guides(), ...machines(), ...sheets(), ...projects()].flatMap((d) => d.terms);
  return out.sort((a, b) => a.term.toLowerCase().localeCompare(b.term.toLowerCase()));
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

/** Glossary entries whose name appears in this document, for hover definitions. */
export function termsFor(doc: Doc): Term[] {
  const hay = doc.text.toLowerCase();
  return glossary().filter((t) => [t.term, ...t.aliases].some((n) => hay.includes(n.toLowerCase())));
}
