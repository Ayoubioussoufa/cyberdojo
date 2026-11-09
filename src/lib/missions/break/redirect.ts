/**
 * Open redirect, simulated. The toy server sends users wherever a `url`
 * parameter says, with no check that the destination is one of its own pages.
 * An attacker uses that to send a victim from a trusted link to a hostile site,
 * carrying trust (and sometimes a token) with them. The fix, in the debrief:
 * only ever redirect to a path on your own site, or an allowlisted host.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, bad, notFound } from "./kit";
import type { Site } from "@/lib/shell/http";

export const REDIRECT: Mission[] = [
  {
    id: "break-redirect-1",
    title: "Send the victim anywhere",
    brief:
      "`portal.lab/go?url=` redirects you after login, to whatever `url` holds. It never checks the destination, so a link to `portal.lab` can bounce a victim to any site. Make it redirect off-site, to `https://evil.example/`, and read what the server leaks when it does.",
    greeting: "Open redirect: the link looks like it goes to the trusted site, but the trusted site forwards it anywhere.",
    hints: [
      "Point the redirect off-site: `url=https://evil.example/`.",
      "Use `-s` to read the body; the server spells out what a phished user would have handed you.",
      "`curl -s \"portal.lab/go?url=https://evil.example/\"`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const onSite = (u: string) => u.startsWith("/") || /^https?:\/\/portal\.lab(\/|$)/.test(u);
      const site: Site = (r) => {
        if (r.path !== "/go") return notFound;
        const url = r.query.url ?? "";
        if (!url) return bad(400, "Missing url.\n");
        if (onSite(url)) return { status: 302, headers: [["Location", url]], body: "Redirecting you within the site.\n" };
        const host = /^https?:\/\/([^/]+)/.exec(url)?.[1] ?? url;
        return {
          status: 302,
          headers: [["Location", url]],
          body: `Open redirect confirmed. A phished user following portal.lab/go would land on ${host}, carrying their session. Leaked token: ${flag}\n`,
        };
      };
      return { shell: attackBox({ "portal.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s "portal.lab/go?url=https://evil.example/"`, `submit ${w.flag}`],
    notEnough: () => [`curl -s "portal.lab/go?url=/dashboard"`],
    debrief:
      "The redirect trusted the whole URL, so the trusted domain became a springboard to a hostile one, which is gold for phishing. Redirect only to a relative path on your own site, or match the destination against a strict allowlist of hosts. Never feed a user-supplied URL straight into `Location`.",
  },
];
