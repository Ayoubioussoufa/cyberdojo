import type { HelpLevel } from "@/lib/types";

/** Plain data, so that server pages and client components can both read it. */
export const HELP_TEXT: Record<HelpLevel, { label: string; short: string; text: string }> = {
  guided: { label: "First time: full walkthrough", short: "Full walkthrough", text: "You haven't used this before, so every step is explained." },
  recall: { label: "Second time: try from memory", short: "From memory", text: "You've done this once. Try it first, and open the answer only if you're stuck." },
  solo: { label: "On your own", short: "On your own", text: "You know this now, so no help is given." },
};
