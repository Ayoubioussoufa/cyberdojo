"use client";

import { GradeBox } from "./tutor/GradeBox";
import { DESKTOP } from "@/lib/desktop";
import { setWritten, useSlice } from "@/lib/progress";
import type { Written } from "@/lib/types";
import { useLang } from "@/i18n/LangProvider";

export function WrittenCard({ w }: { w: Written }) {
  const text = useSlice((s) => s.written[w.id] ?? "");
  const { t } = useLang();
  return (
    <>
      <label className="wcard">
        <span className="qcard-tag">{t.question.own}</span>
        <span className="wcard-prompt noterms" dangerouslySetInnerHTML={{ __html: w.promptHtml }} />
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setWritten(w.id, e.target.value)}
          placeholder={t.question.ownHolder}
        />
      </label>
      {DESKTOP && <GradeBox id={w.id} />}
    </>
  );
}
