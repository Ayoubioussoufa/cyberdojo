/**
 * Cross-site scripting, simulated. The toy server reflects your input back into
 * the page without encoding it. A tiny "victim" stands in for a logged-in admin
 * whose browser would run whatever script reaches it: when your input survives
 * into the page as something a browser would execute, the victim's session token
 * leaks back to you. The fix, every time: encode output for its context, and set
 * a Content-Security-Policy so injected script has nothing to run.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, notFound } from "./kit";
import type { Site } from "@/lib/shell/http";

/**
 * Would a browser execute script in this reflected HTML? A deliberately simple
 * check for teaching: a live <script> block, or an element with an on* handler,
 * or a javascript: URL. It only ever runs against the simulated response.
 */
const executes = (html: string): boolean =>
  /<script[\s>][^]*?<\/script\s*>/i.test(html) || /<[a-z][^>]*\son\w+\s*=/i.test(html) || /<[a-z][^>]*\b(?:src|href)\s*=\s*["']?\s*javascript:/i.test(html);

/** The admin "sees" the page; if script runs, their token comes back to you. */
const victim = (reflected: string, flag: string): string =>
  executes(reflected)
    ? `Your script ran in the admin's browser. Their stolen session token: ${flag}\n`
    : "The admin viewed the page. Nothing ran: the input showed up as plain text.\n";

export const XSS: Mission[] = [
  {
    id: "break-xss-1",
    title: "Find the reflection",
    brief:
      "`search.lab` echoes your search term straight back into the page: `GET /find?q=` puts `q` inside the results with no encoding. An admin reviews flagged searches at `/review`. Get a script to run in their browser.",
    greeting: "Reflected XSS. The page pastes your input into HTML as-is, so HTML you send becomes part of the page.",
    hints: [
      "Send HTML, not plain words. A `<script>` tag in `q` will be written into the page unchanged.",
      "Spaces aren't needed here. Try `q=<script>steal()</script>`.",
      "`curl -s \"search.lab/find?q=<script>steal()</script>\"` then `curl -s search.lab/review`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      let lastReflected = "";
      const site: Site = (r) => {
        if (r.path === "/find") {
          const q = r.query.q ?? "";
          lastReflected = `<h1>Results for ${q}</h1>\n<p>No products matched.</p>\n`;
          return ok(lastReflected);
        }
        if (r.path === "/review") return ok(victim(lastReflected, flag));
        return notFound;
      };
      return { shell: attackBox({ "search.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s "search.lab/find?q=<script>steal()</script>"`, "curl -s search.lab/review", `submit ${w.flag}`],
    notEnough: () => [`curl -s "search.lab/find?q=hello"`, "curl -s search.lab/review"],
    debrief:
      "The page wrote your `<script>` as code because it never encoded the output. Encoding `<` as `&lt;` on the way out would have shown your tag as text. A Content-Security-Policy that forbids inline script is the second layer.",
  },
  {
    id: "break-xss-2",
    title: "Get around the filter",
    brief:
      "`blog.lab/comment?text=` learned its lesson about `<script>` and strips that exact tag before showing your comment. It strips it only once, and it does nothing about anything else. The admin reads new comments at `/moderate`. Still get code to run.",
    hints: [
      "You don't need a `<script>` tag at all. An image that fails to load can run code: `<img src=x onerror=steal()>`.",
      "Or defeat the one-pass strip: `<scr<script>ipt>` leaves a real `<script>` behind after the middle one is removed.",
      "`curl -s \"blog.lab/comment?text=<img%20src=x%20onerror=steal()>\"` then `curl -s blog.lab/moderate`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      let lastReflected = "";
      const strip = (s: string) => s.replace(/<script>/i, "").replace(/<\/script>/i, "");
      const site: Site = (r) => {
        if (r.path === "/comment") {
          const text = strip(r.query.text ?? "");
          lastReflected = `<div class="comment">${text}</div>\n`;
          return ok(`Comment posted.\n${lastReflected}`);
        }
        if (r.path === "/moderate") return ok(victim(lastReflected, flag));
        return notFound;
      };
      return { shell: attackBox({ "blog.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s "blog.lab/comment?text=<img%20src=x%20onerror=steal()>"`, "curl -s blog.lab/moderate", `submit ${w.flag}`],
    notEnough: () => [`curl -s "blog.lab/comment?text=<script>steal()</script>"`, "curl -s blog.lab/moderate"],
    debrief:
      "A blocklist that removes `<script>` misses `onerror`, `onload`, `javascript:` and dozens more, and a single pass can be defeated by nesting. Never sanitise by subtraction. Encode for the output context, or build HTML with a library that encodes for you.",
  },
];
