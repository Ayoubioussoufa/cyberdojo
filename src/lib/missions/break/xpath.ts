/**
 * XPath injection, simulated. The app authenticates by building an XPath query
 * that pastes your input into a predicate, so a quote plus `or '1'='1'` makes the
 * predicate always true. A tiny predicate evaluator runs against a user list in
 * the closure. The fix, in the debrief: use parameterised XPath (variables), so
 * input is a value the query never parses.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, bad, notFound, token } from "./kit";
import type { Site } from "@/lib/shell/http";

type User = { name: string; pass: string; token: string };

/** Evaluate a predicate like `name='x' and pass='y'` (with or/and and string equality) for one user. */
function evalPredicate(pred: string, u: User): boolean {
  // Split on or/and keeping structure simple: handle `A or B`, then `A and B`.
  const orParts = pred.split(/\s+or\s+/i);
  return orParts.some((orPart) =>
    orPart.split(/\s+and\s+/i).every((term) => {
      const m = /^\s*(?:(\w+)|'([^']*)')\s*=\s*(?:(\w+)|'([^']*)')\s*$/.exec(term);
      if (!m) return false;
      const left = m[1] ? (u as Record<string, string>)[m[1]] ?? m[1] : (m[2] ?? "");
      const right = m[3] ? (u as Record<string, string>)[m[3]] ?? m[3] : (m[4] ?? "");
      return left === right;
    }),
  );
}

export const XPATH: Mission[] = [
  {
    id: "break-xpath-1",
    title: "Always-true in XML",
    brief:
      "`xml.lab/login` keeps its users in an XML file and checks you with the XPath `//user[name='YOU' and pass='YOU']`, pasting your input straight in. Break out of the string and make the predicate always true, to log in as the first user.",
    greeting: "XPath injection looks just like SQL injection: a quote ends the value, and `or '1'='1'` makes the whole test pass.",
    hints: [
      "Inject the same break-out into both fields, so a bare `'1'='1'` term is left over that is always true. A URL can't carry raw spaces, so use `%20`.",
      "Send `name=' or '1'='1` and `pass=' or '1'='1`, each written with `%20` for the spaces.",
      "`curl -s \"xml.lab/login?name='%20or%20'1'='1&pass='%20or%20'1'='1\"`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const users: User[] = [
        { name: "admin", pass: token(rng), token: flag },
        { name: "bob", pass: token(rng), token: token(rng) },
      ];
      const site: Site = (r) => {
        if (r.path !== "/login") return notFound;
        const pred = `name='${r.query.name ?? ""}' and pass='${r.query.pass ?? ""}'`;
        const hit = users.find((u) => evalPredicate(pred, u));
        return hit ? ok(`Logged in as ${hit.name}. Token: ${hit.token}\n`) : bad(401, "No match.\n");
      };
      return { shell: attackBox({ "xml.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s "xml.lab/login?name='%20or%20'1'='1&pass='%20or%20'1'='1"`, `submit ${w.flag}`],
    notEnough: () => [`curl -s "xml.lab/login?name=admin&pass=admin"`],
    debrief:
      "The `or '1'='1'` made the predicate true for every user, and the query returned the first. Use parameterised XPath (bind variables) so your input is a value, not part of the query, and escape quotes if the library forces you to build the string.",
  },
];
