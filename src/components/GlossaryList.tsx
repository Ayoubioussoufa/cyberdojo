"use client";

import Link from "@/components/HoverLink";
import { useEffect, useState } from "react";
import type { Term } from "@/lib/types";

export function GlossaryList() {
  const [terms, setTerms] = useState<Term[] | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    let live = true;
    void fetch("/data/terms.json").then((r) => r.json() as Promise<Term[]>).then((all) => {
      if (live) setTerms(all);
    });
    return () => {
      live = false;
    };
  }, []);
  if (!terms) return <p className="muted" aria-busy="true">Loading the glossary…</p>;
  const needle = q.trim().toLowerCase();
  const shown = needle ? terms.filter((t) => `${t.term} ${t.aliases.join(" ")} ${t.definition}`.toLowerCase().includes(needle)) : terms;
  return (
    <>
      <input className="search" type="search" placeholder={`Search ${terms.length} terms`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the glossary" />
      <dl className="gloss">
        {shown.map((t) => (
          <div key={t.term}>
            <dt>{t.term}{t.aliases.length > 0 && <small>{t.aliases.join(", ")}</small>}</dt>
            <dd>{t.definition} <Link href={t.href}>{t.docTitle}</Link></dd>
          </div>
        ))}
      </dl>
      {shown.length === 0 && <p className="muted">Nothing matches. Ask your AI tutor, then check its answer against a primary source.</p>}
    </>
  );
}
