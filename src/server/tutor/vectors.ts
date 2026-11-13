/**
 * Search by meaning over the course. Each chunk gets a vector from a local
 * embedding model, stored in the database and compared in memory: a few
 * thousand chunks need no vector database. Vectors are built in the background
 * the first time, and again only for chunks whose text changed.
 */
import type { Lang } from "@/i18n/lang";
import { all, many } from "@/server/db";
import type { Chunk, IndexStatus, TutorSettings } from "@/lib/tutor-types";
import { allChunks, chunksFor } from "./corpus";
import { embed } from "./ollama";

const BATCH = 16;
/**
 * Below this, a chunk is about something else. Measured on nomic-embed-text, whose scores sit close
 * together: an unrelated passage scores about 0.5, the best match for small talk about 0.6, and a real
 * match 0.7 or more. Another embedding model may want another floor.
 */
const FLOOR = 0.65;

interface State {
  model: string;
  vectors: Map<string, Float32Array>;
  job: Promise<void> | null;
  error?: string;
}

const slot = globalThis as { __cyberdojoVectors?: State };

/** nomic-embed-text was trained with these prefixes; other models simply see them as words. */
const asDocument = (c: Chunk) => `search_document: ${c.title}${c.heading ? `, ${c.heading}` : ""}\n${c.text}`;
const asQuery = (q: string) => `search_query: ${q}`;

function unit(v: number[]): Float32Array {
  const out = Float32Array.from(v);
  const norm = Math.hypot(...out) || 1;
  return out.map((x) => x / norm);
}

const toBlob = (v: Float32Array) => new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
const fromBlob = (b: ArrayBuffer) => new Float32Array(b.slice(0));

async function state(model: string): Promise<State> {
  const current = slot.__cyberdojoVectors;
  if (current?.model === model) return current;
  const rows = await all<{ chunk: string; vector: ArrayBuffer }>("SELECT chunk, vector FROM tutor_vectors WHERE model = ?", model);
  return (slot.__cyberdojoVectors = { model, vectors: new Map(rows.map((r) => [r.chunk, fromBlob(r.vector)])), job: null });
}

async function build(s: State, host: string) {
  const todo = allChunks().filter((c) => !s.vectors.has(c.id));
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    const vectors = (await embed(host, s.model, batch.map(asDocument))).map(unit);
    await many(batch.map((c, n) => ["INSERT OR REPLACE INTO tutor_vectors (chunk, model, vector) VALUES (?, ?, ?)", c.id, s.model, toBlob(vectors[n] as Float32Array)]));
    batch.forEach((c, n) => s.vectors.set(c.id, vectors[n] as Float32Array));
  }
  // Chunks that no longer exist: their text was edited or removed.
  const live = new Set(allChunks().map((c) => c.id));
  const stale = [...s.vectors.keys()].filter((id) => !live.has(id));
  if (stale.length) await many(stale.map((id) => ["DELETE FROM tutor_vectors WHERE chunk = ? AND model = ?", id, s.model]));
  stale.forEach((id) => s.vectors.delete(id));
}

/** Starts building whatever is missing, unless it is already running. */
export async function startIndexing(settings: TutorSettings): Promise<void> {
  const s = await state(settings.embedModel);
  if (s.job) return;
  delete s.error;
  s.job = build(s, settings.host)
    .catch((e: unknown) => {
      s.error = e instanceof Error ? e.message : String(e);
    })
    .finally(() => {
      s.job = null;
    });
}

export async function indexStatus(settings: TutorSettings, modelInstalled: boolean): Promise<IndexStatus> {
  const s = await state(settings.embedModel);
  const chunks = allChunks();
  const done = chunks.filter((c) => s.vectors.has(c.id)).length;
  const counts = { done, total: chunks.length };
  if (s.job) return { state: "running", ...counts };
  if (done === chunks.length) return { state: "ready", ...counts };
  if (s.error) return { state: "error", ...counts, error: s.error };
  return { state: modelInstalled ? "idle" : "missing-model", ...counts };
}

export interface Hit {
  chunk: Chunk;
  score: number;
}

/**
 * The chunks closest in meaning to the query, best first. Works on whatever is
 * indexed so far, and returns nothing when the embedding model can't be reached:
 * the tutor still has the page itself.
 */
export async function search(settings: TutorSettings, query: string, lang: Lang, limit: number, within?: Chunk[]): Promise<Hit[]> {
  const s = await state(settings.embedModel);
  if (s.vectors.size === 0) return [];
  let q: Float32Array;
  try {
    q = unit((await embed(settings.host, s.model, [asQuery(query)], AbortSignal.timeout(20_000)))[0] as number[]);
  } catch {
    return [];
  }
  const hits: Hit[] = [];
  for (const chunk of within ?? chunksFor(lang)) {
    const v = s.vectors.get(chunk.id);
    if (!v || v.length !== q.length) continue;
    let score = 0;
    for (let i = 0; i < q.length; i++) score += (q[i] as number) * (v[i] as number);
    if (within || score >= FLOOR) hits.push({ chunk, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
