/**
 * The course as the tutor reads it: the chunks written by
 * scripts/build-tutor-index.ts from the same Markdown the pages are built from.
 * Read once per process.
 */
import fs from "node:fs";
import path from "node:path";
import type { Lang } from "@/i18n/lang";
import type { Chunk, TutorIndex } from "@/lib/tutor-types";

interface Corpus {
  chunks: Chunk[];
  byPage: Map<string, Chunk[]>;
}

const slot = globalThis as { __cyberdojoCorpus?: Corpus };

function load(): Corpus {
  const file = process.env.CYBERDOJO_TUTOR_INDEX ?? path.join(process.cwd(), ".tutor", "index.json");
  const { chunks } = JSON.parse(fs.readFileSync(file, "utf8")) as TutorIndex;
  const byPage = new Map<string, Chunk[]>();
  for (const c of chunks) {
    const key = `${c.lang}:${c.href}`;
    byPage.set(key, [...(byPage.get(key) ?? []), c]);
  }
  return { chunks, byPage };
}

const corpus = () => (slot.__cyberdojoCorpus ??= load());

export const allChunks = () => corpus().chunks;

/** A page's chunks in reading order. A page with no French copy is read in English, as the site shows it. */
export function pageChunks(href: string, lang: Lang): Chunk[] {
  const { byPage } = corpus();
  return byPage.get(`${lang}:${href}`) ?? byPage.get(`en:${href}`) ?? [];
}

/** Everything a reader of this language can be pointed to: their own pages, and English ones not yet translated. */
export function chunksFor(lang: Lang): Chunk[] {
  const { chunks, byPage } = corpus();
  return lang === "en" ? chunks.filter((c) => c.lang === "en") : chunks.filter((c) => c.lang === lang || !byPage.has(`${lang}:${c.href}`));
}
