/** One tutor turn: gather the context, ask the model, stream the answer and save both sides. */
import type { Lang } from "@/i18n/lang";
import type { ChatEvent, Chunk, Grade, Mode, TutorSettings, Verdict } from "@/lib/tutor-types";
import { pageChunks } from "./corpus";
import { chat, chatJson, OllamaError } from "./ollama";
import { fitPage, GRADE_FORMAT, gradePrompt, historyTurns, PAGE_BUDGET, RELATED_LIMIT, RELATED_LIMIT_CHAT, sourcesOf, systemPrompt } from "./prompt";
import { addMessage, history, isThread, saveGrade } from "./store";
import { search } from "./vectors";

export interface Turn {
  href: string;
  lang: Lang;
  mode: Mode;
  reveal: boolean;
  message: string;
}

/** Long pasted work makes a poor search query: the first lines say what it is about. */
const QUERY_CHARS = 1500;

async function context(settings: TutorSettings, turn: Turn): Promise<{ page: Chunk[]; related: Chunk[] }> {
  const whole = pageChunks(turn.href, turn.lang);
  // "Why isn't that enough?" means little alone: the page's title says what "that" is about.
  const query = `${whole[0] ? `${whole[0].title}. ` : ""}${turn.message.slice(0, QUERY_CHARS)}`;
  const tooLong = whole.reduce((n, c) => n + c.text.length, 0) > PAGE_BUDGET;
  const limit = isThread(turn.href) ? RELATED_LIMIT_CHAT : RELATED_LIMIT;
  const [ranked, hits] = await Promise.all([
    tooLong ? search(settings, query, turn.lang, whole.length, whole) : [],
    search(settings, query, turn.lang, limit + whole.length),
  ]);
  const page = fitPage(whole, ranked.length ? new Map(ranked.map((h) => [h.chunk.id, h.score])) : undefined);
  const related = hits.map((h) => h.chunk).filter((c) => c.href !== turn.href).slice(0, limit);
  return { page, related };
}

const problem = (e: unknown) => (e instanceof OllamaError ? e.message : "The tutor stopped unexpectedly. Try again.");

/** The reply as a stream of events. What was written before a stop is kept, so a cancelled answer isn't lost. */
export function answer(settings: TutorSettings, turn: Turn, signal: AbortSignal): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const send = (event: ChatEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // The window stopped listening. The answer is still saved below.
        }
      };
      let text = "";
      try {
        const [{ page, related }, past] = await Promise.all([context(settings, turn), history(turn.href)]);
        await addMessage(turn.href, "user", turn.mode, turn.message);
        send({ type: "sources", sources: sourcesOf(related, turn.lang) });
        const messages = [
          { role: "system" as const, content: systemPrompt({ lang: turn.lang, mode: turn.mode, reveal: turn.reveal, page, related, chat: isThread(turn.href) }) },
          ...historyTurns(past),
          { role: "user" as const, content: turn.message },
        ];
        for await (const piece of chat(settings.host, settings.chatModel, messages, signal)) {
          text += piece;
          send({ type: "delta", text: piece });
        }
      } catch (e) {
        if (!signal.aborted) send({ type: "error", error: problem(e) });
      }
      if (text.trim()) send({ type: "done", message: await addMessage(turn.href, "assistant", turn.mode, text) });
      try {
        controller.close();
      } catch {
        // Already closed by the window.
      }
    },
  });
}

const VERDICTS: readonly Verdict[] = ["correct", "partial", "incorrect"];
const lines = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").slice(0, 8) : []);

/** Small models sometimes break the format. Null means the reply can't be trusted as a grade. */
export function readGrade(raw: string): Pick<Grade, "verdict" | "score" | "right" | "missing" | "feedback"> | null {
  let v: Record<string, unknown>;
  try {
    v = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
  const verdict = VERDICTS.find((x) => x === v.verdict);
  const score = typeof v.score === "number" ? Math.round(v.score) : NaN;
  if (!verdict || !(score >= 0 && score <= 100) || typeof v.feedback !== "string") return null;
  return { verdict, score, right: lines(v.right), missing: lines(v.missing), feedback: v.feedback.trim() };
}

/** Grades a written answer against the section its question sits in. An error message comes back as a string. */
export async function grade(settings: TutorSettings, href: string, lang: Lang, questionId: string, answerText: string, signal: AbortSignal): Promise<Grade | string> {
  const page = pageChunks(href, lang);
  const home = page.find((c) => c.written?.some((w) => w.id === questionId));
  const question = home?.written?.find((w) => w.id === questionId);
  if (!home || !question) return "Not found.";
  const reference = fitPage(page.filter((c) => c.heading === home.heading));
  let raw: string;
  try {
    raw = await chatJson(settings.host, settings.chatModel, gradePrompt(lang, question.prompt, answerText, reference), GRADE_FORMAT, signal);
  } catch (e) {
    return problem(e);
  }
  const read = readGrade(raw);
  if (!read) return "The model's reply wasn't a usable grade. Try again, or pick a larger model.";
  const result: Grade = { questionId, answer: answerText, ...read, model: settings.chatModel, createdAt: Date.now() };
  await saveGrade(href, result);
  return result;
}
