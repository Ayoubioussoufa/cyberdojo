"use client";

import { useLang } from "@/i18n/LangProvider";
import Link from "@/components/HoverLink";
import { HelpBadge } from "./ProjectParts";
import { setWalk, useSlice } from "@/lib/progress";
import type { StepSegment } from "@/lib/types";

const searchUrl = (q: string) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;

/**
 * One project step. The goal, documentation and checkpoint are always there. The
 * walkthrough starts off in every step, so a learner tries first and copies only
 * if they choose to. It stays in the page while hidden, so that glossary terms
 * and copy buttons are ready the moment it opens.
 */
export function ProjectStep({ slug, step, walkthrough, after }: { slug: string; step: StepSegment; walkthrough: React.ReactNode; after: React.ReactNode }) {
  const key = `${slug}:${step.n}`;
  const on = useSlice((s) => !!s.walk[key]);
  const region = `walkthrough-${step.n}`;
  const { t } = useLang();
  const S = t.pstep;
  return (
    <section className="pstep">
      <div className="prose" dangerouslySetInnerHTML={{ __html: step.headingHtml }} />
      <div className="pstep-goal">
        <p className="pstep-label">{S.goal}</p>
        <p dangerouslySetInnerHTML={{ __html: step.goalHtml }} />
      </div>
      {step.tools.length > 0 && <div className="pstep-tools">{step.tools.map((t) => <HelpBadge key={t.tool} tool={t.tool} level={t.level} />)}</div>}
      {step.notices.map((html, i) => <div key={i} className="prose" dangerouslySetInnerHTML={{ __html: html }} />)}
      <div className="pstep-look noterms">
        <div>
          <p className="pstep-label">{S.docs}</p>
          <ul>
            {step.docs.map((d) => (
              <li key={d.href}>{d.href.startsWith("/") ? <Link href={d.href}>{d.label}</Link> : <a href={d.href} target="_blank" rel="noreferrer">{d.label}</a>}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="pstep-label">{S.search}</p>
          <ul>
            {step.search.map((q) => <li key={q}><a href={searchUrl(q)} target="_blank" rel="noreferrer">{q}</a></li>)}
          </ul>
        </div>
      </div>
      <div className="pstep-switch">
        <button type="button" role="switch" aria-checked={on} aria-controls={region} className="switch" onClick={() => setWalk(key, !on)}>
          <span className="switch-track" aria-hidden="true"><i /></span>
          <span>{S.walk}</span>
        </button>
        <span className="muted">{on ? S.on : S.off}</span>
      </div>
      <div id={region} className="pstep-walk" hidden={!on}>{walkthrough}</div>
      {after}
    </section>
  );
}
