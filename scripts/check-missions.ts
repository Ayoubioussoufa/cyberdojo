/** Every mission: unsolved at the start, solved by its reference solution, across many seeds. */
import { RANGES } from "../src/lib/missions";
import { Rng } from "../src/lib/rng";

/** Flags the learner works out from the output, such as a percentage. */
const COMPUTED = new Set(["detect-3", "eval-1", "eval-2", "trail-3"]);

let bad = 0;
let runs = 0;
for (const [rid, range] of Object.entries(RANGES)) {
  for (const m of range.missions) {
    if (m.id === "free") continue;
    for (let seed = 1; seed <= 25; seed++) {
      const w = m.build(new Rng(seed * 7919));
      runs++;
      if (m.passed(w, "")) {
        bad++;
        console.log(`✗ ${rid}/${m.id}: already passed at the start`);
        break;
      }
      let last = "";
      let out = "";
      let seen = "";
      const lines = m.solve(w);
      for (const line of lines) {
        out = w.shell.run(line);
        seen += out;
        last = line;
      }
      // The reference commands must reveal the answer, or a right answer could be marked wrong.
      if (w.flag !== undefined && !COMPUTED.has(m.id) && !seen.includes(w.flag)) {
        bad++;
        console.log(`✗ ${rid}/${m.id} seed ${seed}: the solution never shows the flag ${w.flag}\n  ${seen.slice(0, 200)}`);
        break;
      }
      if (!m.passed(w, last)) {
        bad++;
        console.log(`✗ ${rid}/${m.id} seed ${seed}: solution failed\n  ${lines.join("\n  ")}\n  last output: ${out.slice(0, 200)}`);
        break;
      }
    }
  }
}
console.log(`${runs} mission runs, ${bad} failures`);
process.exit(bad ? 1 : 0);
