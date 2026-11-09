/**
 * Broken authentication and access control, simulated. These toy servers check
 * that you are logged in, then forget to check that the thing you asked for is
 * yours, or they trust something the client fully controls. The fix threads
 * through every debrief: decide access from the server's own session, and check
 * ownership on every object, every time.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, bad, notFound } from "./kit";
import type { Site } from "@/lib/shell/http";

export const AUTH: Mission[] = [
  {
    id: "break-auth-1",
    title: "Read someone else's invoice",
    brief:
      "`billing.lab/invoice?id=4187` shows your own invoice. The number is just an id, and the server never checks whose invoice it is. The CEO's invoice is a lower number and carries a reference code. Go and read it.",
    greeting: "An insecure direct object reference (IDOR): the object id is in your hands, and nothing checks ownership.",
    hints: [
      "Your id is 4187. Older accounts have smaller ids. The CEO is account 1000.",
      "Just change the number: `id=1000`.",
      "`curl -s \"billing.lab/invoice?id=1000\"`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const invoices: Record<string, string> = {
        "1000": `CEO — annual bonus. Reference ${flag}\n`,
        "4187": `You — monthly plan, 12.00 paid.\n`,
      };
      const site: Site = (r) => {
        if (r.path !== "/invoice") return notFound;
        const id = r.query.id ?? "";
        const inv = invoices[id];
        return inv === undefined ? bad(404, "No such invoice.\n") : ok(inv);
      };
      return { shell: attackBox({ "billing.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s "billing.lab/invoice?id=1000"`, `submit ${w.flag}`],
    notEnough: () => [`curl -s "billing.lab/invoice?id=4187"`],
    debrief:
      "You proved who you are, then read an object that wasn't yours, because the server tied access to the login but not to the row. Every object lookup needs its own check: `WHERE id = ? AND owner = <the session's user>`.",
  },
  {
    id: "break-auth-2",
    title: "Promote yourself",
    brief:
      "`app.lab` hands you a cookie `role=user` when you log in, and `GET /admin` lets you in when that cookie says `admin`. The cookie is a plain value the server trusts. Change it.",
    hints: [
      "You set your own cookies. Send one that says `role=admin`.",
      "`-b` sends a cookie with the request.",
      "`curl -s -b \"role=admin\" app.lab/admin`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const site: Site = (r) => {
        if (r.path === "/login") return { status: 200, headers: [["Set-Cookie", "role=user; Path=/"]], body: "Logged in as a normal user.\n" };
        if (r.path === "/admin") return r.cookies.role === "admin" ? ok(`Admin dashboard. Flag: ${flag}\n`) : bad(403, "Admins only.\n");
        return notFound;
      };
      return { shell: attackBox({ "app.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s -b "role=admin" app.lab/admin`, `submit ${w.flag}`],
    notEnough: () => [`curl -s -b "role=user" app.lab/admin`],
    debrief:
      "The role lived in a cookie the client controls, so changing it changed your access. Keep the role on the server, tied to a session id the client can't forge, or sign the cookie so tampering is detected. Never trust a plain client-side value for authorisation.",
  },
  {
    id: "break-auth-3",
    title: "Pretend to be local",
    brief:
      "`ops.lab/panel` is 'internal only': it grants admin when the request comes from `127.0.0.1`. To decide that, it reads the `X-Forwarded-For` header, which any client can set. Convince it you're local.",
    hints: [
      "`X-Forwarded-For` is just a header the server chose to trust. You can send any value.",
      "`-H` adds a header.",
      "`curl -s -H \"X-Forwarded-For: 127.0.0.1\" ops.lab/panel`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const site: Site = (r) => {
        if (r.path !== "/panel") return notFound;
        const xff = r.headers["x-forwarded-for"] ?? "203.0.113.9";
        return xff.split(",")[0]?.trim() === "127.0.0.1" ? ok(`Internal panel. Flag: ${flag}\n`) : bad(403, `Blocked: you appear to come from ${xff}.\n`);
      };
      return { shell: attackBox({ "ops.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s -H "X-Forwarded-For: 127.0.0.1" ops.lab/panel`, `submit ${w.flag}`],
    notEnough: () => [`curl -s ops.lab/panel`],
    debrief:
      "`X-Forwarded-For` is set by clients and proxies, so trusting it for access control lets anyone claim any address. Decide 'internal' from the real connection, from an authenticated session, or from network rules the request can't rewrite, never from a header.",
  },
];
