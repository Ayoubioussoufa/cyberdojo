"use client";

import { fill, useLang } from "@/i18n/LangProvider";
import { catText } from "@/data/toolcats";
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


/** Every tool by category, with a filter that matches names and summaries. */
export function ToolHub({ tools, cats }: { tools: Tool[]; cats: ToolCat[] }) {
  const [q, setQ] = useState("");
  const [side, setSide] = useState("");
  const { lang, t } = useLang();
  const T = t.toolHub;
  const sides: Record<string, string> = { attack: T.attack, defence: T.defence, both: T.both };
  const needle = q.trim().toLowerCase();
  const shown = tools.filter(
    (x) => (!side || x.side === side) && (!needle || [x.title, x.summary, ...x.aka].some((s) => s.toLowerCase().includes(needle))),
  );
  return (
    <>
      <div className="tool-filter">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T.filter} aria-label={T.filterLabel} />
        <select value={side} onChange={(e) => setSide(e.target.value)} aria-label={T.side}>
          <option value="">{T.all}</option>
          <option value="attack">{T.attackCap}</option>
          <option value="defence">{T.defenceCap}</option>
          <option value="both">{T.bothCap}</option>
        </select>
      </div>
      <p className="muted">{fill(T.count, { n: shown.length, total: tools.length })}</p>
      {cats.map((c) => {
        const mine = shown.filter((x) => x.cat === c.folder);
        if (!mine.length) return null;
        return (
          <section key={c.folder} className="module-domain">
            <h2>{catText(c, lang).title}</h2>
            <p className="muted">{catText(c, lang).blurb}</p>
            <ul className="module-list">
              {mine.map((x) => (
                <li key={x.slug}>
                  <Link href={`/tools/${x.slug}/`}>{x.title}</Link>
                  <span className="module-level">{sides[x.side] ?? x.side}</span>
                  <span className="muted">{x.summary}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
