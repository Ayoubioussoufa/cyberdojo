import type { Rng } from "@/lib/rng";
import type { Shell } from "@/lib/shell/shell";

export interface Built {
  shell: Shell;
  flag?: string;
  /** Whatever a world's own tools record, for grading. */
  state?: Record<string, unknown>;
}

export interface Mission {
  id: string;
  title: string;
  /** Backticks render as code. */
  brief: string;
  greeting?: string;
  hints: string[];
  build: (rng: Rng) => Built;
  passed: (w: Built, cmd: string) => boolean;
  /** The reference solution, used only by scripts/check-missions.ts. */
  solve: (w: Built) => string[];
  debrief: string;
}

export interface RangeSet {
  title: string;
  missions: Mission[];
}

export const flagFrom = (rng: Rng) =>
  `CD{${Array.from({ length: 10 }, () => "abcdefghjkmnpqrstuvwxyz23456789"[rng.int(0, 30)]).join("")}}`;

export const submitted = (w: Built) => w.flag !== undefined && w.shell.submitted.includes(w.flag);
