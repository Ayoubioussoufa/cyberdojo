"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fill, useLang } from "@/i18n/LangProvider";
import { splitLang } from "@/i18n/lang";
import { say } from "@/i18n/ui";
import { useSlice } from "@/lib/progress";
import { getGrade, gradeAnswer } from "@/lib/tutor-client";
import type { Grade } from "@/lib/tutor-types";

/** Under a written question in the desktop app: the tutor grades the answer against the section, and the grade is kept. */
export function GradeBox({ id }: { id: string }) {
  const { lang, t } = useLang();
  const page = splitLang(usePathname()).path;
  const answer = useSlice((s) => s.written[id] ?? "");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    void getGrade(id).then((g) => current && setGrade(g));
    return () => {
      current = false;
    };
  }, [id]);

  const run = async () => {
    setBusy(true);
    setError("");
    try {
      setGrade(await gradeAnswer(page, lang, id, answer));
    } catch (e) {
      setError(say(lang, e instanceof Error ? e.message : "That didn't work. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grade">
      <button type="button" className="btn sm" onClick={() => void run()} disabled={busy || !answer.trim()} aria-busy={busy}>
        {busy ? t.tutor.grading : grade ? t.tutor.gradeAgain : t.tutor.gradeButton}
      </button>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {grade && (
        <div className="grade-result" data-verdict={grade.verdict} role="status">
          <p className="grade-verdict">{t.tutor[grade.verdict]}</p>
          <p>{grade.feedback}</p>
          {grade.right.length > 0 && (<><p className="label">{t.tutor.gradeRight}</p><ul>{grade.right.map((x) => <li key={x}>{x}</li>)}</ul></>)}
          {grade.missing.length > 0 && (<><p className="label">{t.tutor.gradeMissing}</p><ul>{grade.missing.map((x) => <li key={x}>{x}</li>)}</ul></>)}
          <p className="grade-by">{fill(t.tutor.gradeBy, { score: grade.score, model: grade.model })}{grade.answer !== answer.trim() ? ` ${t.tutor.gradeStale}` : ""}</p>
        </div>
      )}
    </div>
  );
}
