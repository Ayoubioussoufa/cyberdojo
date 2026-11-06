/** Every drill, across many seeds: valid options, no duplicates, an answer its own checker accepts. */
import fs from "node:fs";
import { DEFS, DRILL_LIST } from "../src/lib/drills";
import { deal } from "../src/lib/drills/deal";
import { Rng } from "../src/lib/rng";

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
console.log(`${DRILL_LIST.length} drills, ${runs} exercises, ${bad} failures`);
process.exit(bad ? 1 : 0);
