/**
 * Insecure file upload, simulated. The toy server decides whether a file is safe
 * from its name, then serves it back and will "run" anything it treats as a
 * script. So a name that slips past the check but still runs as code gives you
 * execution. Nothing is written to a real disk; files live in a map in the
 * closure. The fix, in the debrief: allowlist the exact types you accept, and
 * serve uploads from somewhere that never executes them.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, bad, notFound } from "./kit";
import type { Site } from "@/lib/shell/http";

/** The final extension of a name, lowercased, e.g. "shell.php.jpg" -> "jpg". */
const finalExt = (name: string) => (name.includes(".") ? (name.split(".").pop() ?? "").toLowerCase() : "");

export const UPLOAD: Mission[] = [
  {
    id: "break-upload-1",
    title: "Upload something that runs",
    brief:
      "`files.lab/upload` takes a `name` and `body`, and rejects anything ending in `.php`. But it will execute any script it stores, and it recognises more script types than it blocks. Upload a file that runs, then request it to get code execution.",
    greeting: "The upload filter and the thing that runs your file disagree about what counts as a script. That gap is the bug.",
    hints: [
      "`.php` is blocked, but `.phtml` runs just the same and isn't on the blocklist.",
      "Upload it, then fetch it from `/files/<name>`.",
      "`curl -s -d 'name=shell.phtml&body=x' files.lab/upload` then `curl -s files.lab/files/shell.phtml`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const blocked = new Set(["php"]);
      const runs = new Set(["php", "phtml", "php5"]);
      const stored = new Set<string>();
      const site: Site = (r) => {
        if (r.path === "/upload" && r.method === "POST") {
          const name = r.form.name ?? "";
          if (blocked.has(finalExt(name))) return bad(400, `Rejected: .${finalExt(name)} files aren't allowed.\n`);
          stored.add(name);
          return ok(`Stored ${name}.\n`);
        }
        if (r.path.startsWith("/files/")) {
          const name = r.path.slice("/files/".length);
          if (!stored.has(name)) return notFound;
          // The server "runs" anything it treats as a script. Execution reaches /flag.
          return runs.has(finalExt(name)) ? ok(`Executed ${name}. Code execution achieved: ${flag}\n`) : ok("(file served as plain text)\n");
        }
        return notFound;
      };
      return { shell: attackBox({ "files.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s -d 'name=shell.phtml&body=x' files.lab/upload`, `curl -s files.lab/files/shell.phtml`, `submit ${w.flag}`],
    notEnough: () => [`curl -s -d 'name=shell.php&body=x' files.lab/upload`],
    debrief:
      "A blocklist of extensions always misses one the runtime still executes. Allowlist the exact types you mean to accept, and serve uploaded files from a store that never runs them, with a name you generate. Checking the extension at all is the wrong place to make this decision.",
  },
  {
    id: "break-upload-2",
    title: "Hide the extension that matters",
    brief:
      "`cdn.lab/upload` now blocks `php`, `phtml` and `php5`, and only looks at the final extension. But the server runs anything whose name contains `.php` at all. Get a script stored and run.",
    hints: [
      "Add a harmless-looking extension on the end: the check sees `.jpg`, but `.php` is still in the name.",
      "`name=shell.php.jpg` passes the check and still runs.",
      "`curl -s -d 'name=shell.php.jpg&body=x' cdn.lab/upload` then `curl -s cdn.lab/files/shell.php.jpg`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const blocked = new Set(["php", "phtml", "php5", "phar"]);
      const stored = new Set<string>();
      const site: Site = (r) => {
        if (r.path === "/upload" && r.method === "POST") {
          const name = r.form.name ?? "";
          if (blocked.has(finalExt(name))) return bad(400, `Rejected: .${finalExt(name)} isn't allowed.\n`);
          stored.add(name);
          return ok(`Stored ${name}.\n`);
        }
        if (r.path.startsWith("/files/")) {
          const name = r.path.slice("/files/".length);
          if (!stored.has(name)) return notFound;
          return /\.php(\.|$)/i.test(name) ? ok(`Executed ${name}. Code execution achieved: ${flag}\n`) : ok("(file served as plain text)\n");
        }
        return notFound;
      };
      return { shell: attackBox({ "cdn.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s -d 'name=shell.php.jpg&body=x' cdn.lab/upload`, `curl -s cdn.lab/files/shell.php.jpg`, `submit ${w.flag}`],
    notEnough: () => [`curl -s -d 'name=shell.phtml&body=x' cdn.lab/upload`],
    debrief:
      "Looking only at the final extension misses `.php` sitting earlier in the name, which some servers still execute. This is why the decision can't live in string-matching at all: generate your own filename, store it where nothing runs, and set the content type yourself.",
  },
];
