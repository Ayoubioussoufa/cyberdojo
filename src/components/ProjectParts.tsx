"use client";

import Link from "next/link";
import { TOOLS } from "@/data/tools";
import { setCheck, useStore } from "@/lib/progress";
import { HELP_TEXT } from "@/data/help";
import type { HelpLevel } from "@/lib/types";


export function HelpBadge({ tool, level }: { tool: string; level: HelpLevel }) {
  const t = TOOLS[tool];
  return (
    <div className={`help-badge ${level}`}>
      <span className="help-tool">{t?.name ?? tool}</span>
      <span className="help-level">{HELP_TEXT[level].label}</span>
      {level !== "guided" && t?.first && <Link className="help-back" href={`/projects/${t.first}/`}>Taught in {t.first}</Link>}
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

export function ProjectMeter({ ids }: { ids: string[] }) {
  const store = useStore();
  const done = ids.filter((id) => store.checks[id]).length;
  return (
    <>
      <span className="meter small project-row-bar" aria-hidden="true"><i style={{ width: `${ids.length ? (done / ids.length) * 100 : 0}%` }} /></span>
      <span className="meta">{done} of {ids.length} checkpoints</span>
    </>
  );
}
