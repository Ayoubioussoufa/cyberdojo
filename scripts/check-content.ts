/** Content rules: equal-length quiz options, known components, valid internal links. */
import fs from "node:fs";
import path from "node:path";
import { DRILLS } from "../src/lib/drills";
import { guides, lessons, glossary } from "../src/lib/content";
import { RANGES } from "../src/lib/missions";

let bad = 0;
const fail = (msg: string) => {
  bad++;
  console.log(`✗ ${msg}`);
};
const docs = [...lessons(), ...guides()];
const words = (s: string) => s.trim().split(/\s+/).length;
const plain = (s: string) => s.replace(/`/g, "");
let questions = 0;

for (const d of docs) {
  const name = d.meta.slug;
  if (!d.meta.summary) fail(`${name}: no summary`);
  if (d.meta.kind === "lesson" && !d.meta.source) fail(`${name}: no primary source`);
  for (const q of d.questions) {
    questions++;
    const opts = q.options.map(plain);
    const counts = new Set(opts.map(words));
    // Options that are all commands can't share a word count: only their length is compared.
    const allCode = q.options.every((o) => /^`[^`]+`$/.test(o));
    if (!allCode && counts.size !== 1) fail(`${name}: option word counts differ: ${q.prompt}\n    ${opts.map((o) => `${words(o)}w ${o}`).join("\n    ")}`);
    const lens = opts.map((o) => o.length);
    const max = Math.max(...lens);
    const min = Math.min(...lens);
    if (max / min > 1.6) fail(`${name}: option lengths ${min}..${max}: ${q.prompt}\n    ${opts.join("\n    ")}`);
    const right = (opts[q.correct] as string).length;
    const others = opts.filter((_, i) => i !== q.correct).map((o) => o.length);
    if (right > Math.max(...others) + 8) fail(`${name}: the right answer is the longest by far: ${q.prompt}\n    ${opts.join("\n    ")}`);
  }
  const positions = new Set(d.questions.map((q) => q.correct));
  if (d.questions.length >= 4 && positions.size < 2) fail(`${name}: the right answer always sits in the same place`);
  for (const s of d.segments) {
    if (s.kind === "drill" && !DRILLS[s.id]) fail(`${name}: unknown drill ${s.id}`);
    if (s.kind === "range" && !RANGES[s.id]) fail(`${name}: unknown range ${s.id}`);
  }
}

const slugs = new Set(docs.map((d) => d.meta.slug));
for (const d of docs) {
  const html = d.segments.map((s) => (s.kind === "html" ? s.html : "")).join("");
  for (const m of html.matchAll(/href="\/(courses|guides)\/([^/"#]+)/g)) {
    if (!slugs.has(m[2] as string)) fail(`${d.meta.slug}: broken internal link /${m[1]}/${m[2]}`);
  }
}

const seen = new Set<string>();
for (const t of glossary()) {
  if (seen.has(t.term.toLowerCase())) fail(`duplicate glossary term: ${t.term} (${t.doc})`);
  seen.add(t.term.toLowerCase());
}

void fs;
void path;
console.log(`${docs.length} documents, ${questions} questions, ${glossary().length} terms, ${Object.keys(DRILLS).length} drills, ${Object.values(RANGES).reduce((n, r) => n + r.missions.length, 0)} missions`);
process.exit(bad ? 1 : 0);
