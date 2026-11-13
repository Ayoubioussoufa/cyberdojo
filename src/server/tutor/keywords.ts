/**
 * Search by words, beside search by meaning. The embedding model ranks
 * "how do I stop SQL injection" well, but acronyms, commands and names
 * ("CIA triad", "nmap -sV", "CVE-2021-44228") are words it hardly knows, while
 * a plain word count finds them at once. vectors.ts adds this score to the
 * meaning score as a small boost. BM25, the classic ranking for keyword search.
 */
import type { Chunk } from "@/lib/tutor-types";

const K1 = 1.2;
const B = 0.75;

/** Words too common to say what a passage is about, in both languages of the course. */
const STOP = new Set(
  `a an and are as at be but by can do does for from has have how i if in into is it its me my no not of on or so that the their them then there these they this to was what when where which who why will with you your
  au aux avec ce ces dans de des du elle en est et il je la le les leur mais me mon ne nous on ou par pas pour qu que qui sa se ses son sur ta te tes ton tu un une vous`.split(/\s+/),
);

/** Lower case, accents dropped, split on anything that isn't a letter or a digit. */
export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => (t.length > 1 || /\d/.test(t)) && !STOP.has(t));
}

interface Index {
  docs: Map<string, { tf: Map<string, number>; length: number }>;
  df: Map<string, number>;
  avg: number;
}

export function buildIndex(chunks: Chunk[]): Index {
  const docs = new Map<string, { tf: Map<string, number>; length: number }>();
  const df = new Map<string, number>();
  let total = 0;
  for (const c of chunks) {
    const words = tokens(`${c.title} ${c.heading} ${c.text}`);
    const tf = new Map<string, number>();
    for (const w of words) tf.set(w, (tf.get(w) ?? 0) + 1);
    for (const w of tf.keys()) df.set(w, (df.get(w) ?? 0) + 1);
    docs.set(c.id, { tf, length: words.length });
    total += words.length;
  }
  return { docs, df, avg: total / Math.max(chunks.length, 1) };
}

/** BM25 score of each chunk that contains at least one word of the query. */
export function scores(index: Index, query: string, ids: Iterable<string>): Map<string, number> {
  const n = index.docs.size;
  const words = [...new Set(tokens(query))];
  const idf = new Map(words.map((w) => {
    const df = index.df.get(w) ?? 0;
    return [w, Math.log(1 + (n - df + 0.5) / (df + 0.5))];
  }));
  const out = new Map<string, number>();
  for (const id of ids) {
    const doc = index.docs.get(id);
    if (!doc) continue;
    let score = 0;
    for (const w of words) {
      const f = doc.tf.get(w);
      if (!f) continue;
      score += (idf.get(w) as number) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * doc.length) / index.avg)));
    }
    if (score > 0) out.set(id, score);
  }
  return out;
}
