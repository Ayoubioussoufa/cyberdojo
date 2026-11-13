"use client";

import Link from "@/components/HoverLink";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fill, useLang } from "@/i18n/LangProvider";
import { splitLang } from "@/i18n/lang";
import { say } from "@/i18n/ui";
import { chat, clearChat, getHistory, getStatus, setDockOpen, takeQueued, useDock } from "@/lib/tutor-client";
import { tutorHtml } from "@/lib/tutor-markdown";
import { MODES, type Mode, type Source, type TutorMessage, type TutorStatus } from "@/lib/tutor-types";

/** Past this, a learner's message is a whole page of work: it is folded so the chat stays readable. */
const LONG = 700;

type Shown = Pick<TutorMessage, "id" | "role" | "content"> & { sources?: Source[] };

const Reply = ({ text }: { text: string }) => {
  const html = useMemo(() => tutorHtml(text), [text]);
  return <div className="tutor-md" dangerouslySetInnerHTML={{ __html: html }} />;
};

function Bubble({ m }: { m: Shown }) {
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

/** The tutor, on every page of the desktop app: a button in the corner that opens a panel beside the page. */
export function TutorDock() {
  const { open, queued } = useDock();
  const { lang, t } = useLang();
  const page = splitLang(usePathname()).path;
  const [status, setStatus] = useState<TutorStatus | null>(null);
  const [messages, setMessages] = useState<Shown[]>([]);
  const [mode, setMode] = useState<Mode>("explain");
  const [draft, setDraft] = useState("");
  const [live, setLive] = useState<Shown | null>(null);
  const [error, setError] = useState("");
  const stopper = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  const ready = !!status?.ollama.running && !!status.settings.chatModel;

  // Each page has its own chat. Leaving a page stops an answer still being written for it.
  useEffect(() => {
    if (!open) return;
    let current = true;
    void getStatus().then((s) => current && setStatus(s)).catch(() => undefined);
    void getHistory(page).then((h) => current && setMessages(h)).catch(() => current && setMessages([]));
    return () => {
      current = false;
      stopper.current?.abort();
    };
  }, [open, page]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages, live]);

  useEffect(() => {
    if (open) box.current?.focus({ preventScroll: true });
  }, [open]);

  const ask = useCallback(async (text: string, as: Mode, reveal = false) => {
    const message = text.trim();
    if (!message || stopper.current) return;
    setError("");
    setMessages((list) => [...list, { id: -Date.now(), role: "user", content: message }]);
    const control = new AbortController();
    stopper.current = control;
    let reply: Shown = { id: 0, role: "assistant", content: "" };
    setLive(reply);
    try {
      for await (const event of chat({ href: page, lang, mode: as, reveal, message }, control.signal)) {
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
    }
  }, [page, lang]);

  // A button elsewhere on the page asked the tutor something.
  useEffect(() => {
    if (!open || !queued || !ready || live) return;
    takeQueued();
    setMode(queued.mode);
    void ask(queued.text, queued.mode);
  }, [open, queued, ready, live, ask]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void ask(draft, mode);
    setDraft("");
  };
  const pick = (m: Mode) => {
    setMode(m);
    if (m === "quiz" && !draft.trim() && ready) void ask(t.tutor.quizAsk, "quiz");
  };
  const clear = async () => {
    stopper.current?.abort();
    await clearChat(page).catch(() => undefined);
    setMessages([]);
  };

  if (!open) {
    return (
      <button type="button" className="tutor-open" onClick={() => setDockOpen(true)}>
        <span aria-hidden="true">&gt;_</span> {t.tutor.launcher}
      </button>
    );
  }

  return (
    <aside className="tutor" aria-label={t.tutor.title}>
      <header className="tutor-head">
        <h2>{t.tutor.title}</h2>
        {ready && <Link href="/tutor/" className="tutor-model" title={t.tutor.setupLink}>{status?.settings.chatModel}</Link>}
        <button type="button" className="link-btn" onClick={() => void clear()} disabled={messages.length === 0}>{t.tutor.clear}</button>
        <button type="button" className="icon-btn" onClick={() => setDockOpen(false)} aria-label={t.tutor.close}>✕</button>
      </header>

      <div className="tutor-log" aria-live="polite">
        {status && !ready && (
          <div className="tutor-off">
            <p>{status.ollama.running ? t.tutor.offModel : t.tutor.offOllama}</p>
            <Link href="/tutor/" className="btn primary sm">{t.tutor.openSetup}</Link>
          </div>
        )}
        {ready && messages.length === 0 && !live && <p className="tutor-empty">{t.tutor.empty}</p>}
        <ol>
          {messages.map((m) => <Bubble key={m.id} m={m} />)}
          {live && (live.content ? <Bubble m={live} /> : <li className="tutor-msg from-tutor tutor-wait">{t.tutor.thinking}</li>)}
        </ol>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div ref={end} />
      </div>

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
          placeholder={mode === "review" ? t.tutor.holderReview : t.tutor.holder}
          aria-label={mode === "review" ? t.tutor.holderReview : t.tutor.holder}
          disabled={!ready}
        />
        <div className="tutor-actions">
          <button type="button" className="link-btn" disabled={!ready || !!live || messages.length === 0} onClick={() => void ask(t.tutor.solutionAsk, mode, true)}>{t.tutor.solution}</button>
          {live
            ? <button type="button" className="btn sm" onClick={() => stopper.current?.abort()}>{t.tutor.stop}</button>
            : <button type="submit" className="btn primary sm" disabled={!ready || !draft.trim()}>{t.tutor.send}</button>}
        </div>
      </form>
    </aside>
  );
}
