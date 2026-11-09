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
  | { kind: "range"; id: string }
  /** A project checkpoint she ticks off. */
  | { kind: "check"; id: string; html: string }
  /** How much help this tool gets here. */
  | { kind: "help"; tool: string; level: HelpLevel }
  /** One project step: the task stays visible, and the walkthrough is opt-in. */
  | StepSegment;

export interface DocLink {
  label: string;
  href: string;
}

export interface StepSegment {
  kind: "step";
  n: number;
  headingHtml: string;
  goalHtml: string;
  tools: { tool: string; level: HelpLevel }[];
  /** Legal and safety notices. Never hidden behind the walkthrough. */
  notices: string[];
  docs: DocLink[];
  search: string[];
  /** The walkthrough. */
  body: Segment[];
  /** Checkpoints and questions: always available. */
  after: Segment[];
}

export type HelpLevel = "guided" | "recall" | "solo";

export interface ToolUse {
  tool: string;
  level: HelpLevel;
  step: number;
}

export interface Check {
  id: string;
  step: number;
  text: string;
}

export interface TocEntry {
  id: string;
  text: string;
}

export interface Term {
  /** In a translation: the English term's name, so progress on it is shared. */
  key?: string;
  term: string;
  aliases: string[];
  definition: string;
  doc: string;
  docTitle: string;
  /** Where the term is taught. */
  href: string;
}

export type DocKind = "lesson" | "guide" | "machine" | "sheet" | "project" | "module" | "tool";

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
  /** Machines: how hard it is. Modules: foundation, intermediate or advanced. */
  level?: string;
  /** Modules: the domain folder's number, such as "01". */
  domain?: string;
  /** Modules: which side of the fight it mostly teaches. */
  side?: string;
  /** Modules: ATT&CK technique IDs. */
  attack?: string[];
  /** Modules: slugs to read first, lessons or modules. */
  needs?: string[];
  /** Modules: the matching attack or defence modules. Must link both ways. */
  pair?: string[];
  /** Modules: the wider topic when one was split, such as "Active Directory attacks, part 2 of 4". */
  series?: string;
  /** Tools: the folder it sits in, such as "01-recon-osint". */
  category?: string;
  /** Tools: open, own or know. See src/data/toolcats.ts. */
  use?: string;
  /** Tools: official documentation. */
  docs?: string;
  /** Tools: other names people search for. */
  aka?: string[];
  /** Tools: similar tools. */
  alt?: string[];
  /** Tools: the Kali package, when it has one. */
  kali?: string;
  /** Projects: how the steps split across the roadmap. */
  parts?: { from: number; to: number; hours: number }[];
  /** Projects: rough total hours. */
  hours?: number;
  /** Projects: what was really run while writing the page. */
  tested?: string;
  questions: number;
  /** The language this copy is written in. On the French site, "en" means no translation yet. */
  lang?: "en" | "fr";
}

export interface Doc {
  meta: DocMeta;
  segments: Segment[];
  toc: TocEntry[];
  questions: Question[];
  written: Written[];
  terms: Term[];
  checks: Check[];
  tools: ToolUse[];
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
