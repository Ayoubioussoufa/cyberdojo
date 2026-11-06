/** The shape of saved progress. Separate so that server code can import it. */
export interface Card {
  box: number;
  /** yyyy-mm-dd. */
  due: string;
}

export interface Store {
  picks: Record<string, number>;
  /** Question id → the first answer was right. */
  first: Record<string, boolean>;
  written: Record<string, string>;
  words: Record<string, string>;
  done: Record<string, string>;
  srs: Record<string, Card>;
  missions: Record<string, string>;
  gates: Record<string, boolean>;
  skills: Record<string, number>;
  /** Drill id → best share right, rounds played. */
  drills: Record<string, { best: number; plays: number }>;
  /** Drill id → rows already dealt, so each round shows new ones first. */
  seen: Record<string, number[]>;
  /** Wrong answers, saved to retry. Newest first. */
  mistakes: Mistake[];
  /** yyyy-mm-dd → things done that day, for the streak and the calendar. */
  days: Record<string, number>;
  /** Project checkpoint → the day it was ticked. */
  checks: Record<string, string>;
  /** Project step → its walkthrough is switched on. Off unless the learner asks. */
  walk: Record<string, boolean>;
  /** Hours a week, and the day she started. */
  plan: { hours: number; start: string } | null;
}

export interface Mistake {
  key: string;
  source: string;
  prompt: string;
  right: string;
  given: string;
  why: string;
  /** The options, when it was multiple choice. */
  options?: string[];
  date: string;
}
