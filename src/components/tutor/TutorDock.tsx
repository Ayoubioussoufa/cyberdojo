"use client";

import Link from "@/components/HoverLink";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fill, useLang } from "@/i18n/LangProvider";
import { localize, splitLang } from "@/i18n/lang";
import { askTutor, setDockOpen, takeQueued, tutorReady, useDock, useTutorStatus } from "@/lib/tutor-client";
import type { Mode } from "@/lib/tutor-types";
import { ChatLog, Composer, useChat } from "./chat";
import { TutorOff } from "./TutorOff";

/** The tutor, on every page of the desktop app: a button in the corner that opens a panel beside the page. */
export function TutorDock() {
  const { open, queued } = useDock();
  const { lang, t } = useLang();
  const page = splitLang(usePathname()).path;
  const status = useTutorStatus();
  const ready = tutorReady(status);
  const onTutorPage = page.startsWith("/tutor/");
  const { messages, live, error, ask, stop, clear } = useChat(open && !onTutorPage ? page : null);
  const [mode, setMode] = useState<Mode>("explain");
  const [draft, setDraft] = useState("");

  // A link ending in #tutor opens the panel: the full page's list of lesson chats uses it.
  useEffect(() => {
    if (window.location.hash === "#tutor") setDockOpen(true);
  }, [page]);

  // The app's right-click menu hands a selected passage over through this function (see desktop/main.ts).
  useEffect(() => {
    const hook = window as unknown as { cyberdojoAsk?: (text: string) => void };
    hook.cyberdojoAsk = (text: string) => {
      const message = fill(t.tutor.aboutThis, { text: String(text).slice(0, 2000) });
      if (onTutorPage) window.location.assign(`${localize("/tutor/", lang)}?ask=${encodeURIComponent(message)}`);
      else askTutor(message, "explain");
    };
    return () => {
      delete hook.cyberdojoAsk;
    };
  }, [onTutorPage, lang, t]);

  // A button elsewhere on the page asked the tutor something.
  useEffect(() => {
    if (!open || !queued || !ready || live) return;
    takeQueued();
    setMode(queued.mode);
    void ask(queued.text, queued.mode);
  }, [open, queued, ready, live, ask]);

  // The full page is the tutor itself: no corner button there.
  if (onTutorPage) return null;

  if (!open) {
    return (
      <button type="button" className="tutor-open" onClick={() => setDockOpen(true)} data-ready={ready}>
        <span aria-hidden="true">&gt;_</span> {t.tutor.launcher}
      </button>
    );
  }

  return (
    <aside className="tutor" aria-label={t.tutor.title}>
      <header className="tutor-head">
        <h2>{t.tutor.title}</h2>
        {ready && <Link href="/tutor/setup/" className="tutor-model" title={t.tutor.setupLink}>{status?.settings.chatModel}</Link>}
        <Link href="/tutor/" className="link-btn" title={t.tutor.openFull}>{t.tutor.openFull}</Link>
        <button type="button" className="link-btn" onClick={() => void clear()} disabled={messages.length === 0}>{t.tutor.clear}</button>
        <button type="button" className="icon-btn" onClick={() => setDockOpen(false)} aria-label={t.tutor.close}>✕</button>
      </header>

      <ChatLog messages={messages} live={live} error={error} waiting={t.tutor.thinking}>
        {status && !ready && <TutorOff status={status} />}
        {ready && messages.length === 0 && !live && <p className="tutor-empty">{t.tutor.empty}</p>}
      </ChatLog>

      <Composer ready={ready} busy={!!live} hasMessages={messages.length > 0} mode={mode} setMode={setMode} draft={draft} setDraft={setDraft} onAsk={(text, m, reveal) => void ask(text, m, reveal)} onStop={stop} placeholder={t.tutor.holder} autoFocus />
    </aside>
  );
}
