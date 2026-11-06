"use client";

import Link from "next/link";
import { useState } from "react";
import type { Term } from "@/lib/types";

export function GlossaryList({ terms }: { terms: Term[] }) {
  const [q, setQ] = useState("");
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
