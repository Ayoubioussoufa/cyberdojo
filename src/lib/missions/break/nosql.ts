/**
 * NoSQL injection, simulated. The toy server takes a JSON login body and drops
 * your values straight into a document-database query, so where it expects a
 * string you can send a query operator like `{"$ne": null}` that matches
 * anything. The lookup runs against an array in the closure. The fix, in the
 * debrief: force the fields to the types you expect before they reach the query.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, bad, notFound } from "./kit";
import type { Site } from "@/lib/shell/http";

type Cond = string | { $ne?: unknown; $gt?: unknown; $regex?: string };

/** Does a stored value satisfy a condition that may be a string or a query operator? */
function matches(value: string, cond: Cond): boolean {
  if (typeof cond === "string") return value === cond;
  if (cond && typeof cond === "object") {
    if ("$ne" in cond) return value !== cond.$ne;
    if ("$gt" in cond) return value > String(cond.$gt);
    if ("$regex" in cond) return new RegExp(cond.$regex as string).test(value);
  }
  return false;
}

export const NOSQL: Mission[] = [
  {
    id: "break-nosql-1",
    title: "A password that is always right",
    brief:
      "`api.lab/login` takes a JSON body `{\"user\":\"...\",\"pass\":\"...\"}` and looks the account up in a document database. It never checks that your values are strings, so where it wants a password you can send an operator that matches any value. Log in as `admin`.",
    greeting: "NoSQL injection: `{\"$ne\": null}` means 'not equal to null', which every real password is, so the check passes.",
    hints: [
      "Send JSON, and make the password an operator instead of a string: `{\"$ne\": null}`.",
      "Set the content type so the server parses it as JSON.",
      "`curl -s -d '{\"user\":\"admin\",\"pass\":{\"$ne\":null}}' -H 'Content-Type: application/json' api.lab/login`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const token = flagFrom(rng);
      const accounts = [
        { user: "admin", pass: flagFrom(rng).slice(3, 13), token: flag },
        { user: "guest", pass: "guest", token },
      ];
      const site: Site = (r) => {
        if (r.path !== "/login" || r.method !== "POST") return notFound;
        let q: { user?: Cond; pass?: Cond };
        try {
          q = JSON.parse(r.body) as typeof q;
        } catch {
          return bad(400, "Invalid JSON.\n");
        }
        const hit = accounts.find((a) => q.user !== undefined && q.pass !== undefined && matches(a.user, q.user) && matches(a.pass, q.pass));
        if (!hit) return bad(401, "Login failed.\n");
        return ok(`Welcome, ${hit.user}. Session token: ${hit.token}\n`);
      };
      return { shell: attackBox({ "api.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s -d '{"user":"admin","pass":{"$ne":null}}' -H 'Content-Type: application/json' api.lab/login`, `submit ${w.flag}`],
    notEnough: () => [`curl -s -d '{"user":"admin","pass":"admin"}' -H 'Content-Type: application/json' api.lab/login`],
    debrief:
      "The database compared the stored password against an operator, not a string, so the match always held. Coerce every field to the type you expect before it reaches the query (`String(pass)`), reject non-string credentials, and validate the body against a schema. The lesson is the same as SQL injection: never let input decide the shape of a query.",
  },
];
