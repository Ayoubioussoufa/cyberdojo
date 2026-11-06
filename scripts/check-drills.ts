/** Every drill, across many seeds: valid options, no duplicates, an answer its own checker accepts. */
import fs from "node:fs";
import { DRILL_LIST } from "../src/lib/drills";
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
    } else {
      if (!ex.accept(ex.answer)) { bad++; console.log(`✗ ${d.id}: rejects its own answer: ${ex.prompt}`); break; }
      if (d.id === "subnet") subnet.push({ q: ex.prompt, a: ex.answer });
    }
  }
}
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(subnet));
console.log(`${DRILL_LIST.length} drills, ${runs} exercises, ${bad} failures`);
process.exit(bad ? 1 : 0);
