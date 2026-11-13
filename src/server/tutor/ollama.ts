/**
 * Ollama's HTTP API, typed: the only place that talks to the model server.
 * Everything stays on this computer; the default host is the loopback address.
 */
import { jsonLines } from "@/lib/ndjson";
import type { InstalledModel } from "@/lib/tutor-types";

export const DEFAULT_HOST = "http://127.0.0.1:11434";

/** Room for the page, a few related excerpts, the recent chat and the answer. */
const NUM_CTX = 8192;

export interface ChatTurn {
  role: "system" | "user" | "assistant";
  content: string;
}

export class OllamaError extends Error {}

async function call(host: string, path: string, init: RequestInit = {}): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${host}${path}`, { ...init, headers: init.body ? { "Content-Type": "application/json" } : {} });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw e;
    throw new OllamaError("Ollama isn't answering. Start it, then try again.");
  }
  if (!res.ok) {
    const detail = ((await res.json().catch(() => null)) as { error?: string } | null)?.error;
    throw new OllamaError(detail ?? `Ollama answered ${res.status}.`);
  }
  return res;
}

const post = (host: string, path: string, body: unknown, signal?: AbortSignal) => call(host, path, { method: "POST", body: JSON.stringify(body), signal });

/** Null when nothing is listening. Quick, because the status page asks often. */
export async function version(host: string): Promise<string | null> {
  try {
    const res = await call(host, "/api/version", { signal: AbortSignal.timeout(1500) });
    return ((await res.json()) as { version?: string }).version ?? null;
  } catch {
    return null;
  }
}

export async function installed(host: string): Promise<InstalledModel[]> {
  const res = await call(host, "/api/tags", { signal: AbortSignal.timeout(5000) });
  const { models = [] } = (await res.json()) as { models?: { name: string; size: number }[] };
  return models.map((m) => ({ name: m.name, bytes: m.size }));
}

/** The download's own progress lines, untouched, for the page to draw. */
export async function pull(host: string, model: string, signal: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  const res = await post(host, "/api/pull", { model, stream: true }, signal);
  if (!res.body) throw new OllamaError("Ollama sent no download progress.");
  return res.body;
}

/** The answer, piece by piece. */
export async function* chat(host: string, model: string, messages: ChatTurn[], signal: AbortSignal): AsyncGenerator<string> {
  const res = await post(host, "/api/chat", { model, messages, stream: true, options: { num_ctx: NUM_CTX, temperature: 0.4 } }, signal);
  if (!res.body) throw new OllamaError("Ollama sent no answer.");
  for await (const line of jsonLines<{ message?: { content?: string }; error?: string }>(res.body)) {
    if (line.error) throw new OllamaError(line.error);
    if (line.message?.content) yield line.message.content;
  }
}

/** One whole answer that must match a JSON schema. Used for grading. */
export async function chatJson(host: string, model: string, messages: ChatTurn[], format: object, signal: AbortSignal): Promise<string> {
  const res = await post(host, "/api/chat", { model, messages, format, stream: false, options: { num_ctx: NUM_CTX, temperature: 0 } }, signal);
  return ((await res.json()) as { message?: { content?: string } }).message?.content ?? "";
}

export async function embed(host: string, model: string, input: string[], signal?: AbortSignal): Promise<number[][]> {
  const res = await post(host, "/api/embed", { model, input, truncate: true }, signal);
  const { embeddings } = (await res.json()) as { embeddings?: number[][] };
  if (!embeddings || embeddings.length !== input.length) throw new OllamaError("Ollama returned no embeddings.");
  return embeddings;
}

/** "qwen2.5:7b" is installed as itself; "mistral" is installed as "mistral:latest". */
export const hasModel = (list: InstalledModel[], name: string) => list.some((m) => m.name === name || m.name === `${name}:latest`);
