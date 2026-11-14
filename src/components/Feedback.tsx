"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LangProvider";
import { sendFeedback } from "@/lib/track";

/**
 * A quiet "was this page clear?" under the content. A thumbs-up or thumbs-down
 * is recorded at once; a short note is invited but optional. The choice is
 * remembered in this browser so the question isn't asked again on a revisit.
 * Nothing but the answer and the page is sent — no account is needed.
 */
const KEY = (path: string) => `cyberdojo-fb:${path}`;
const NOTE_MAX = 500;

export function Feedback() {
  const { t } = useLang();
  const path = usePathname();
  const [stage, setStage] = useState<"ask" | "note" | "done">("ask");
  const [helpful, setHelpful] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // A fresh page resets the widget; a page already answered stays quiet.
    setStage("ask");
    setNote("");
    try {
      if (localStorage.getItem(KEY(path))) setStage("done");
    } catch {
      // No storage: ask every time, which is harmless.
    }
  }, [path]);

  const remember = () => {
    try {
      localStorage.setItem(KEY(path), "1");
    } catch {
      // Nothing to do; the vote still reached the server.
    }
  };

  const vote = (yes: boolean) => {
    setHelpful(yes);
    setStage("note");
    remember();
    void sendFeedback(path, yes, "");
  };

  const addNote = async () => {
    setBusy(true);
    await sendFeedback(path, helpful, note.trim());
    setBusy(false);
    setStage("done");
  };

  if (stage === "done") return <section className="feedback done" aria-live="polite"><p>{t.feedback.thanks}</p></section>;

  return (
    <section className="feedback" aria-label={t.feedback.title}>
      {stage === "ask" ? (
        <div className="fb-ask">
          <p className="fb-title">{t.feedback.title}</p>
          <div className="fb-buttons">
            <button type="button" className="btn sm" onClick={() => vote(true)}>{t.feedback.yes}</button>
            <button type="button" className="btn sm" onClick={() => vote(false)}>{t.feedback.no}</button>
          </div>
        </div>
      ) : (
        <div className="fb-note">
          <label htmlFor="fb-note-field" className="fb-title">{helpful ? t.feedback.noteGood : t.feedback.noteBad}</label>
          <textarea
            id="fb-note-field"
            value={note}
            maxLength={NOTE_MAX}
            rows={2}
            placeholder={t.feedback.notePlaceholder}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="fb-buttons">
            <button type="button" className="btn sm primary" onClick={() => void addNote()} disabled={busy || note.trim() === ""}>{t.feedback.send}</button>
            <button type="button" className="btn sm ghost" onClick={() => setStage("done")}>{t.feedback.skip}</button>
          </div>
        </div>
      )}
    </section>
  );
}
