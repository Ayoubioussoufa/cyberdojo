/**
 * Server-side request forgery, simulated. The toy server fetches a URL you give
 * it and shows you the result, so you can aim it at hosts only it can reach,
 * like a cloud metadata service. Every fetch here is answered from a small table
 * in the closure; nothing leaves the browser. The fix, in the debrief: allowlist
 * where the server may go, and block link-local and internal addresses.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, bad, notFound } from "./kit";
import type { Site } from "@/lib/shell/http";

export const SSRF: Mission[] = [
  {
    id: "break-ssrf-1",
    title: "Make the server fetch for you",
    brief:
      "`preview.lab/fetch?url=` grabs any URL and shows you the page, as a link-preview feature. The server sits inside a cloud network and can reach `http://169.254.169.254/`, the metadata service that hands out credentials. You can't reach it, but the server can. Ask it to.",
    greeting: "SSRF: you don't make the request, the server does, from where it sits, not where you sit.",
    hints: [
      "The metadata service lives at `169.254.169.254`. The token is at `/latest/meta-data/iam/token`.",
      "Point the feature there: `url=http://169.254.169.254/latest/meta-data/iam/token`.",
      "`curl -s \"preview.lab/fetch?url=http://169.254.169.254/latest/meta-data/iam/token\"`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      // What the server can reach internally, keyed by URL. The learner can't curl these directly.
      const internal: Record<string, string> = {
        "http://169.254.169.254/latest/meta-data/": "iam/\nhostname\ninstance-id\n",
        "http://169.254.169.254/latest/meta-data/iam/token": `${flag}\n`,
        "https://status.example/": "All systems normal.\n",
      };
      const site: Site = (r) => {
        if (r.path !== "/fetch") return notFound;
        const url = r.query.url ?? "";
        const body = internal[url];
        if (body === undefined) return bad(502, `Could not fetch ${url}\n`);
        return ok(`--- fetched ${url} ---\n${body}`);
      };
      return { shell: attackBox({ "preview.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s "preview.lab/fetch?url=http://169.254.169.254/latest/meta-data/iam/token"`, `submit ${w.flag}`],
    notEnough: () => [`curl -s "preview.lab/fetch?url=https://status.example/"`],
    debrief:
      "The server fetched an internal address on your behalf, and link-local `169.254.169.254` is the cloud metadata service that hands out role credentials. Allowlist the exact hosts the feature may reach, block link-local and private ranges, and require the metadata service's hardened mode (IMDSv2). You'll go deeper on this in Month 13.",
  },
];
