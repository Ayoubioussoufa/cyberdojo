import type { HelpLevel } from "@/lib/types";

/** Plain data, so that server pages and client components can both read it. */
export const HELP_TEXT: Record<HelpLevel, { label: string; short: string; text: string }> = {
  guided: { label: "First time: walkthrough available", short: "Walkthrough available", text: "You haven't used this before, so this step has a full walkthrough. Switch it on when you need it." },
  recall: { label: "Second time: try from memory", short: "From memory", text: "You've done this once. Try it first, and open the answer only if you're stuck." },
  solo: { label: "On your own", short: "On your own", text: "You know this now, so no help is given." },
};

export const HELP_TEXT_FR: typeof HELP_TEXT = {
  guided: { label: "Première fois : solution guidée disponible", short: "Solution guidée disponible", text: "Vous n'avez jamais utilisé cet outil, donc cette étape a une solution guidée complète. Activez-la quand vous en avez besoin." },
  recall: { label: "Deuxième fois : essayez de mémoire", short: "De mémoire", text: "Vous l'avez déjà fait une fois. Essayez d'abord, et n'ouvrez la réponse que si vous êtes bloqué." },
  solo: { label: "En autonomie", short: "En autonomie", text: "Vous le maîtrisez maintenant, donc aucune aide n'est donnée." },
};

export const helpText = (lang: "en" | "fr") => (lang === "fr" ? HELP_TEXT_FR : HELP_TEXT);
