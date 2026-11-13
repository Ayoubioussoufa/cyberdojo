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

/** What this computer has to run a model with. */
export interface Hardware {
  ramGb: number;
  cores: number;
  /** The graphics card Ollama can use, or null when there is none it can rely on. */
  gpu: { name: string; vramGb: number; unified: boolean } | null;
  /** Free space where Ollama keeps models; null when it can't be read. */
  diskFreeGb: number | null;
}

/**
 * How a model would run here. fast: whole on the graphics card. ok: usable, a
 * few words a second or better. slow: it runs, but answers take minutes.
 * too-big: not enough memory at all.
 */
export type Fit = "fast" | "ok" | "slow" | "too-big";

export interface ModelChoice {
  name: string;
  /** Exact download size, read from Ollama's registry. */
  bytes: number;
  /** "9B", "4B active of 21B": the size people compare models by. */
  params: string;
  family: string;
}

export interface AdvisedModel extends ModelChoice {
  fit: Fit;
  /** Not enough free disk space to download it. */
  noRoom: boolean;
}

export interface InstalledModel {
  name: string;
  bytes: number;
}

export interface TutorSettings {
  host: string;
  chatModel: string;
  embedModel: string;
  /** "1" once the learner has seen the setup page, so the app stops opening on it. */
  welcomed: string;
}

/** One part of a setup job: install Ollama, start it, or download one model. */
export interface JobStep {
  kind: "install" | "start" | "pull";
  model?: string;
  state: "waiting" | "running" | "done" | "failed" | "cancelled";
  /** Bytes for a download, 0 and 0 for a step with no size. */
  done: number;
  total: number;
  error?: string;
}

/** The setup that runs in the background, so leaving the page doesn't stop a download. */
export interface SetupJob {
  id: number;
  state: "running" | "done" | "failed" | "cancelled";
  steps: JobStep[];
  /** The chat model to switch to when everything is in place. */
  use?: string;
  startedAt: number;
}

export interface IndexStatus {
  state: "missing-model" | "idle" | "running" | "ready" | "error";
  done: number;
  total: number;
  error?: string;
}

export interface OllamaState {
  running: boolean;
  version: string | null;
  /** How Ollama is installed here, if it is: its desktop app, a command-line program, or the copy this app installed. */
  found: "app" | "cli" | "managed" | null;
  /** The address is on this computer, so the app can start or install Ollama itself. */
  local: boolean;
  /** This system has an automatic install. */
  canInstall: boolean;
  /** Size of that install's download, once the release has been looked up. */
  installBytes: number | null;
}

export interface TutorStatus {
  platform: string;
  ollama: OllamaState;
  installed: InstalledModel[];
  /** Models loaded in memory right now, and the share of each on the graphics card (0 to 1). */
  loaded: { name: string; gpu: number }[];
  settings: TutorSettings;
  hardware: Hardware;
  catalog: AdvisedModel[];
  /** The catalog model that suits this computer best, or null when none fits. */
  recommended: string | null;
  embedBytes: number;
  index: IndexStatus;
  job: SetupJob | null;
}

/** One conversation with the tutor on its own page, not tied to a lesson. */
export interface Thread {
  /** The key its messages are saved under: "/tutor/chat/<id>/". */
  href: string;
  title: string;
  updatedAt: number;
  count: number;
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
