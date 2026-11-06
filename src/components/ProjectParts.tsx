"use client";

import { setCheck, useStore } from "@/lib/progress";
import { TOOLS } from "@/data/tools";
import type { HelpLevel } from "@/lib/types";

export const HELP_TEXT: Record<HelpLevel, { label: string; text: string }> = {
  guided: { label: "First time: full walkthrough", text: "You haven't used this before, so every step is here." },
  recall: { label: "Second time: try from memory", text: "You've done this once. Try it first, and open the answer only if you're stuck." },
  solo: { label: "On your own", text: "You know this tool now, so no help is given. Go back to the project below if you need to." },
};

export function HelpBadge({ tool, level }: { tool: string; level: HelpLevel }) {
  const t = TOOLS[tool];
  const h = HELP_TEXT[level];
  return (
    <div className={`help-badge ${level}`}>
      <span className="help-tool">{t?.name ?? tool}</span>
      <span className="help-level">{h.label}</span>
      {level !== "guided" && t?.first && <a className="help-back" href={`/projects/${t.first}/`}>Taught in {t.first}</a>}
    </div>
  );
}

export function CheckBox({ id, html }: { id: string; html: string }) {
  const store = useStore();
  return (
    <label className="project-check">
      <input type="checkbox" checked={!!store.checks[id]} onChange={(e) => setCheck(id, e.target.checked)} />
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </label>
  );
}
