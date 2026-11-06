/** Reading a database with SELECT. Original exercises on the topics of pwn.college's SQL Playground. */
import type { Rng } from "@/lib/rng";
import { sqlite3, type Cell, type Table } from "@/lib/shell/sql";
import { flagFrom, submitted, type Built, type Mission } from "../kit";
import { ana, tool } from "./kit";

const DB = "/home/ana/vault.db";

function box(tables: Table[]) {
  const shell = ana();
  shell.fs.put(DB, "SQLite format 3\0", { owner: "ana", mode: 0o644 });
  tool(shell, "sqlite3", sqlite3({ [DB]: tables }));
  return shell;
}

const secrets = (rows: Cell[][]): Table => ({ name: "secrets", columns: [["id", "INTEGER"], ["tag", "TEXT"], ["value", "TEXT"]], rows });

const TAGS = ["note", "memo", "draft", "todo", "misc"];
const WORDS = ["renew the license", "order more toner", "call the vendor", "update the wiki", "water the plant"];

const filler = (rng: Rng, n: number, from = 1): Cell[][] => Array.from({ length: n }, (_, i) => [from + i, rng.pick(TAGS), rng.pick(WORDS)]);

const q = (sql: string) => `sqlite3 vault.db "${sql}"`;

const withFlag = (rng: Rng, row: (id: number, flag: string) => Cell[], extra: Cell[][] = []): Built => {
  const flag = flagFrom(rng);
  const rows = [...filler(rng, 300), ...extra];
  const id = rng.int(1, rows.length);
  rows.splice(id - 1, 0, row(id, flag));
  rows.forEach((r, i) => (r[0] = i + 1));
  return { shell: box([secrets(rows)]), flag };
};

