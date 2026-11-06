/**
 * Access control: who may do what, and how to check it. Original exercises on
 * the topics of pwn.college's Access Control module, from the auditor's side.
 */
import type { Rng } from "@/lib/rng";
import { flagFrom, submitted, type Mission } from "../kit";
import { ana } from "./kit";

/** Levels are numbers so that awk can compare them. */
const LEVELS = "0 = public\n1 = internal\n2 = secret\n3 = top secret\n";

function docs(rng: Rng, n: number, cats = false) {
  return Array.from({ length: n }, (_, i) => {
    const level = rng.int(0, 3);
    return cats ? `doc${i},${level},${rng.pick(["OPS", "NET", "OPS+NET", "CRYPTO", "NET+CRYPTO", "OPS+HR"])}` : `doc${i},${level}`;
  });
}

const countWhere = (rows: string[], fn: (f: string[]) => boolean) => String(rows.filter((r) => fn(r.split(","))).length);

export const ACCESS: Mission[] = [
  {
    id: "dojo-access-1",
    title: "The right group",
    brief: "`/srv/reports` holds many files, and you can read only those belonging to your group `audit`. List what you belong to, find the one file in that group, and read it.",
    hints: ["`find /srv/reports -group audit`", "Then `cat` the path it prints."],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana([{ name: "sam", uid: 1001 }], ["audit", "finance"], ["audit"]);
      shell.fs.dir("/srv", { mode: 0o755 });
      shell.fs.dir("/srv/reports", { mode: 0o755 });
      const n = rng.int(10, 30);
      for (let i = 0; i < 40; i++) shell.fs.put(`/srv/reports/r${i}.txt`, i === n ? `${flag}\n` : "closed\n", { owner: "sam", group: i === n ? "audit" : "finance", mode: 0o640 });
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["id", "cat $(find /srv/reports -group audit)", `submit ${w.flag}`],
    debrief: "The kernel checks owner, then group, then others, and stops at the first class that applies. This model is discretionary: an owner can share as they like, which is exactly what stricter models take away.",
  },
  {
    id: "dojo-access-2",
    title: "Read your own sudo rules",
    brief: "Before you use a privilege, find out what you have. List your `sudo` rights, then use the one that lets you read `/root/flag`.",
    hints: ["`sudo -l`", "`sudo cat /root/flag`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      shell.fs.dir("/root", { mode: 0o700 });
      shell.fs.put("/root/flag", `${flag}\n`, { mode: 0o600 });
      shell.sudoRules.ana = ["/usr/bin/cat"];
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["sudo -l", "sudo cat /root/flag", `submit ${w.flag}`],
    debrief: "`sudo cat` was probably granted to read one log. It reads everything, including `/etc/shadow`. A rule should name the exact file, or better, a wrapper that does only the one job.",
  },
  {
    id: "dojo-access-3",
    title: "No read up",
    brief: "In a mandatory model, an administrator sets labels and owners can't override them. Under Bell-LaPadula you may read only at your level or below. `docs.csv` lists `name,level`, your clearance is 2, and `levels.txt` explains the numbers. How many documents may you read?",
    hints: ["`awk -F, '$2 <= 2' docs.csv` keeps the rows you may read.", "Pipe into `wc -l`."],
    build: (rng) => {
      const rows = docs(rng, 120);
      const shell = ana();
      shell.fs.put("/home/ana/docs.csv", `${rows.join("\n")}\n`, { owner: "ana" });
      shell.fs.put("/home/ana/levels.txt", LEVELS, { owner: "ana" });
      return { shell, flag: countWhere(rows, (f) => Number(f[1]) <= 2) };
    },
    passed: submitted,
    solve: (w) => ["awk -F, '$2 <= 2' docs.csv | wc -l", `submit ${w.flag}`],
    debrief: "No read up keeps secrets away from people without clearance. Unlike file permissions, even the owner of a document can't grant an exception.",
  },
  {
    id: "dojo-access-4",
    title: "No write down",
    brief: "The second rule is the surprising one: you may write only at your level or above. With clearance 2, in how many documents of `docs.csv` may you write?",
    hints: ["This time the comparison goes the other way.", "`awk -F, '$2 >= 2' docs.csv | wc -l`"],
    build: (rng) => {
      const rows = docs(rng, 120);
      const shell = ana();
      shell.fs.put("/home/ana/docs.csv", `${rows.join("\n")}\n`, { owner: "ana" });
      return { shell, flag: countWhere(rows, (f) => Number(f[1]) >= 2) };
    },
    passed: submitted,
    solve: (w) => ["awk -F, '$2 >= 2' docs.csv | wc -l", `submit ${w.flag}`],
    debrief: "No write down stops a cleared person, or malware running as them, from copying a secret into a public file. It protects against leaks even when the user is compromised.",
  },
  {
    id: "dojo-access-5",
    title: "Need to know",
    brief: "Levels aren't enough: labels also carry categories. Rows are now `name,level,categories`. You have clearance 2 with categories `OPS` and `NET`, so you may read a document if its level is at most 2 and it has no category beyond those two. How many?",
    hints: ["Filter the level, then remove the rows with other categories.", "`awk -F, '$2 <= 2' docs.csv | grep -vE 'CRYPTO|HR' | wc -l`"],
    build: (rng) => {
      const rows = docs(rng, 150, true);
      const shell = ana();
      shell.fs.put("/home/ana/docs.csv", `${rows.join("\n")}\n`, { owner: "ana" });
      return { shell, flag: countWhere(rows, (f) => Number(f[1]) <= 2 && !/CRYPTO|HR/.test(f[2] as string)) };
    },
    passed: submitted,
    solve: (w) => ["awk -F, '$2 <= 2' docs.csv | grep -vE 'CRYPTO|HR' | wc -l", `submit ${w.flag}`],
    debrief: "This is least privilege as a formula. SELinux applies the same idea on Linux: a process labelled for a web server can't touch a database's files, even when it runs as root.",
  },
];
