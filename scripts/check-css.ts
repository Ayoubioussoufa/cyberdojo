/**
 * The stylesheets parse: every { has its }, nothing closes twice, and no block is
 * left open at the end of a file. An unclosed @media once made every rule after it
 * apply only to narrow screens, which looked fine in narrow tests and broke wide
 * ones; this check catches that before a build.
 */
import fs from "node:fs";

const FILES = ["src/app/globals.css", "public/textures.css"];
let bad = 0;
for (const file of FILES) {
  const css = fs.readFileSync(file, "utf8");
  let depth = 0;
  let line = 1;
  const open: number[] = [];
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === "\n") line++;
    else if (ch === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      if (end < 0) {
        console.log(`✗ ${file}:${line}: a comment is never closed`);
        bad++;
        break;
      }
      line += css.slice(i, end).split("\n").length - 1;
      i = end + 1;
    } else if (ch === '"' || ch === "'") {
      const end = css.indexOf(ch, i + 1);
      if (end < 0) break;
      i = end;
    } else if (ch === "{") {
      depth++;
      open.push(line);
    } else if (ch === "}") {
      depth--;
      open.pop();
      if (depth < 0) {
        console.log(`✗ ${file}:${line}: a } closes nothing`);
        bad++;
        depth = 0;
      }
    }
  }
  if (depth > 0) {
    console.log(`✗ ${file}: ${depth} block(s) never closed, opened at line(s) ${open.join(", ")}`);
    bad++;
  }
}
console.log(bad ? `${bad} stylesheet problem(s)` : `✓ css: ${FILES.length} stylesheets parse, every block closed`);
process.exit(bad ? 1 : 0);