export const SQL: Mission[] = [
  {
    id: "dojo-sql-1",
    title: "Ask for everything",
    brief: "`vault.db` holds a table called `secrets` with one row. Read all of it. The shape is `sqlite3 vault.db \"SELECT * FROM secrets\"`, where `*` means every column.",
    hints: ["Type the example from the brief exactly."],
    build: (rng) => {
      const flag = flagFrom(rng);
      return { shell: box([secrets([[1, "flag", flag]])]), flag };
    },
    passed: submitted,
    solve: (w) => [q("SELECT * FROM secrets"), `submit ${w.flag}`],
    debrief: "`SELECT what FROM where`. Columns print with `|` between them. Nearly every web application you'll meet runs on statements like this one.",
  },
  {
    id: "dojo-sql-2",
    title: "Filter the rows",
    brief: "Now there are hundreds of rows. Exactly one has the tag `flag`. Add a `WHERE` clause so only that row comes back.",
    hints: ["Text values go in single quotes.", "`sqlite3 vault.db \"SELECT * FROM secrets WHERE tag = 'flag'\"`"],
    build: (rng) => withFlag(rng, (id, flag) => [id, "flag", flag]),
    passed: submitted,
    solve: (w) => [q("SELECT * FROM secrets WHERE tag = 'flag'"), `submit ${w.flag}`],
    debrief: "`WHERE` runs against each row. On a real database an index makes this fast, and without one the server reads the whole table, so a slow query can become a denial of service.",
  },
  {
    id: "dojo-sql-3",
    title: "Everything except the decoys",
    brief: "This table holds two rows that look like flags: one tagged `decoy` and one tagged `live`. Other rows are noise. Keep the flag-shaped values, and exclude the decoy.",
    hints: ["`!=` means not equal, and `LIKE 'CD{%'` matches values that start with `CD{`.", "`AND` requires both conditions."],
    build: (rng) => withFlag(rng, (id, flag) => [id, "live", flag], [[0, "decoy", flagFrom(rng)]]),
    passed: submitted,
    solve: (w) => [q("SELECT value FROM secrets WHERE value LIKE 'CD{%' AND tag != 'decoy'"), `submit ${w.flag}`],
    debrief: "`LIKE` matches patterns: `%` is any run of characters and `_` is one. It ignores case for ASCII, which surprises people, and a leading `%` can't use an index.",
  },
  {
    id: "dojo-sql-4",
    title: "A needle inside a long value",
    brief: "One row has the tag `blob`. Its value is 400 characters long, and the flag is the 14 characters starting at position 121. Use `substr(value, start, length)` to print only that part.",
    hints: ["Positions start at 1.", "`SELECT substr(value, 121, 14) FROM secrets WHERE tag = 'blob'`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const pad = (n: number) => Array.from({ length: n }, () => "CD{}abcdefgh0123"[rng.int(0, 15)]).join("");
      const blob = `${pad(120)}${flag}${pad(280 - flag.length)}`;
      return { shell: box([secrets([...filler(rng, 50), [51, "blob", blob]])]), flag };
    },
    passed: submitted,
    solve: (w) => [q("SELECT substr(value, 121, 14) FROM secrets WHERE tag = 'blob'"), `submit ${w.flag}`],
    debrief: "SQL can compute as well as filter. `substr` is also what blind data extraction relies on, one character at a time, which is one more reason for parameterised queries.",
  },
  {
    id: "dojo-sql-5",
    title: "Both conditions, in the right order",
    brief: "In table `logins`, find the one row where `user` is `root`, `ok` is `1`, and `country` is either `RU` or `KP`. Submit its `ip`. `AND` binds tighter than `OR`, so use parentheses.",
    hints: ["`WHERE user = 'root' AND ok = 1 AND (country = 'RU' OR country = 'KP')`", "Or use `country IN ('RU', 'KP')`."],
    build: (rng) => {
      const ip = `203.0.113.${rng.int(2, 250)}`;
      const rows: Cell[][] = [];
      for (let i = 0; i < 200; i++) rows.push([rng.pick(["root", "ana", "svc"]), 0, rng.pick(["RU", "KP", "FR", "MA"]), `198.51.100.${rng.int(2, 250)}`]);
      for (let i = 0; i < 50; i++) rows.push([rng.pick(["ana", "svc"]), 1, rng.pick(["RU", "KP"]), `192.0.2.${rng.int(2, 250)}`]);
      for (let i = 0; i < 20; i++) rows.push(["root", 1, rng.pick(["FR", "MA"]), `10.0.0.${rng.int(2, 250)}`]);
      rows.push(["root", 1, rng.pick(["RU", "KP"]), ip]);
      return { shell: box([{ name: "logins", columns: [["user", "TEXT"], ["ok", "INTEGER"], ["country", "TEXT"], ["ip", "TEXT"]], rows: rng.shuffle(rows) }]), flag: ip };
    },
    passed: submitted,
    solve: (w) => [q("SELECT ip FROM logins WHERE user = 'root' AND ok = 1 AND (country = 'RU' OR country = 'KP')"), `submit ${w.flag}`],
    debrief: "Without the parentheses, this query also returns every Korean login for any user. That's how a detection rule quietly matches the wrong thing, and an analyst always tests a rule on known data.",
  },
  {
    id: "dojo-sql-6",
    title: "Only the latest",
    brief: "Table `tokens` has many rows, each with a `created` time. Only the newest token is valid. Sort so the newest comes first, take one row, and submit its `token`.",
    hints: ["`ORDER BY created DESC` sorts newest first.", "`LIMIT 1` stops after one row."],
    build: (rng) => {
      const flag = flagFrom(rng);
      const rows: Cell[][] = Array.from({ length: 120 }, (_, i) => [1000 + i, flagFrom(rng)]);
      rows.push([5000, flag]);
      return { shell: box([{ name: "tokens", columns: [["created", "INTEGER"], ["token", "TEXT"]], rows: rng.shuffle(rows) }]), flag };
    },
    passed: submitted,
    solve: (w) => [q("SELECT token FROM tokens ORDER BY created DESC LIMIT 1"), `submit ${w.flag}`],
    debrief: "A table has no built-in order. Without `ORDER BY`, rows come back in whatever order the engine finds convenient, so `LIMIT` alone proves nothing.",
  },
  {
    id: "dojo-sql-7",
    title: "How many?",
    brief: "In table `events`, count the rows where `action` is `delete`. Don't count by eye. Submit the number.",
    hints: ["`count(*)` counts rows.", "`SELECT count(*) FROM events WHERE action = 'delete'`"],
    build: (rng) => {
      const n = rng.int(17, 60);
      const rows: Cell[][] = Array.from({ length: 300 }, (): Cell[] => [rng.pick(["read", "write", "login"])]);
      for (let i = 0; i < n; i++) rows.push(["delete"]);
      return { shell: box([{ name: "events", columns: [["action", "TEXT"]], rows: rng.shuffle(rows) }]), flag: String(n) };
    },
    passed: submitted,
    solve: (w) => [q("SELECT count(*) FROM events WHERE action = 'delete'"), `submit ${w.flag}`],
    debrief: "Counting is how a hunch becomes a finding: 300 deletes in a minute from one account means more than the sight of any single row.",
  },
  {
    id: "dojo-sql-8",
    title: "What tables exist?",
    brief: "This time you don't know the table's name. Every SQLite file keeps a catalogue of itself in `sqlite_master`. Find the table's name there, then read the table.",
    hints: ["`SELECT name FROM sqlite_master WHERE type = 'table'`", "Then `SELECT * FROM` that name."],
    build: (rng) => {
      const flag = flagFrom(rng);
      const name = `archive_${rng.int(1000, 9999)}`;
      return { shell: box([{ name, columns: [["data", "TEXT"]], rows: [[flag]] }]), flag, state: { name } };
    },
    passed: submitted,
    solve: (w) => [q("SELECT name FROM sqlite_master WHERE type = 'table'"), q(`SELECT * FROM ${w.state?.name as string}`), `submit ${w.flag}`],
    debrief: "Databases describe themselves: `sqlite_master` here, `information_schema` on MySQL and PostgreSQL. It's useful when you audit an unknown system, and it's why an injection flaw exposes every table, not just the one in the query.",
  },
];
