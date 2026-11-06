"use client";

import { HoverLink } from "./HoverLink";
import { useStore } from "@/lib/progress";
import type { DocMeta } from "@/lib/types";

export function DocRows({ docs, base }: { docs: DocMeta[]; base: string }) {
  const store = useStore();
  return (
    <ol className="rows">
      {docs.map((d) => {
        const done = !!store.done[d.slug];
        return (
          <li key={d.slug}>
            <HoverLink href={`${base}${d.slug}/`} className={done ? "done" : ""}>
              <span className="row-mark" aria-hidden="true">{done ? "✓" : d.kind === "lesson" ? d.number : "•"}</span>
              <span className="row-main">
                <span className="row-title">{d.title}</span>
                <span className="row-sub">{d.summary}</span>
              </span>
              <span className="row-meta">{d.minutes} min</span>
            </HoverLink>
          </li>
        );
      })}
    </ol>
  );
}
