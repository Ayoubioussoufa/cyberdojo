/** Shared shapes for documents (lessons and guides) and their interactive parts. */

export interface Question {
  id: string;
  /** Plain text, for the copied message. */
  prompt: string;
  options: string[];
  correct: number;
  why: string;
  /** Rendered inline HTML. */
  promptHtml: string;
  optionsHtml: string[];
  whyHtml: string;
}

export interface Written {
  id: string;
  prompt: string;
  promptHtml: string;
}

export type Segment =
  | { kind: "html"; html: string }
  | { kind: "question"; question: Question }
  | { kind: "written"; written: Written }
  | { kind: "drill"; id: string }
  | { kind: "range"; id: string };

export interface TocEntry {
  id: string;
  text: string;
}

export interface Term {
  term: string;
  aliases: string[];
  definition: string;
  doc: string;
  docTitle: string;
  /** Where the term is taught. */
  href: string;
}

export type DocKind = "lesson" | "guide" | "machine" | "sheet";

export interface DocMeta {
  slug: string;
  kind: DocKind;
  number: number;
  title: string;
  summary: string;
  /** 0 = day zero, 1..24 = the roadmap's months. */
  month: number;
  minutes: number;
  builds?: string;
  source?: { label: string; url: string };
  words: string[];
  group?: string;
  /** Machines: how hard it is. */
  level?: string;
  questions: number;
}

export interface Doc {
  meta: DocMeta;
  segments: Segment[];
  toc: TocEntry[];
  questions: Question[];
  written: Written[];
  terms: Term[];
  /** Plain text of the body, for "explain this lesson". */
  text: string;
}

/** What the copy buttons need, without the whole document. */
export interface DocBrief {
  slug: string;
  kind: DocKind;
  title: string;
  summary: string;
  number: number;
  questions: Question[];
  written: Written[];
  words: string[];
}
