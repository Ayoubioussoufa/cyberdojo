/**
 * The French site's rules. A translation must keep the English page's shape, so
 * that saved progress (question ids, option positions, flashcards, gates)
 * means the same thing in both languages, and every link stays on the French site.
 */
import fs from "node:fs";
import path from "node:path";
import { flatSegments, guides, lessons, machines, modules, projects, sheets, toolDocs } from "../src/lib/content";
import { UI, UI_TABLE, MESSAGE_KEYS, frenchSpaces } from "../src/i18n/ui";
import { localize, splitLang, switchTo, localizeHtml } from "../src/i18n/lang";
import { PLACEMENT } from "../src/data/path";
import { WHY_FR } from "../src/data/fr/path";
import { MONTHS } from "../src/lib/data";
import { monthsFor, monthTranslated } from "../src/data/fr/months";
import { DOMAINS, DOMAINS_FR } from "../src/data/domains";
import { TOOL_CATS, TOOL_CATS_FR } from "../src/data/toolcats";
import { DOJO } from "../src/data/dojo";
import { dojoModules } from "../src/data/fr/dojo";
import { SECTIONS, sectionsFor } from "../src/lib/prompt";
import type { Doc } from "../src/lib/types";

let bad = 0;
const fail = (msg: string) => {
  bad++;
  console.log(`✗ ${msg}`);
};

// 1. Routing helpers.
const eq = (got: string, want: string, what: string) => got !== want && fail(`${what}: got ${got}, want ${want}`);
eq(localize("/courses/x/", "fr"), "/fr/courses/x/", "localize a page");
eq(localize("/", "fr"), "/fr/", "localize home");
eq(localize("/fr/courses/", "fr"), "/fr/courses/", "localize twice");
eq(localize("/api/auth/me/", "fr"), "/api/auth/me/", "the API has no prefix");
eq(localize("https://example.com/", "fr"), "https://example.com/", "outside links stay");
eq(localize("#step-2", "fr"), "#step-2", "anchors stay");
eq(localize("/courses/", "en"), "/courses/", "English has no prefix");
eq(splitLang("/fr/courses/x/").path, "/courses/x/", "split a French path");
eq(splitLang("/fr").path, "/", "split the French root");
eq(splitLang("/free/").lang, "en", "a path that starts with fr is English");
eq(splitLang("/en/practice/").path, "/practice/", "the internal /en path is the English page");
eq(splitLang("/en").path, "/", "the internal /en root is home");
eq(splitLang("/enigma/").path, "/enigma/", "a path that starts with en keeps it");
eq(switchTo("/fr/tools/nmap/", "en"), "/tools/nmap/", "switch to English");
eq(switchTo("/tools/nmap/", "fr"), "/fr/tools/nmap/", "switch to French");
eq(localizeHtml('<a href="/courses/x/">x</a> <a href="https://a.b/">y</a>', "fr"), '<a href="/fr/courses/x/">x</a> <a href="https://a.b/">y</a>', "localize course HTML");

