/** Shapes shared by the tutor's server code, its pages and the index builder. No Node or DOM APIs. */
import type { Lang } from "@/i18n/lang";

export const MODES = ["explain", "hint", "review", "quiz"] as const;
export type Mode = (typeof MODES)[number];
export const isMode = (v: unknown): v is Mode => typeof v === "string" && (MODES as readonly string[]).includes(v);

/** One piece of course text, small enough to hand to a model whole. */
export interface Chunk {
  /** A hash of everything below: a changed chunk is a new chunk, so its vector is rebuilt. */
  id: string;
  lang: Lang;
  /** The page it comes from, as an English-site path: "/courses/0047-x/". */
  href: string;
  kind: string;
  title: string;
  /** The `##` section it sits in, or "" before the first one. */
  heading: string;
  text: string;
  /** Written questions asked in this chunk. Their answers are graded against this section. */
  written?: { id: string; prompt: string }[];
}

export interface TutorIndex {
  version: 1;
  chunks: Chunk[];
}

export interface TutorMessage {
  id: number;
  role: "user" | "assistant";
  mode: Mode;
  content: string;
  createdAt: number;
}

export interface Source {
  title: string;
  href: string;
}

/** What the chat route streams, one JSON object per line. */
export type ChatEvent =
  | { type: "sources"; sources: Source[] }
  | { type: "delta"; text: string }
  | { type: "done"; message: TutorMessage }
  | { type: "error"; error: string };

export type Verdict = "correct" | "partial" | "incorrect";

export interface Grade {
  questionId: string;
  answer: string;
  verdict: Verdict;
  /** 0 to 100. */
  score: number;
  right: string[];
  missing: string[];
  feedback: string;
  model: string;
  createdAt: number;
}

export type Tier = "light" | "standard" | "strong";

export interface ModelChoice {
  name: string;
  /** Download size in GB, rounded. */
  gb: number;
  tier: Tier;
  use: "chat" | "code";
}

export interface InstalledModel {
  name: string;
  bytes: number;
}

export interface TutorSettings {
  host: string;
  chatModel: string;
  embedModel: string;
}

export interface IndexStatus {
  state: "missing-model" | "idle" | "running" | "ready" | "error";
  done: number;
  total: number;
  error?: string;
}

export interface TutorStatus {
  platform: string;
  ollama: { running: boolean; version: string | null };
  installed: InstalledModel[];
  settings: TutorSettings;
  hardware: { ramGb: number; tier: Tier };
  catalog: ModelChoice[];
  index: IndexStatus;
}

/** A line of Ollama's own pull stream, passed through as it arrives. */
export interface PullEvent {
  status?: string;
  /** The file being downloaded: a model is several. */
  digest?: string;
  total?: number;
  completed?: number;
  error?: string;
}
