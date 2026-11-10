/**
 * GraphQL abuse, simulated. The toy API leaves introspection on, so you can ask
 * it to describe its own schema and discover fields that were never meant to be
 * public, then query them. A tiny responder in the closure answers a couple of
 * query shapes. The fix, in the debrief: turn introspection off in production and
 * put authorisation on every field, not just the UI.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, bad, notFound } from "./kit";
import type { Site } from "@/lib/shell/http";

export const GRAPHQL: Mission[] = [
  {
    id: "break-graphql-1",
    title: "Ask the API what it hides",
    brief:
      "`gql.lab/graphql` is a GraphQL endpoint with introspection left on. The public app only shows `me` and `products`, but the schema lists more. Send an introspection query to see every field, then query the one that doesn't belong.",
    greeting: "GraphQL can describe itself. Introspection in production hands an attacker the full map, including fields the UI never calls.",
    hints: [
      "Ask for the query type's fields: `{\"query\":\"{ __schema { queryType { fields { name } } } }\"}`.",
      "One field stands out. Query it directly, e.g. `{\"query\":\"{ auditLog }\"}`.",
      "`curl -s -d '{\"query\":\"{ __schema { queryType { fields { name } } } }\"}' -H 'Content-Type: application/json' gql.lab/graphql`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const fields = ["me", "products", "auditLog"];
      const site: Site = (r) => {
        if (r.path !== "/graphql" || r.method !== "POST") return notFound;
        let q = "";
        try {
          q = (JSON.parse(r.body) as { query?: string }).query ?? "";
        } catch {
          return bad(400, "Invalid JSON.\n");
        }
        if (/__schema/.test(q)) return ok(JSON.stringify({ data: { __schema: { queryType: { fields: fields.map((name) => ({ name })) } } } }) + "\n");
        if (/\bauditLog\b/.test(q)) return ok(JSON.stringify({ data: { auditLog: `admin actions; internal note ${flag}` } }) + "\n");
        if (/\bme\b/.test(q)) return ok(JSON.stringify({ data: { me: { name: "guest" } } }) + "\n");
        if (/\bproducts\b/.test(q)) return ok(JSON.stringify({ data: { products: ["mug", "notebook"] } }) + "\n");
        return bad(400, "Cannot query that field.\n");
      };
      return { shell: attackBox({ "gql.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [
      `curl -s -d '{"query":"{ __schema { queryType { fields { name } } } }"}' -H 'Content-Type: application/json' gql.lab/graphql`,
      `curl -s -d '{"query":"{ auditLog }"}' -H 'Content-Type: application/json' gql.lab/graphql`,
      `submit ${w.flag}`,
    ],
    notEnough: () => [`curl -s -d '{"query":"{ products }"}' -H 'Content-Type: application/json' gql.lab/graphql`],
    debrief:
      "Introspection drew you a map straight to a field the UI never exposes, and the field had no access check of its own. Disable introspection in production, and authorise every resolver: hiding a field from the client is not hiding it from a query.",
  },
];
