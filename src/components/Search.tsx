"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

interface Hit {
  title: string;
  sub: string;
  kind: string;
  href: string;
}

const LIMIT = 12;

/** Title matches beat summary matches, and the start of a title beats the middle. */
function rank(hit: Hit, words: string[]): number {
  const title = hit.title.toLowerCase();
  const sub = hit.sub.toLowerCase();
  let score = 0;
  for (const w of words) {
    if (title === w) score += 100;
    else if (title.startsWith(w)) score += 40;
    else if (title.includes(` ${w}`)) score += 25;
    else if (title.includes(w)) score += 15;
    else if (sub.includes(w)) score += 4;
    else return 0;
  }
  return score + (hit.kind === "Term" ? 0 : 3);
}

export function Search() {
  const router = useRouter();
  const box = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [all, setAll] = useState<Hit[] | null>(null);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);

  const open = () => {
    box.current?.showModal();
    input.current?.select();
    if (!all) void fetch("/data/search.json").then((r) => r.json() as Promise<Hit[]>).then(setAll);
  };
  const close = () => box.current?.close();

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (box.current?.open) close();
        else open();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all]);

  const hits = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!all || words.length === 0) return [];
    return all
      .map((h) => ({ h, s: rank(h, words) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.h.title.length - b.h.title.length)
      .slice(0, LIMIT)
      .map((x) => x.h);
  }, [all, q]);

  const go = (hit?: Hit) => {
    if (!hit) return;
    close();
    setQ("");
    router.push(hit.href);
  };

  return (
    <>
      <button type="button" className="search-open" onClick={open} aria-label="Search the course">
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        <kbd>Ctrl K</kbd>
      </button>
      <dialog ref={box} className="palette" aria-label="Search the course" onClick={(e) => e.target === box.current && close()}>
        <input
          ref={input}
          value={q}
          placeholder="Search lessons, challenges, terms…"
          aria-label="Search"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setQ(e.target.value);
            setAt(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setAt((n) => Math.min(n + 1, hits.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setAt((n) => Math.max(n - 1, 0));
            } else if (e.key === "Enter") {
              go(hits[at]);
            }
          }}
        />
        {q.trim() && (hits.length > 0 ? (
          <ul>
            {hits.map((h, i) => (
              <li key={`${h.kind}${h.href}${h.title}`}>
                <a href={h.href} aria-selected={i === at} onClick={(e) => { e.preventDefault(); go(h); }} onMouseEnter={() => setAt(i)}>
                  <span>{h.title}</span>
                  <span className="pal-kind">{h.kind}</span>
                  <span className="pal-sub">{h.sub}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : <p className="pal-none">{all ? "Nothing matches that." : "Loading…"}</p>)}
      </dialog>
    </>
  );
}
