/**
 * Writes .tutor/index.json: every page of the course, cut into chunks for the
 * desktop app's tutor. It reads the content through src/lib/content.ts, the same
 * way the pages do, so a new lesson is in the tutor's index on the next build.
 */
import fs from "node:fs";
import path from "node:path";
import { breakClasses } from "../src/data/breakin";
import { dojoModules } from "../src/data/fr/dojo";
import { LANGS, type Lang } from "../src/i18n/lang";
import { guides, lessons, machines, modules, projects, sheets, toolDocs } from "../src/lib/content";
import type { Chunk, TutorIndex } from "../src/lib/tutor-types";
import type { Doc } from "../src/lib/types";
import { chunkBlocks, chunkDoc, missionsText } from "../src/server/tutor/chunking";

const SHELVES: [base: string, docs: (lang: Lang) => Doc[]][] = [
  ["/courses/", lessons],
  ["/guides/", guides],
  ["/machines/", machines],
  ["/sheets/", sheets],
  ["/projects/", projects],
  ["/modules/", modules],
  ["/tools/", toolDocs],
];

/** A page with no translation comes back in English: it is indexed once, as English. */
const written = (doc: Doc, lang: Lang) => (doc.meta.lang ?? "en") === lang;

function build(lang: Lang): Chunk[] {
  const docs = SHELVES.flatMap(([base, list]) => list(lang).filter((d) => written(d, lang)).flatMap((d) => chunkDoc(d, base, lang)));
  const dojo = dojoModules(lang).flatMap((m) =>
    chunkBlocks({ lang, href: `/dojo/${m.id}/`, kind: "dojo", title: m.title }, [{ text: m.intro.join("\n\n") }, { text: missionsText(m.range) }]),
  );
  const breakIn = breakClasses(lang).flatMap((c) =>
    chunkBlocks({ lang, href: `/break-in/${c.id}/`, kind: "break-in", title: c.title }, [{ text: c.intro.join("\n\n") }, { text: missionsText(c.range) }, { text: `The defence: ${c.defence}` }]),
  );
  return [...docs, ...dojo, ...breakIn];
}

const all = LANGS.flatMap(build);
// The Dojo and break-in data return English where no French exists, which would index the same text twice.
const seen = new Set<string>();
const chunks = all.filter((c) => {
  const key = `${c.href}\n${c.heading}\n${c.text}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const out = path.join(process.cwd(), ".tutor", "index.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ version: 1, chunks } satisfies TutorIndex));
const pages = new Set(chunks.map((c) => `${c.lang}:${c.href}`)).size;
console.log(`tutor index: ${chunks.length} chunks from ${pages} pages, ${(fs.statSync(out).size / 1e6).toFixed(1)} MB`);
