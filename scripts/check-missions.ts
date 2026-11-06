/** Every mission: unsolved at the start, solved by its reference solution, across many seeds. */
import { RANGES } from "../src/lib/missions";
import { Rng } from "../src/lib/rng";

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
      const lines = m.solve(w);
      for (const line of lines) {
        out = w.shell.run(line);
        last = line;
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
