"use client";

import { useEffect, useRef, useState } from "react";
import type { Term } from "@/lib/types";

const SKIP = new Set(["CODE", "PRE", "A", "H1", "H2", "H3", "TH", "BUTTON", "TEXTAREA", "INPUT", "KBD", "SCRIPT"]);

/**
 * Underlines the first use of each glossary term in the document, and shows
 * its definition on hover, focus or tap, so nothing is ever left unexplained.
 */
export function Terms({ terms, scope }: { terms: Term[]; scope: string }) {
  const [tip, setTip] = useState<{ title: string; text: string; x: number; y: number; above: boolean } | null>(null);
  const done = useRef(false);

  useEffect(() => {
    const root = document.querySelector(scope);
    if (!root || done.current) return;
    done.current = true;
    const names = terms
      .flatMap((t) => [t.term, ...t.aliases].map((name) => ({ name, t })))
      .sort((a, b) => b.name.length - a.name.length);
    const seen = new Set<string>();
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
    for (const node of nodes) {
      let cur: Text | null = node;
      for (const { name, t } of names) {
        if (!cur || seen.has(t.term)) continue;
        const safe = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const m = new RegExp(`(^|[^A-Za-z0-9-])(${safe})(?![A-Za-z0-9-])`, /[A-Z]{2}/.test(name) ? "" : "i").exec(cur.data);
        if (!m) continue;
        const at = m.index + (m[1] as string).length;
        const hit = cur.splitText(at);
        const rest = hit.splitText((m[2] as string).length);
        const span = document.createElement("span");
        span.className = "term";
        span.tabIndex = 0;
        span.dataset.title = t.term;
        span.dataset.def = t.definition;
        hit.parentNode?.replaceChild(span, hit);
        span.appendChild(hit);
        seen.add(t.term);
        cur = rest;
      }
    }
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
