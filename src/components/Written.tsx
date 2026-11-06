"use client";

import { setWritten, useSlice } from "@/lib/progress";
import type { Written } from "@/lib/types";

export function WrittenCard({ w }: { w: Written }) {
  const text = useSlice((s) => s.written[w.id] ?? "");
  return (
    <label className="wcard">
      <span className="qcard-tag">In your own words</span>
      <span className="wcard-prompt noterms" dangerouslySetInnerHTML={{ __html: w.promptHtml }} />
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setWritten(w.id, e.target.value)}
        placeholder="Write it before you look anything up. Wrong is fine: it goes to your AI tutor for correction."
      />
    </label>
  );
}
