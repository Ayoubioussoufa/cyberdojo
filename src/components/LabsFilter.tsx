"use client";

import { fill, useLang } from "@/i18n/LangProvider";
import { useRef, useState, type ReactNode } from "react";

/**
 * Narrows the hands-on index as you type: a topic ("kerberos"), a platform
 * ("pwn.college") or a kind ("attack"). The list is rendered on the server;
 * this only hides rows, so it works the same with the filter left empty.
 */
export function LabsFilter({ total, children }: { total: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(total);
  const { t } = useLang();

  const filter = (q: string) => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const root = box.current;
    if (!root) return;
    let n = 0;
    root.querySelectorAll<HTMLElement>("[data-text]").forEach((row) => {
      const hit = words.every((w) => (row.dataset.text ?? "").includes(w));
      row.hidden = !hit;
      if (hit) n++;
    });
    // A group with no rows left disappears, and so does its heading.
    root.querySelectorAll<HTMLElement>("[data-group]").forEach((g) => {
      g.hidden = !g.querySelector("[data-text]:not([hidden])");
    });
    setShown(n);
  };

  return (
    <>
      <div className="labs-filter">
        <label htmlFor="labs-q">{t.misc.labsFilter}</label>
        <input id="labs-q" type="search" placeholder={t.misc.labsHolder} autoComplete="off" spellCheck={false} onChange={(e) => filter(e.target.value)} />
        <p className="meta" role="status">{shown === total ? fill(t.misc.labsAll, { n: total }) : fill(t.misc.labsSome, { n: shown, total })}</p>
      </div>
      <div ref={box}>{children}</div>
    </>
  );
}
