"use client";

import { fill, useLang } from "@/i18n/LangProvider";
import { useState } from "react";

export interface Group {
  title: string;
  items: { name: string; use: string; cost: string; when: string; url: string | null }[];
}

export function ResourceList({ groups }: { groups: Group[] }) {
  const [q, setQ] = useState("");
  const { lang, t } = useLang();
  const needle = q.trim().toLowerCase();
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <>
      <input className="search" type="search" placeholder={fill(t.misc.searchResources, { n: total })} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t.misc.searchResourcesLabel} />
      {groups.map((g) => {
        const items = needle ? g.items.filter((i) => `${i.name} ${i.use}`.toLowerCase().includes(needle)) : g.items;
        if (!items.length) return null;
        return (
          <section key={g.title} className="phase-block" lang={lang === "en" ? undefined : "en"}>
            <h2 className="phase-h">{g.title}</h2>
            <ul className="res">
              {items.map((i) => (
                <li key={i.name}>
                  <div>
                    {i.url ? <a href={i.url} target="_blank" rel="noreferrer">{i.name}</a> : <strong>{i.name}</strong>}
                    <p>{i.use}</p>
                  </div>
                  <span className="res-meta"><b>{i.cost}</b>{i.when}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
