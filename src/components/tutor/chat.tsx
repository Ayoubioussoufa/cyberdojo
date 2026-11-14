"use client";

/**
 * What the tutor's two faces share: the panel beside a lesson and the full
 * page. One chat per `page` key: a lesson's path, or "/tutor/chat/<id>/".
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fill, useLang } from "@/i18n/LangProvider";
import { say } from "@/i18n/ui";
import { chat, clearChat, getHistory } from "@/lib/tutor-client";
import { tutorHtml } from "@/lib/tutor-markdown";
import { MODES, type Mode, type Source, type TutorMessage } from "@/lib/tutor-types";

/** Past this, a learner's message is a whole page of work: it is folded so the chat stays readable. */
const LONG = 700;

export type Shown = Pick<TutorMessage, "id" | "role" | "content"> & { sources?: Source[] };

const Reply = ({ text }: { text: string }) => {
  const html = useMemo(() => tutorHtml(text), [text]);
  return <div className="tutor-md" dangerouslySetInnerHTML={{ __html: html }} />;
};

export function Bubble({ m }: { m: Shown }) {
  const { t } = useLang();
  if (m.role === "assistant") {
    return (
      <li className="tutor-msg from-tutor">
        <Reply text={m.content} />
        {m.sources && m.sources.length > 0 && (
          <p className="tutor-sources">
            {t.tutor.sources} {m.sources.map((s, i) => <span key={s.href}>{i > 0 && ", "}<a href={s.href}>{s.title}</a></span>)}
          </p>
        )}
      </li>
    );
  }
  return (
    <li className="tutor-msg from-you">
      <span className="tutor-who">{t.tutor.you}</span>
      {m.content.length > LONG
        ? <details><summary>{fill(t.tutor.longWork, { n: m.content.length })}</summary><p>{m.content}</p></details>
        : <p>{m.content}</p>}
    </li>
  );
}

/**
 * One chat's messages, the answer being written, and the calls that change
 * them. Switching `page` stops an answer still being written for the old one.
 */
export function useChat(page: string | null, onSaved?: () => void) {
  const { lang } = useLang();
  const [messages, setMessages] = useState<Shown[]>([]);
  const [live, setLive] = useState<Shown | null>(null);
  const [error, setError] = useState("");
  const stopper = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages([]);
    setError("");
    if (!page) return;
    let current = true;
    void getHistory(page).then((h) => current && setMessages(h)).catch(() => current && setMessages([]));
    return () => {
      current = false;
      stopper.current?.abort();
    };
  }, [page]);

  const ask = useCallback(async (text: string, mode: Mode, reveal = false) => {
    const message = text.trim();
    if (!page || !message || stopper.current) return;
    setError("");
    setMessages((list) => [...list, { id: -Date.now(), role: "user", content: message }]);
    const control = new AbortController();
    stopper.current = control;
    let reply: Shown = { id: 0, role: "assistant", content: "" };
    setLive(reply);
    try {
      for await (const event of chat({ href: page, lang, mode, reveal, message }, control.signal)) {
        if (event.type === "sources") reply = { ...reply, sources: event.sources };
        else if (event.type === "delta") reply = { ...reply, content: reply.content + event.text };
        else if (event.type === "error") setError(say(lang, event.error));
        else reply = { ...reply, id: event.message.id };
        setLive(reply);
      }
    } catch (e) {
      if (!control.signal.aborted) setError(say(lang, e instanceof Error ? e.message : "That didn't work. Try again."));
    } finally {
      stopper.current = null;
      setLive(null);
      if (reply.content.trim()) setMessages((list) => [...list, reply.id ? reply : { ...reply, id: -Date.now() - 1 }]);
      onSaved?.();
    }
  }, [page, lang, onSaved]);

  const stop = useCallback(() => stopper.current?.abort(), []);
  const clear = useCallback(async () => {
    stopper.current?.abort();
    if (page) await clearChat(page).catch(() => undefined);
    setMessages([]);
  }, [page]);

  return { messages, live, error, ask, stop, clear };
}

export function ChatLog({ messages, live, error, waiting, children }: { messages: Shown[]; live: Shown | null; error: string; waiting: string; children?: React.ReactNode }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages, live]);
  return (
    <div className="tutor-log" aria-live="polite">
      {children}
      <ol>
        {messages.map((m) => <Bubble key={m.id} m={m} />)}
        {live && (live.content ? <Bubble m={live} /> : <li className="tutor-msg from-tutor tutor-wait">{waiting}</li>)}
      </ol>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div ref={end} />
    </div>
  );
}

interface ComposerProps {
  ready: boolean;
  busy: boolean;
  hasMessages: boolean;
  mode: Mode;
  setMode: (m: Mode) => void;
  draft: string;
  setDraft: (s: string) => void;
  onAsk: (text: string, mode: Mode, reveal?: boolean) => void;
  onStop: () => void;
  placeholder: string;
  autoFocus?: boolean;
}

/** The modes, the box and the buttons under a chat. */
export function Composer({ ready, busy, hasMessages, mode, setMode, draft, setDraft, onAsk, onStop, placeholder, autoFocus }: ComposerProps) {
  const { t } = useLang();
  const box = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (autoFocus && ready) box.current?.focus({ preventScroll: true });
  }, [autoFocus, ready]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !draft.trim()) return;
    onAsk(draft, mode);
    setDraft("");
  };
  const pick = (m: Mode) => {
    setMode(m);
    if (m === "quiz" && !draft.trim() && ready && !busy) onAsk(t.tutor.quizAsk, "quiz");
  };
  const label = mode === "review" ? t.tutor.holderReview : mode === "lab" ? t.tutor.holderLab : placeholder;
  return (
    <form className="tutor-form" onSubmit={submit}>
      <div className="tutor-modes" role="radiogroup" aria-label={t.tutor.modeLabel}>
        {MODES.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? "on" : ""} onClick={() => pick(m)}>{t.tutor[m]}</button>
        ))}
      </div>
      <textarea
        ref={box}
        rows={3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submit(e);
        }}
        placeholder={label}
        aria-label={label}
        disabled={!ready}
      />
      <div className="tutor-actions">
        <button type="button" className="link-btn" disabled={!ready || busy || !hasMessages} onClick={() => onAsk(t.tutor.solutionAsk, mode, true)}>{t.tutor.solution}</button>
        {busy
          ? <button type="button" className="btn sm" onClick={onStop}>{t.tutor.stop}</button>
          : <button type="submit" className="btn primary sm" disabled={!ready || !draft.trim()}>{t.tutor.send}</button>}
      </div>
    </form>
  );
}