// 2. Interface strings: both languages fill the same slots and have the same plural forms.
const slots = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
let pairs = 0;
for (const [ns, entries] of Object.entries(UI_TABLE)) {
  for (const [k, [en, fr]] of Object.entries(entries as Record<string, readonly [string, string]>)) {
    pairs++;
    if (!en.trim() || !fr.trim()) fail(`ui ${ns}.${k}: empty`);
    if (slots(en) !== slots(fr)) fail(`ui ${ns}.${k}: slots differ: "${en}" / "${fr}"`);
    if (en.split("|").length !== fr.split("|").length) fail(`ui ${ns}.${k}: plural forms differ`);
    if (/ [?!;:](\s|$)/.test(frenchSpaces(fr))) fail(`ui ${ns}.${k}: French spacing`);
    if (/"/.test(fr)) fail(`ui ${ns}.${k}: French uses « » for quotes, not "`);
  }
}
if (Object.keys(UI.fr).length !== Object.keys(UI.en).length) fail("ui: namespaces differ");

// 3. Every message the server or the account code can show has a French line.
const MESSAGE_FILES = ["src/server/password.ts", "src/lib/account.ts", "src/components/Prompt.tsx", ...walk("src/app/api").filter((f) => f.endsWith(".ts"))];
function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
let messages = 0;
for (const f of MESSAGE_FILES) {
  const src = fs.readFileSync(f, "utf8");
  const found = [
    ...src.matchAll(/fail\(\d+, "([^"]+)"/g),
    ...src.matchAll(/return "([A-Z][^"]+[.?])"/g),
    ...src.matchAll(/\?\? "([A-Z][^"]+[.?])"/g),
    ...src.matchAll(/const WRONG = "([^"]+)"/g),
  ].map((m) => m[1] as string);
  for (const m of found) {
    messages++;
    if (!MESSAGE_KEYS.has(m)) fail(`${f}: no French for the message "${m}"`);
  }
}

// 4. French documents: each has an English twin and the same shape.
const FR = path.join("content", "fr");
const frFiles = fs.existsSync(FR) ? walk(FR).filter((f) => f.endsWith(".md")) : [];
const english = (rel: string) => {
  const [kind, ...rest] = rel.split(path.sep);
  const file = rest.join(path.sep);
  return kind === "modules" ? path.join("modules", file) : kind === "tools" ? path.join("tools", file) : path.join("content", kind as string, file);
};
for (const f of frFiles) {
  const rel = path.relative(FR, f);
  if (!fs.existsSync(english(rel))) fail(`${f}: no English file at ${english(rel)}`);
}

const words = (s: string) => s.trim().split(/\s+/).length;
const plain = (s: string) => s.replace(/`/g, "");
const pairsOf = (en: Doc[], fr: Doc[]) => en.map((d, i) => [d, fr[i] as Doc] as const);
const libraries = [
  pairsOf(lessons(), lessons("fr")),
  pairsOf(guides(), guides("fr")),
  pairsOf(machines(), machines("fr")),
  pairsOf(projects(), projects("fr")),
  pairsOf(modules(), modules("fr")),
  pairsOf(toolDocs(), toolDocs("fr")),
  pairsOf(sheets(), sheets("fr")),
];
let translated = 0;
let frenchQuestions = 0;
for (const [en, fr] of libraries.flat()) {
  const name = `fr:${en.meta.slug}`;
  if (!fr || fr.meta.slug !== en.meta.slug) {
    fail(`${name}: the French library is out of step with the English one`);
    continue;
  }
  // Wherever the French site shows a page, translated or not, its links stay on the French site.
  const leak = /href=\\?"\/(?!fr\/|\/)[^"\\]*/.exec(JSON.stringify(fr.segments));
  if (leak) fail(`${name}: a link leaves the French site: ${leak[0]}`);
  if (fr.meta.lang !== "fr") continue;
  translated++;
  if (fr.questions.length !== en.questions.length) fail(`${name}: ${fr.questions.length} questions, English has ${en.questions.length}`);
  fr.questions.forEach((q, i) => {
    frenchQuestions++;
    const e = en.questions[i];
    if (!e) return;
    if (q.id !== e.id) fail(`${name}: question ${i + 1} id ${q.id} ≠ ${e.id}`);
    if (q.options.length !== e.options.length) fail(`${name}: question ${i + 1} has ${q.options.length} options, English has ${e.options.length}`);
    if (q.correct !== e.correct) fail(`${name}: question ${i + 1}'s right answer moved (write the options in the English order, right one first)`);
    // The same fairness rules as English quizzes (scripts/check-content.ts).
    const opts = q.options.map(plain);
    const allCode = q.options.every((o) => /^`[^`]+`$/.test(o));
    if (!allCode && new Set(opts.map(words)).size !== 1) fail(`${name}: option word counts differ: ${q.prompt}\n    ${opts.map((o) => `${words(o)}w ${o}`).join("\n    ")}`);
    const lens = opts.map((o) => o.length);
    if (Math.max(...lens) / Math.min(...lens) > 1.6) fail(`${name}: option lengths ${Math.min(...lens)}..${Math.max(...lens)}: ${q.prompt}\n    ${opts.join("\n    ")}`);
    const right = (opts[q.correct] as string).length;
    if (right > Math.max(...opts.filter((_, j) => j !== q.correct).map((o) => o.length)) + 8) fail(`${name}: the right answer is the longest by far: ${q.prompt}\n    ${opts.join("\n    ")}`);
  });
  if (fr.written.length !== en.written.length) fail(`${name}: ${fr.written.length} written questions, English has ${en.written.length}`);
  if (fr.terms.length !== en.terms.length) fail(`${name}: ${fr.terms.length} glossary terms, English has ${en.terms.length}`);
  fr.terms.forEach((t, i) => t.key !== en.terms[i]?.term && fail(`${name}: term ${t.term} isn't keyed to ${en.terms[i]?.term}`));
  if (fr.checks.length !== en.checks.length) fail(`${name}: ${fr.checks.length} checkpoints, English has ${en.checks.length}`);
  if (fr.toc.length !== en.toc.length) fail(`${name}: ${fr.toc.length} sections, English has ${en.toc.length}`);
  const parts = (d: Doc) => flatSegments(d.segments).filter((s) => s.kind === "drill" || s.kind === "range" || s.kind === "step").map((s) => (s.kind === "step" ? `step ${s.n}` : `${s.kind} ${s.id}`)).join(", ");
  if (parts(fr) !== parts(en)) fail(`${name}: drills, missions or steps differ:\n    fr: ${parts(fr)}\n    en: ${parts(en)}`);
  if (fr.meta.words.length !== en.meta.words.length) fail(`${name}: ${fr.meta.words.length} words to define, English has ${en.meta.words.length}`);
  if (!fr.meta.summary || fr.meta.summary === en.meta.summary) fail(`${name}: the summary isn't translated`);
  if (fr.meta.title === en.meta.title && en.meta.kind !== "tool") fail(`${name}: the title isn't translated`);
  // Front matter isn't YAML: quotes would show on the page.
  for (const [k, v] of Object.entries({ title: fr.meta.title, summary: fr.meta.summary })) if (/^["']/.test(v)) fail(`${name}: the ${k} starts with a quote`);
}

// 5. French data: keys that exist, and gates that keep their positions.
for (const ref of Object.keys(WHY_FR)) {
  const known = Object.values(PLACEMENT).some((p) => [...(p.before ?? []), ...(p.after ?? [])].some((x) => x.ref === ref));
  if (!known) fail(`WHY_FR: ${ref} isn't on the roadmap`);
}
const fr = monthsFor("fr");
for (const m of MONTHS) {
  const f = fr[m.n - 1];
  if (!f || f.title === m.title) fail(`month ${m.n}: no French title`);
  if (!monthTranslated(m.n)) continue;
  for (const k of ["gate", "topics", "skills", "weeks", "labs", "free", "paid"] as const) {
    if ((f?.[k]?.length ?? 0) !== (m[k]?.length ?? 0)) fail(`month ${m.n}: ${k} has ${f?.[k]?.length ?? 0} items, English has ${m[k]?.length ?? 0}`);
  }
}
for (const id of Object.keys(DOMAINS_FR)) if (!DOMAINS.some((d) => d.id === id)) fail(`DOMAINS_FR: unknown domain ${id}`);
for (const d of DOMAINS) if (!DOMAINS_FR[d.id]) fail(`DOMAINS_FR: no French for ${d.id}`);
for (const c of TOOL_CATS) if (!TOOL_CATS_FR[c.folder]) fail(`TOOL_CATS_FR: no French for ${c.folder}`);
dojoModules("fr").forEach((m, i) => {
  const e = DOJO[i];
  // "Permissions" is the same word in French.
  if (m.title === e?.title && m.title !== "Permissions") fail(`dojo ${m.id}: no French title`);
  if (m.intro.length !== e?.intro.length) fail(`dojo ${m.id}: intro has ${m.intro.length} paragraphs, English has ${e?.intro.length}`);
});
const frSections = sectionsFor("fr");
SECTIONS.forEach((s, i) => frSections[i]?.label === s.label && s.label !== "Modules" && s.label !== "Dojo" && s.label !== "Machines" && fail(`prompt: no French name for ${s.href}`));

console.log(
  bad
    ? `\n${bad} problem${bad === 1 ? "" : "s"}`
    : `✓ i18n: ${pairs} interface strings, ${messages} server messages, ${translated} translated pages (${frenchQuestions} questions) in step with English, French links stay French`,
);
process.exit(bad ? 1 : 0);
