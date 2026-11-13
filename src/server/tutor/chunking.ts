/**
 * Turns a parsed document into chunks: plain text, cut at `##` sections and
 * then by size. It reads the same segments the pages render, so the tutor and
 * the reader see one source.
 */
import { createHash } from "node:crypto";
import type { Lang } from "@/i18n/lang";
import { flatSegments } from "@/lib/content";
import { RANGES } from "@/lib/missions";
import type { Chunk } from "@/lib/tutor-types";
import type { Doc, Segment } from "@/lib/types";

/** About 400 tokens: small enough to fit several in a prompt, large enough to hold one idea. */
const MAX_CHARS = 1600;

/** Marks a `##` heading inside converted text. */
const H2 = "\u0001";

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s: string) =>
  s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (all, e: string) => {
    if (e[0] !== "#") return ENTITIES[e.toLowerCase()] ?? all;
    const code = e[1]?.toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : all;
  });

const strip = (html: string) => html.replace(/<[^>]+>/g, "");

export function htmlToText(html: string): string {
  const text = html
    .replace(/<(svg|button|script|style)\b[\s\S]*?<\/\1>/g, "")
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/g, (_, code: string) => `\n\`\`\`\n${strip(code).trim()}\n\`\`\`\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, (_, h: string) => `\n${H2}${strip(h).trim()}\n`)
    .replace(/<h[3-6][^>]*>([\s\S]*?)<\/h[3-6]>/g, (_, h: string) => `\n### ${strip(h).trim()}\n`)
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/g, (_, c: string) => `\`${strip(c)}\``)
    .replace(/<li[^>]*>/g, "\n- ")
    .replace(/<\/t[dh]>/g, " | ")
    .replace(/<(br|\/p|\/div|\/tr|\/ul|\/ol|\/blockquote|\/figure)\b[^>]*>/g, "\n");
  return decode(strip(text)).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

const letter = (i: number) => String.fromCharCode(65 + i);

interface Block {
  text: string;
  written?: { id: string; prompt: string };
}

/** One segment as text. Drills are generated in the browser and help badges are interface, so neither has any. */
function blockOf(s: Segment): Block | null {
  switch (s.kind) {
    case "html":
      return { text: htmlToText(s.html) };
    case "question": {
      const q = s.question;
      return { text: [`Check question: ${q.prompt}`, ...q.options.map((o, i) => `${letter(i)}) ${o}`), `Answer key: ${letter(q.correct)}) ${q.options[q.correct]}`, `Why: ${q.why}`].join("\n") };
    }
    case "written":
      return { text: `Written question: ${s.written.prompt}`, written: { id: s.written.id, prompt: s.written.prompt } };
    case "check":
      return { text: `Checkpoint: ${htmlToText(s.html)}` };
    case "step":
      return { text: `${H2}${htmlToText(s.headingHtml)}\nGoal: ${htmlToText(s.goalHtml)}` };
    case "range":
      return { text: missionsText(s.id) };
    default:
      return null;
  }
}

/** The terminal missions of one range: what is asked and the hints. Never the solution: it is code, and the tutor shouldn't hand it over. */
export function missionsText(rangeId: string): string {
  const range = RANGES[rangeId];
  if (!range) return "";
  return range.missions.map((m, i) => [`Terminal mission ${i + 1}, "${m.title}": ${m.brief}`, ...m.hints.map((h, n) => `Hint ${n + 1}: ${h}`), `After it: ${m.debrief}`].join("\n")).join("\n\n");
}

/** Cuts long text at paragraph breaks, then at line breaks, never mid-line unless one line is longer than a chunk. */
function pieces(text: string): string[] {
  if (text.length <= MAX_CHARS) return [text];
  const out: string[] = [];
  let current = "";
  for (const part of text.split(/\n{2,}/).flatMap((p) => (p.length > MAX_CHARS ? p.split("\n") : [p]))) {
    for (let rest = part; rest; rest = rest.slice(MAX_CHARS)) {
      const line = rest.slice(0, MAX_CHARS);
      if (current && current.length + line.length + 2 > MAX_CHARS) {
        out.push(current);
        current = "";
      }
      current = current ? `${current}\n\n${line}` : line;
    }
  }
  if (current) out.push(current);
  return out;
}

export interface Page {
  lang: Lang;
  href: string;
  kind: string;
  title: string;
}

/** Sections of one page (heading, then its blocks) as chunks. */
export function chunkBlocks(page: Page, blocks: Block[]): Chunk[] {
  const sections: { heading: string; blocks: Block[] }[] = [{ heading: "", blocks: [] }];
  for (const block of blocks) {
    for (const [i, part] of block.text.split(H2).entries()) {
      if (i > 0) {
        const [heading = "", ...rest] = part.split("\n");
        sections.push({ heading: heading.trim(), blocks: [] });
        if (rest.join("\n").trim()) sections.at(-1)?.blocks.push({ text: rest.join("\n").trim() });
      } else if (part.trim()) {
        sections.at(-1)?.blocks.push({ text: part.trim(), written: block.written });
      }
    }
  }
  const chunks: Chunk[] = [];
  for (const section of sections) {
    let text = "";
    let written: NonNullable<Chunk["written"]> = [];
    const close = () => {
      if (!text) return;
      const id = createHash("sha256").update([page.lang, page.href, section.heading, text].join("\n")).digest("hex").slice(0, 20);
      chunks.push({ id, ...page, heading: section.heading, text, ...(written.length ? { written } : {}) });
      text = "";
      written = [];
    };
    for (const block of section.blocks) {
      for (const piece of pieces(block.text)) {
        if (text && text.length + piece.length + 2 > MAX_CHARS) close();
        text = text ? `${text}\n\n${piece}` : piece;
      }
      if (block.written) written.push(block.written);
    }
    close();
  }
  return chunks;
}

export function chunkDoc(doc: Doc, base: string, lang: Lang): Chunk[] {
  const page: Page = { lang, href: `${base}${doc.meta.slug}/`, kind: doc.meta.kind, title: doc.meta.title };
  const blocks: Block[] = [{ text: doc.meta.summary }];
  for (const s of flatSegments(doc.segments)) {
    const block = blockOf(s);
    if (block?.text) blocks.push(block);
  }
  if (doc.terms.length) blocks.push({ text: `${H2}Glossary\n${doc.terms.map((t) => `${t.term}: ${t.definition}`).join("\n")}` });
  return chunkBlocks(page, blocks);
}
