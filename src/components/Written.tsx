"use client";

import { setWritten, useStore } from "@/lib/progress";
import type { Written } from "@/lib/types";

export function WrittenCard({ w }: { w: Written }) {
  const store = useStore();
  return (
    <label className="wcard">
      <span className="qcard-tag">In your own words</span>
      <span className="wcard-prompt noterms" dangerouslySetInnerHTML={{ __html: w.promptHtml }} />
      <textarea
        rows={3}
        value={store.written[w.id] ?? ""}
        onChange={(e) => setWritten(w.id, e.target.value)}
        placeholder="Write it before you look anything up. Wrong is fine: it goes to your AI tutor for correction."
      />
    </label>
  );
}
