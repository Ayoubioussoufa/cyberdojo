"use client";

import { fill, useLang } from "@/i18n/LangProvider";
import { localize } from "@/i18n/lang";
import Link from "@/components/HoverLink";
import { useEffect, useState } from "react";
import type { Term } from "@/lib/types";

export function GlossaryList() {
  const [terms, setTerms] = useState<Term[] | null>(null);
  const [q, setQ] = useState("");
  const { lang, t } = useLang();
  useEffect(() => {
    let live = true;
    void fetch(localize("/data/terms.json", lang)).then((r) => r.json() as Promise<Term[]>).then((all) => {
      if (live) setTerms(all);
    });
    return () => {
      live = false;
    };
  }, [lang]);
  if (!terms) return <p className="muted" aria-busy="true">{t.cards.loading}</p>;
  const needle = q.trim().toLowerCase();
  const shown = needle ? terms.filter((t) => `${t.term} ${t.aliases.join(" ")} ${t.definition}`.toLowerCase().includes(needle)) : terms;
  return (
    <>
      <input className="search" type="search" placeholder={fill(t.misc.searchTerms, { n: terms.length })} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t.misc.searchGlossary} />
      <dl className="gloss">
        {shown.map((t) => (
          <div key={t.term}>
            <dt>{t.term}{t.aliases.length > 0 && <small>{t.aliases.join(", ")}</small>}</dt>
            <dd>{t.definition} <Link href={t.href}>{t.docTitle}</Link></dd>
          </div>
        ))}
      </dl>
      {shown.length === 0 && <p className="muted">{t.misc.noTerm}</p>}
    </>
  );
}
