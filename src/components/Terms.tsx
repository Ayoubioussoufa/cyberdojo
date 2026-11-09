"use client";

import { useEffect, useRef, useState } from "react";
import type { Term } from "@/lib/types";

const SKIP = new Set(["CODE", "PRE", "A", "H1", "H2", "H3", "TH", "BUTTON", "TEXTAREA", "INPUT", "KBD", "SCRIPT"]);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * All the names go into one pattern, so each text node is scanned once however
 * many terms the page has. Names with two capitals in a row (TCP, SQLi) must
 * match case exactly, so that "tar" in a sentence isn't the TAR acronym.
 */
function underline(root: Element, terms: Term[]) {
  const byName = new Map<string, Term>();
  for (const t of terms) for (const name of [t.term, ...t.aliases]) if (name && !byName.has(name.toLowerCase())) byName.set(name.toLowerCase(), t);
  if (byName.size === 0) return;
  const exact = new Map<string, string>();
  for (const t of terms) for (const name of [t.term, ...t.aliases]) if (/[A-Z]{2}/.test(name)) exact.set(name.toLowerCase(), name);
  const names = [...byName.keys()].sort((a, b) => b.length - a.length).map(escapeRe);
  // Letters in any script count as a word edge, so French accents don't split words.
  const re = new RegExp(`(?<![\\p{L}\\p{N}-])(?:${names.join("|")})(?![\\p{L}\\p{N}-])`, "giu");

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      for (let p = n.parentElement; p && p !== root; p = p.parentElement) {
        if (SKIP.has(p.tagName) || p.classList.contains("term") || p.classList.contains("noterms")) return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);

  const seen = new Set<string>();
  for (const node of nodes) {
    const hits: { at: number; len: number; t: Term }[] = [];
    for (const m of node.data.matchAll(re)) {
      const key = m[0].toLowerCase();
      const t = byName.get(key);
      const must = exact.get(key);
      if (!t || seen.has(t.term) || (must && must !== m[0])) continue;
      seen.add(t.term);
      hits.push({ at: m.index, len: m[0].length, t });
    }
    // Last hit first: splitting moves everything after the split point.
    for (const { at, len, t } of hits.reverse()) {
      const hit = node.splitText(at);
      hit.splitText(len);
      const span = document.createElement("span");
      span.className = "term";
      span.tabIndex = 0;
      span.dataset.title = t.term;
      span.dataset.def = t.definition;
      hit.parentNode?.replaceChild(span, hit);
      span.appendChild(hit);
    }
  }
}

/**
 * Underlines the first use of each glossary term in the document, and shows
 * its definition on hover, focus or tap, so nothing is ever left unexplained.
 */
export function Terms({ terms, scope }: { terms: Term[]; scope: string }) {
  const [tip, setTip] = useState<{ title: string; text: string; x: number; y: number; above: boolean } | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current || terms.length === 0) return;
    const mark = () => {
      const root = document.querySelector(scope);
      if (!root || done.current) return;
      done.current = true;
      underline(root, terms);
    };
    const idle = window.requestIdleCallback;
    if (idle) {
      const job = idle(mark, { timeout: 1000 });
      return () => window.cancelIdleCallback(job);
    }
    const job = window.setTimeout(mark, 200);
    return () => window.clearTimeout(job);
  }, [terms, scope]);

  useEffect(() => {
    const show = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const x = Math.min(Math.max(r.left + r.width / 2, 170), window.innerWidth - 170);
      const above = r.top > 180;
      setTip({ title: el.dataset.title ?? "", text: el.dataset.def ?? "", x, y: above ? r.top - 8 : r.bottom + 8, above });
    };
    const over = (e: Event) => {
      const el = (e.target as Element).closest?.(".term") as HTMLElement | null;
      if (el) show(el);
    };
    const out = (e: Event) => {
      if ((e.target as Element).closest?.(".term")) setTip(null);
    };
    const hide = () => setTip(null);
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);
    document.addEventListener("focusin", over);
    document.addEventListener("focusout", out);
    window.addEventListener("scroll", hide, { passive: true });
    return () => {
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
      document.removeEventListener("focusin", over);
      document.removeEventListener("focusout", out);
      window.removeEventListener("scroll", hide);
    };
  }, []);

  if (!tip) return null;
  return (
    <div className={`tip${tip.above ? " above" : ""}`} style={{ left: tip.x, top: tip.y }} role="tooltip">
      <strong>{tip.title}</strong>
      <span>{tip.text}</span>
    </div>
  );
}
