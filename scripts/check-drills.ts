/** Every drill, across many seeds: valid options, no duplicates, an answer its own checker accepts. */
import fs from "node:fs";
import { CASES } from "../src/lib/cases";
import { DEFS, DRILL_LIST } from "../src/lib/drills";
import { deal } from "../src/lib/drills/deal";
import { Rng } from "../src/lib/rng";

// Branching cases: reachable, finished, and every choice explained.
for (const c of CASES) {
  const ids = new Set(c.nodes.map((n) => n.id));
  const seen = new Set<string>();
  const walk = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    const n = c.nodes.find((x) => x.id === id);
    if (!n) { console.log(`✗ case ${c.id}: no step ${id}`); process.exitCode = 1; return; }
    if (!n.end && !n.choices?.length) { console.log(`✗ case ${c.id}: ${id} is a dead end`); process.exitCode = 1; }
    for (const ch of n.choices ?? []) {
      if (ch.note.length < 25) { console.log(`✗ case ${c.id}: thin feedback on "${ch.label}"`); process.exitCode = 1; }
      walk(ch.to);
    }
  };
  walk(c.start);
  for (const id of ids) if (!seen.has(id)) { console.log(`✗ case ${c.id}: ${id} can't be reached`); process.exitCode = 1; }
  const ends = c.nodes.filter((n) => n.end).map((n) => n.end);
  if (!ends.includes("good") || (!ends.includes("bad") && !ends.includes("mixed"))) { console.log(`✗ case ${c.id}: needs a good and a bad ending`); process.exitCode = 1; }
  const vars = new Set((JSON.stringify(c.nodes) + c.debrief).match(/\{(\w+)\}/g)?.map((v) => v.slice(1, -1)) ?? []);
  for (const v of vars) if (!c.vars[v]) { console.log(`✗ case ${c.id}: unknown variable ${v}`); process.exitCode = 1; }
}

let bad = 0;
let runs = 0;
const subnet: { q: string; a: string }[] = [];
for (const d of DRILL_LIST) {
  for (let seed = 1; seed <= 400; seed++) {
    const ex = d.make(new Rng(seed * 104729));
    runs++;
    if (ex.kind === "choice") {
      if (new Set(ex.options).size !== ex.options.length) { bad++; console.log(`✗ ${d.id}: duplicate options: ${ex.prompt}`); break; }
      if (!ex.options[ex.correct]) { bad++; console.log(`✗ ${d.id}: no right option: ${ex.prompt}`); break; }
      // Every wrong pick must get its own explanation, not just the right answer.
      const wrong = ex.options.filter((_, i) => i !== ex.correct);
      if (ex.whyNot === undefined && ex.options.length > 2) { bad++; console.log(`✗ ${d.id}: no explanation for wrong picks: ${ex.prompt}`); break; }
      if (ex.whyNot && wrong.some((o) => /doesn't fit this case/.test(ex.whyNot?.[o] ?? "") || !ex.whyNot?.[o])) { bad++; console.log(`✗ ${d.id}: an option has no definition: ${wrong.filter((o) => !DEFS[o]).join(", ")}`); break; }
    } else if (ex.kind === "spot") {
      if (!ex.lines[ex.correct]) { bad++; console.log(`✗ ${d.id}: no right line`); break; }
      if (new Set(ex.lines).size !== ex.lines.length) { bad++; console.log(`✗ ${d.id}: repeated lines: ${ex.prompt}`); break; }
      const missing = ex.lines.findIndex((_, i) => i !== ex.correct && !ex.notes[i]);
      if (missing >= 0) { bad++; console.log(`✗ ${d.id}: line ${missing} has no explanation: ${ex.prompt}`); break; }
    } else if (ex.kind === "order") {
      if (new Set(ex.items).size !== ex.items.length || (ex.notes?.length ?? 0) !== ex.items.length) { bad++; console.log(`✗ ${d.id}: bad order set: ${ex.prompt}`); break; }
    } else if (ex.kind === "build") {
      const sh = ex.setup();
      const got = sh.exec(ex.solution, "", sh.creds);
      if (got.code !== 0 || !got.stdout.trim() || got.stdout !== ex.expected) { bad++; console.log(`✗ ${d.id}: the solution fails: ${ex.solution}\n  ${got.terminal.slice(0, 160)}`); break; }
      if (!ex.solution.split(" ").every((t) => ex.tokens.join(" ").includes(t))) { bad++; console.log(`✗ ${d.id}: a piece is missing: ${ex.solution}`); break; }
    } else if (ex.kind === "input") {
      if (!ex.accept(ex.answer)) { bad++; console.log(`✗ ${d.id}: rejects its own answer: ${ex.prompt}`); break; }
      if (d.id === "subnet") subnet.push({ q: ex.prompt, a: ex.answer });
    }
  }
}
// A round never repeats a question.
for (const d of DRILL_LIST) {
  for (let seed = 1; seed <= 40; seed++) {
    const r = deal(d, 12, seed * 6151);
    const prompts = r.exercises.map((e) => e.prompt);
    if (new Set(prompts).size !== prompts.length) { bad++; console.log(`✗ ${d.id}: a round repeated a question`); break; }
    if (prompts.length < Math.min(12, d.deck ?? 6)) { bad++; console.log(`✗ ${d.id}: only ${prompts.length} different questions`); break; }
    if (r.exercises.some((e) => e.why.trim().length < 12)) { bad++; console.log(`✗ ${d.id}: an explanation is too thin: ${r.exercises.find((e) => e.why.trim().length < 12)?.prompt}`); break; }
  }
}
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(subnet));
console.log(`${DRILL_LIST.length} drills, ${runs} exercises, ${CASES.length} cases, ${bad} failures`);
process.exit(bad || process.exitCode ? 1 : 0);
