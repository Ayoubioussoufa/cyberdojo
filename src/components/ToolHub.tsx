"use client";

import Link from "@/components/HoverLink";
import { useState } from "react";
import type { ToolCat } from "@/data/toolcats";

interface Tool {
  slug: string;
  title: string;
  summary: string;
  cat: string;
  side: string;
  aka: string[];
}

const SIDES: Record<string, string> = { attack: "attack", defence: "defence", both: "both" };

/** Every tool by category, with a filter that matches names and summaries. */
export function ToolHub({ tools, cats }: { tools: Tool[]; cats: ToolCat[] }) {
  const [q, setQ] = useState("");
  const [side, setSide] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = tools.filter(
    (t) => (!side || t.side === side) && (!needle || [t.title, t.summary, ...t.aka].some((s) => s.toLowerCase().includes(needle))),
  );
  return (
    <>
      <div className="tool-filter">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter tools by name or job" aria-label="Filter tools" />
        <select value={side} onChange={(e) => setSide(e.target.value)} aria-label="Filter by side">
          <option value="">Attack and defence</option>
          <option value="attack">Attack</option>
          <option value="defence">Defence</option>
          <option value="both">Both</option>
        </select>
      </div>
      <p className="muted">{shown.length} of {tools.length} tools</p>
      {cats.map((c) => {
        const mine = shown.filter((t) => t.cat === c.folder);
        if (!mine.length) return null;
        return (
          <section key={c.folder} className="module-domain">
            <h2>{c.title}</h2>
            <p className="muted">{c.blurb}</p>
            <ul className="module-list">
              {mine.map((t) => (
                <li key={t.slug}>
                  <Link href={`/tools/${t.slug}/`}>{t.title}</Link>
                  <span className="module-level">{SIDES[t.side] ?? t.side}</span>
                  <span className="muted">{t.summary}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
