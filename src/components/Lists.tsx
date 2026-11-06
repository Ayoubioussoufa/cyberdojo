"use client";

import Link from "next/link";
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
            <Link href={`${base}${d.slug}/`} className={done ? "done" : ""}>
              <span className="row-mark" aria-hidden="true">{done ? "✓" : d.kind === "lesson" ? d.number : "•"}</span>
              <span className="row-main">
                <span className="row-title">{d.title}</span>
                <span className="row-sub">{d.summary}</span>
              </span>
              <span className="row-meta">{d.minutes} min</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
