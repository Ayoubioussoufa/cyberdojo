import type { Lang } from "@/i18n/lang";
import { UI } from "@/i18n/ui";

/** How the parts of the site fit together: the picture at the heart of the tour. */
export function SiteMap({ lang = "en" }: { lang?: Lang }) {
  const t = UI[lang].sitemap;
  const box = (x: number, y: number, title: string, line: string, strong = false) => (
    <g key={title}>
      <rect x={x} y={y} width="150" height="62" rx="9" className={strong ? "sm-box strong" : "sm-box"} />
      <text x={x + 75} y={y + 26} className="sm-title" textAnchor="middle">{title}</text>
      <text x={x + 75} y={y + 46} className="sm-line" textAnchor="middle">{line}</text>
    </g>
  );
  const arrow = (x1: number, y1: number, x2: number, y2: number) => <path key={`${x1}${y1}${x2}`} d={`M${x1} ${y1} L${x2} ${y2}`} className="sm-arrow" markerEnd="url(#sm-head)" />;
  return (
    <figure className="sitemap">
      <svg viewBox="0 0 700 300" role="img" aria-label={t.label}>
        <defs>
          <marker id="sm-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" className="sm-head" /></marker>
        </defs>
        {box(275, 10, t.roadmap, t.roadmapLine, true)}
        {box(10, 118, t.lessons, t.lessonsLine)}
        {box(190, 118, t.practice, t.practiceLine)}
        {box(370, 118, t.projects, t.projectsLine)}
        {box(540, 118, t.gate, t.gateLine)}
        {box(275, 226, t.library, t.libraryLine)}
        {arrow(310, 72, 95, 116)}
        {arrow(340, 72, 275, 116)}
        {arrow(370, 72, 440, 116)}
        {arrow(405, 72, 605, 116)}
        {arrow(160, 149, 188, 149)}
        {arrow(340, 149, 368, 149)}
        {arrow(520, 149, 538, 149)}
      </svg>
    </figure>
  );
}
