/**
 * Path traversal, simulated. The toy server joins your filename onto a base
 * directory and opens whatever that points at, so `../` walks up and out of the
 * folder it meant to serve. The fix, in the debrief: resolve the path, then
 * check it still sits inside the allowed directory before opening it.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, bad, notFound, token } from "./kit";
import type { Site } from "@/lib/shell/http";

/** The server's "disk": a web root plus files it should never serve. */
function fakeDisk(flag: string, secret: string): Record<string, string> {
  return {
    "/srv/www/index.html": "<h1>Docs</h1>\n",
    "/srv/www/help.txt": "Call the help desk on extension 200.\n",
    "/etc/passwd": "root:x:0:0:root:/root:/bin/bash\nana:x:1000:1000::/home/ana:/bin/bash\n",
    "/srv/secret/config.env": `DB_PASSWORD=${secret}\nFLAG=${flag}\n`,
  };
}

/** Join like a careless server: base + "/" + the raw name, then collapse ".." steps. */
function resolveNaive(base: string, name: string): string {
  const parts = `${base}/${name}`.split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (p === "" || p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return `/${out.join("/")}`;
}

export const TRAVERSAL: Mission[] = [
  {
    id: "break-traversal-1",
    title: "Step outside the folder",
    brief:
      "`docs.lab/download?file=` serves files from `/srv/www`. It pastes your `file` onto that folder and opens the result. Read `/etc/passwd`, which is nowhere near the web root.",
    greeting: "Path traversal. `../` means 'up one folder', and the server never checks where you end up.",
    hints: [
      "Each `../` climbs one directory. From `/srv/www` you need to climb to `/`, then go down to `etc/passwd`.",
      "`file=../../etc/passwd` resolves to `/etc/passwd`.",
      "`curl -s \"docs.lab/download?file=../../etc/passwd\"`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const disk = fakeDisk(flag, token(rng));
      // The flag is proven by reading /etc/passwd first; the real prize is the config, but passwd confirms the climb.
      disk["/etc/passwd"] = `root:x:0:0:root:/root:/bin/bash\n# access note: ${flag}\n`;
      const site: Site = (r) => {
        if (r.path !== "/download") return notFound;
        const target = resolveNaive("/srv/www", r.query.file ?? "");
        const content = disk[target];
        return content === undefined ? bad(404, `No such file: ${target}\n`) : ok(content);
      };
      return { shell: attackBox({ "docs.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s "docs.lab/download?file=../../etc/passwd"`, `submit ${w.flag}`],
    notEnough: () => [`curl -s "docs.lab/download?file=help.txt"`],
    debrief:
      "Your `../../` walked out of `/srv/www` and the server opened whatever you named. The fix is to resolve the final path and confirm it still starts with the allowed directory, rejecting it otherwise. An allowlist of names is stronger still.",
  },
  {
    id: "break-traversal-2",
    title: "Reach the secret config",
    brief:
      "Same server, `docs.lab/download?file=`. The app's database password sits in `/srv/secret/config.env`, outside the web root. Read it, and submit the `FLAG=` value inside.",
    hints: [
      "You're serving from `/srv/www`. Climb up to `/srv`, then down into `secret/config.env`.",
      "`file=../secret/config.env` resolves to `/srv/secret/config.env`.",
      "`curl -s \"docs.lab/download?file=../secret/config.env\"`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const disk = fakeDisk(flag, token(rng));
      const site: Site = (r) => {
        if (r.path !== "/download") return notFound;
        const target = resolveNaive("/srv/www", r.query.file ?? "");
        const content = disk[target];
        return content === undefined ? bad(404, `No such file: ${target}\n`) : ok(content);
      };
      return { shell: attackBox({ "docs.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s "docs.lab/download?file=../secret/config.env"`, `submit ${w.flag}`],
    notEnough: () => [`curl -s "docs.lab/download?file=../../etc/passwd"`],
    debrief:
      "A secret outside the web root is still reachable the moment traversal works, so 'put it in a different folder' is not a control. Keep secrets out of files the web process can open at all, and validate the resolved path against an allowlist.",
  },
];
