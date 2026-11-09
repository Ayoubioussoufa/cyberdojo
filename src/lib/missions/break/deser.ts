/**
 * Insecure deserialization, simulated. The toy server stores your session as a
 * base64 blob and trusts whatever it decodes, so you can rebuild the blob to say
 * whatever you like: a higher role, or a field that makes the server do something
 * it shouldn't. Everything runs against data in the closure. The fix, in the
 * debrief: sign the state so tampering is caught, and never act on a type or path
 * that came from the client.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, bad, notFound } from "./kit";
import type { Site } from "@/lib/shell/http";

/** The toy "serialization": base64 of `k=v;k=v` pairs. */
const decode = (b64: string): Record<string, string> => {
  const out: Record<string, string> = {};
  let text = "";
  try {
    text = Buffer.from(b64, "base64").toString("utf8");
  } catch {
    return out;
  }
  for (const pair of text.split(";")) {
    const at = pair.indexOf("=");
    if (at > 0) out[pair.slice(0, at).trim()] = pair.slice(at + 1).trim();
  }
  return out;
};
const encode = (obj: Record<string, string>) => Buffer.from(Object.entries(obj).map(([k, v]) => `${k}=${v}`).join(";"), "utf8").toString("base64");

export const DESER: Mission[] = [
  {
    id: "break-deser-1",
    title: "Rewrite your own session",
    brief:
      "`store.lab/login` gives you a `session` cookie: a base64 blob the server decodes and trusts, with no signature. `GET /account` reads your role from it. Decode the blob, change your role, and send it back.",
    greeting: "The session is state the server handed you and then believed. With no signature, you own it.",
    hints: [
      "Log in, then decode the cookie: `curl -i` to see it, then `base64 -d` to read it. It's `user=...;role=user`.",
      "Build a new blob that says `role=admin` and send it with `-b`.",
      "`curl -s -b \"session=$(echo -n 'user=guest;role=admin' | base64)\" store.lab/account`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const session = encode({ user: "guest", role: "user" });
      const site: Site = (r) => {
        if (r.path === "/login") return { status: 200, headers: [["Set-Cookie", `session=${session}; Path=/`]], body: "Logged in as guest.\n" };
        if (r.path === "/account") {
          const s = decode(r.cookies.session ?? "");
          return s.role === "admin" ? ok(`Admin account. Flag: ${flag}\n`) : bad(403, `You are '${s.role ?? "nobody"}'. Admins only.\n`);
        }
        return notFound;
      };
      return { shell: attackBox({ "store.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s -b "session=$(echo -n 'user=guest;role=admin' | base64)" store.lab/account`, `submit ${w.flag}`],
    notEnough: () => [`curl -s store.lab/account`],
    debrief:
      "Because the blob wasn't signed, rewriting it rewrote your access. Sign serialized state with a server-only key and verify the signature before trusting a byte of it, or keep the session server-side and hand the client only an opaque id.",
  },
  {
    id: "break-deser-2",
    title: "Turn the object into an action",
    brief:
      "`notes.lab` stores your preferences in a trusted base64 blob too, as `view=profile`. The server's loader has a dangerous shortcut: if `view=file`, it opens whatever `path=` says. Make it open `/flag`.",
    hints: [
      "The blob is just fields. Add the ones the shortcut looks for: `view=file;path=/flag`.",
      "`curl -s -b \"prefs=$(echo -n 'view=file;path=/flag' | base64)\" notes.lab/open`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const disk: Record<string, string> = { "/flag": `${flag}\n` };
      const site: Site = (r) => {
        if (r.path !== "/open") return notFound;
        const p = decode(r.cookies.prefs ?? "");
        if (p.view === "file" && p.path) {
          const content = disk[p.path];
          return content === undefined ? bad(404, `No such file: ${p.path}\n`) : ok(content);
        }
        return ok(`Showing your ${p.view ?? "profile"} view.\n`);
      };
      return { shell: attackBox({ "notes.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s -b "prefs=$(echo -n 'view=file;path=/flag' | base64)" notes.lab/open`, `submit ${w.flag}`],
    notEnough: () => [`curl -s -b "prefs=$(echo -n 'view=profile' | base64)" notes.lab/open`],
    debrief:
      "A field you controlled chose what the server did, and then another chose which file: that is the heart of an object-injection gadget. Never let deserialized data pick a type, a class, a path or a callback. Sign the state, and keep the loader to a fixed set of safe shapes.",
  },
];
