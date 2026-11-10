/**
 * LDAP injection, simulated. The toy server builds an LDAP search filter by
 * pasting your input into it, so a `*` becomes a wildcard the directory honours:
 * a password of `*` matches any stored value. A small filter evaluator below runs
 * against a directory array in the closure. The fix, in the debrief: escape the
 * filter metacharacters, or bind with a parameterised search.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, bad, notFound, token } from "./kit";
import type { Site } from "@/lib/shell/http";

type Entry = Record<string, string>;

/** A tiny LDAP filter evaluator: (&...), (|...), (!...) and (attr=value) with `*` wildcards. */
function evalFilter(filter: string, entry: Entry): boolean {
  let i = 0;
  const parse = (): boolean => {
    if (filter[i] !== "(") throw new Error("bad filter");
    i++;
    const op = filter[i];
    if (op === "&" || op === "|" || op === "!") {
      i++;
      const parts: boolean[] = [];
      while (filter[i] === "(") parts.push(parse());
      if (filter[i] !== ")") throw new Error("bad filter");
      i++;
      return op === "&" ? parts.every(Boolean) : op === "|" ? parts.some(Boolean) : !parts[0];
    }
    // a leaf: attr=value, up to the closing paren
    let leaf = "";
    while (i < filter.length && filter[i] !== ")") leaf += filter[i++];
    i++;
    const [attr, val = ""] = leaf.split("=");
    const have = entry[(attr ?? "").trim()];
    if (have === undefined) return false;
    if (val === "*") return true; // presence
    const re = new RegExp("^" + val.split("*").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
    return re.test(have);
  };
  try {
    return parse();
  } catch {
    return false;
  }
}

export const LDAP: Mission[] = [
  {
    id: "break-ldap-1",
    title: "A password that matches anything",
    brief:
      "`dir.lab/login` checks you against a directory with the LDAP filter `(&(uid=YOU)(userPassword=YOU))`, pasting your input in raw. In LDAP, `*` is a wildcard. Log in as `admin` without the password.",
    greeting: "LDAP injection: a `*` where a value should be means 'any value', so the password check matches whatever is stored.",
    hints: [
      "Leave the user as `admin`, and make the password a single `*`.",
      "`curl -s -d 'user=admin&pass=*' dir.lab/login`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const dir: Entry[] = [
        { uid: "admin", userPassword: token(rng), token: flag },
        { uid: "guest", userPassword: "guest", token: token(rng) },
      ];
      const site: Site = (r) => {
        if (r.path !== "/login" || r.method !== "POST") return notFound;
        const filter = `(&(uid=${r.form.user ?? ""})(userPassword=${r.form.pass ?? ""}))`;
        const hit = dir.find((e) => evalFilter(filter, e));
        return hit ? ok(`Bound as ${hit.uid}. Token: ${hit.token}\n`) : bad(401, "No match.\n");
      };
      return { shell: attackBox({ "dir.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s -d 'user=admin&pass=*' dir.lab/login`, `submit ${w.flag}`],
    notEnough: () => [`curl -s -d 'user=admin&pass=admin' dir.lab/login`],
    debrief:
      "Your `*` was read as 'any value', so the password condition always held. Escape LDAP filter metacharacters (`* ( ) \\ NUL`) in user input, or use a binding API that keeps input out of the filter. It's the injection pattern again, in a directory.",
  },
  {
    id: "break-ldap-2",
    title: "Bind as the first account",
    brief:
      "Same server, `dir.lab/login`. This time you don't even know a username. The directory lists the admin first. Make both halves of the filter match anything.",
    hints: [
      "A `*` in the user becomes `(uid=*)`, which matches every entry; the first is the admin.",
      "`curl -s -d 'user=*&pass=*' dir.lab/login`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const dir: Entry[] = [
        { uid: "sysadmin", userPassword: token(rng), token: flag },
        { uid: "intern", userPassword: token(rng), token: token(rng) },
      ];
      const site: Site = (r) => {
        if (r.path !== "/login" || r.method !== "POST") return notFound;
        const filter = `(&(uid=${r.form.user ?? ""})(userPassword=${r.form.pass ?? ""}))`;
        const hit = dir.find((e) => evalFilter(filter, e));
        return hit ? ok(`Bound as ${hit.uid}. Token: ${hit.token}\n`) : bad(401, "No match.\n");
      };
      return { shell: attackBox({ "dir.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s -d 'user=*&pass=*' dir.lab/login`, `submit ${w.flag}`],
    notEnough: () => [`curl -s -d 'user=admin&pass=*' dir.lab/login`],
    debrief:
      "Two wildcards made the whole filter true, and the directory returned its first entry, which is the most privileged. The fix is the same: never build a filter from raw input. Escape it, or search with a safe API and verify the password separately.",
  },
];
