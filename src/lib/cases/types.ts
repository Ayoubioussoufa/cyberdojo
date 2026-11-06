/** A case file: a story that branches on your decisions. */
export interface Choice {
  label: string;
  to: string;
  /** Why this was a good or bad call. Shown at once. */
  note: string;
  /** Change to the score: positive for good calls. */
  score: number;
}

export interface CaseNode {
  id: string;
  /** Where you are in the story. {name} fills in from the vars. */
  text: string;
  /** A log, an email or a chat message to read. */
  evidence?: string;
  choices?: Choice[];
  /** An ending. */
  end?: "good" | "mixed" | "bad";
}

export interface CaseFile {
  id: string;
  title: string;
  role: string;
  blurb: string;
  month: number;
  minutes: number;
  /** Details that change each time. */
  vars: Record<string, string[]>;
  start: string;
  nodes: CaseNode[];
  /** What an expert would have done, shown at the end. */
  debrief: string;
  lesson: string;
}
