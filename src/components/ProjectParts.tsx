"use client";

import Link from "@/components/HoverLink";
import { TOOLS } from "@/data/tools";
import { setCheck, useSlice, useStore } from "@/lib/progress";
import { helpText } from "@/data/help";
import { fill, useLang } from "@/i18n/LangProvider";
import type { HelpLevel } from "@/lib/types";


export function HelpBadge({ tool, level }: { tool: string; level: HelpLevel }) {
  const t = TOOLS[tool];
  const { lang, t: tr } = useLang();
  return (
    <div className={`help-badge ${level}`}>
      <span className="help-tool">{t?.name ?? tool}</span>
      <span className="help-level">{helpText(lang)[level].label}</span>
      {level !== "guided" && t?.first && <Link className="help-back" href={`/projects/${t.first}/`}>{fill(tr.misc.taughtIn, { id: t.first })}</Link>}
    </div>
  );
}

export function CheckBox({ id, html }: { id: string; html: string }) {
  const checked = useSlice((s) => !!s.checks[id]);
  return (
    <label className="project-check">
      <input type="checkbox" checked={checked} onChange={(e) => setCheck(id, e.target.checked)} />
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </label>
  );
}

export function ProjectMeter({ ids }: { ids: string[] }) {
  const store = useStore();
  const done = ids.filter((id) => store.checks[id]).length;
  const { t } = useLang();
  return (
    <>
      <span className="meter small project-row-bar" aria-hidden="true"><i style={{ width: `${ids.length ? (done / ids.length) * 100 : 0}%` }} /></span>
      <span className="meta">{fill(t.misc.checkpoints, { n: done, total: ids.length })}</span>
    </>
  );
}
