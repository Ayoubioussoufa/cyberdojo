/**
 * CRLF / HTTP response header injection, simulated. The toy server copies your
 * input into a response header without stripping line breaks, so a `%0d%0a` lets
 * you end its header and add one of your own. The fix, in the debrief: strip or
 * reject CR and LF in anything that goes into a header, or use an API that can't
 * emit raw header bytes.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, bad, notFound } from "./kit";
import type { Site } from "@/lib/shell/http";

export const CRLF: Mission[] = [
  {
    id: "break-crlf-1",
    title: "Smuggle a header",
    brief:
      "`track.lab/set?lang=` reflects your `lang` into a `Set-Cookie` header and never checks it for line breaks. The admin area trusts a cookie `role`. Inject a second header that sets `role=admin`, then the server tells you what landed.",
    greeting: "A carriage return and line feed (CRLF) end one header and start the next. If input isn't cleaned, you write your own headers.",
    hints: [
      "`%0d%0a` is a CRLF. After your language, add a line that sets another cookie.",
      "`lang=en%0d%0aSet-Cookie:%20role=admin` ends the lang cookie and adds a role cookie.",
      "`curl -s \"track.lab/set?lang=en%0d%0aSet-Cookie:%20role=admin\"`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const site: Site = (r) => {
        if (r.path !== "/set") return notFound;
        const lang = r.query.lang ?? "en";
        // The bug: the value goes into a header with its line breaks intact.
        const injected = lang.includes("\r\n") || lang.includes("\n");
        const extraSetsAdmin = /set-cookie:\s*role=admin/i.test(lang);
        if (injected && extraSetsAdmin) {
          return ok(`Response splitting worked. Your injected header set role=admin. Flag: ${flag}\n`);
        }
        return ok(`Language set to ${lang.replace(/[\r\n].*/s, "")}. (no injection)\n`);
      };
      return { shell: attackBox({ "track.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s "track.lab/set?lang=en%0d%0aSet-Cookie:%20role=admin"`, `submit ${w.flag}`],
    notEnough: () => [`curl -s "track.lab/set?lang=en"`],
    debrief:
      "Your CRLF closed the server's header and opened one of your own, which is header injection (and, with a body, response splitting). Strip or reject CR and LF in any value that reaches a header, and prefer a framework API that encodes header values for you.",
  },
];
