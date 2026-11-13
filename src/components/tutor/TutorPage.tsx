"use client";

import Link from "@/components/HoverLink";
import { useCallback, useEffect, useState } from "react";
import { useLang } from "@/i18n/LangProvider";
import { localize } from "@/i18n/lang";
import { clearChat, getThreads, tutorReady, useTutorStatus } from "@/lib/tutor-client";
import type { Mode, Thread } from "@/lib/tutor-types";
import { ChatLog, Composer, useChat } from "./chat";
import { TutorOff } from "./TutorOff";

const PREFIX = "/tutor/chat/";
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const idOf = (href: string) => href.slice(PREFIX.length, -1);

/** The address bar remembers the open chat, so a reload or the Back button lands on it. */
function remember(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("c", id);
  else url.searchParams.delete("c");
  url.searchParams.delete("ask");
  window.history.replaceState(window.history.state, "", url);
}

/**
 * The tutor on its own page: any question, not tied to a lesson, with the
 * learner's chats in a list beside it. A chat is saved under
 * "/tutor/chat/<id>/", so it is stored and answered like a lesson's chat.
 */
export function TutorPage() {
  const { lang, t } = useLang();
  const status = useTutorStatus();
  const ready = tutorReady(status);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [pages, setPages] = useState<Thread[]>([]);
  const [id, setId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("explain");
  const [draft, setDraft] = useState("");

  const load = useCallback(() => {
    void getThreads(lang).then((r) => {
      setThreads(r.threads);
      setPages(r.pages);
    }).catch(() => undefined);
  }, [lang]);

  // ?c=<id> reopens a chat; ?ask=<text> (from the app's right-click menu) starts one with the question typed in.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("c");
    setId(c && /^[a-z0-9]{6,32}$/.test(c) ? c : newId());
    const ask = params.get("ask");
    if (ask) setDraft(ask.slice(0, 4000));
    load();
  }, [load]);

  const page = id ? `${PREFIX}${id}/` : null;
  const { messages, live, error, ask, stop } = useChat(page, load);
  const saved = threads.some((th) => th.href === page);

  const open = (next: string | null) => {
    stop();
    const target = next ?? newId();
    setId(target);
    setDraft("");
    remember(next);
  };
  const remove = async () => {
    if (!page) return;
    stop();
    await clearChat(page).catch(() => undefined);
    open(null);
    load();
  };
  const send = (text: string, m: Mode, reveal?: boolean) => {
    if (id) remember(id);
    void ask(text, m, reveal);
  };

  const starters = [t.tutor.starter1, t.tutor.starter2, t.tutor.starter3, t.tutor.starter4];

  return (
    <div className="chat-page">
      <aside className="chat-list" aria-label={t.tutor.chatsTitle}>
        <button type="button" className="btn primary wide" onClick={() => open(null)}>+ {t.tutor.newChat}</button>
        <h2>{t.tutor.chatsTitle}</h2>
        {threads.length === 0 ? <p className="muted">{t.tutor.noChats}</p> : (
          <ul>
            {threads.map((th) => (
              <li key={th.href}>
                <button type="button" className={th.href === page ? "on" : ""} aria-current={th.href === page ? "true" : undefined} onClick={() => open(idOf(th.href))}>{th.title}</button>
              </li>
            ))}
          </ul>
        )}
        {pages.length > 0 && (
          <>
            <h2>{t.tutor.pageChats}</h2>
            <ul>
              {pages.map((p) => (
                <li key={p.href}><Link href={`${localize(p.href, lang)}#tutor`}>{p.title}</Link></li>
              ))}
            </ul>
          </>
        )}
        <Link href="/tutor/setup/" className="chat-settings">{t.tutor.setupLink}</Link>
      </aside>

      <section className="chat-main" aria-label={t.tutor.chatTitle}>
        <header className="chat-head">
          <h1>{t.tutor.chatTitle}</h1>
          {ready && <Link href="/tutor/setup/" className="tutor-model" title={t.tutor.setupLink}>{status?.settings.chatModel}</Link>}
          {saved && <button type="button" className="link-btn" onClick={() => void remove()}>{t.tutor.deleteChat}</button>}
        </header>
        <ChatLog messages={messages} live={live} error={error} waiting={t.tutor.searching}>
          {status && !ready && <TutorOff status={status} />}
          {messages.length === 0 && !live && (
            <div className="chat-empty">
              <p>{t.tutor.chatEmpty}</p>
              <ul>
                {starters.map((s) => (
                  <li key={s}><button type="button" disabled={!ready} onClick={() => send(s, s === t.tutor.starter4 ? "quiz" : s === t.tutor.starter3 ? "hint" : "explain")}>{s}</button></li>
                ))}
              </ul>
            </div>
          )}
        </ChatLog>
        <Composer ready={ready} busy={!!live} hasMessages={messages.length > 0} mode={mode} setMode={setMode} draft={draft} setDraft={setDraft} onAsk={send} onStop={stop} placeholder={t.tutor.chatHolder} autoFocus />
      </section>
    </div>
  );
}
