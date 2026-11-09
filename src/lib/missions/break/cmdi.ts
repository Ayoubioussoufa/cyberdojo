/**
 * Command injection, simulated. The toy server builds a shell command by pasting
 * your input into a string and running it, so a `;` lets you append a command of
 * your own. A tiny fake shell below runs only against an in-memory disk; nothing
 * touches the real system. The fix, in the debrief: never build a shell string
 * from input. Call the program directly with an argument list, so there is no
 * shell to inject into.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, notFound, token } from "./kit";
import type { Site } from "@/lib/shell/http";

/**
 * A toy `sh -c` for the lab: it knows `ping`, `cat`, `id` and `whoami`, splits on
 * `;`, `&&`, `||` and `|`, and expands one `$(...)` or backtick group. It reads a
 * fixed in-memory disk and can do nothing else.
 */
function fakeShell(cmd: string, disk: Record<string, string>): string {
  const run1 = (c: string): string => {
    const t = c.trim();
    const m = /^cat\s+(\S+)/.exec(t);
    if (m) return disk[m[1] as string] ?? `cat: ${m[1]}: No such file or directory\n`;
    if (/^ping\b/.test(t)) {
      const host = t.split(/\s+/).pop() ?? "";
      return `PING ${host}: 56 data bytes\n64 bytes from ${host}: icmp_seq=0 time=0.1 ms\n`;
    }
    if (/^host\b/.test(t)) {
      const name = t.split(/\s+/).slice(1).join(" ");
      return `${name} has address 93.184.216.34\n`;
    }
    if (t === "id") return "uid=33(www-data) gid=33(www-data) groups=33(www-data)\n";
    if (t === "whoami") return "www-data\n";
    if (t === "") return "";
    return `sh: ${t.split(/\s+/)[0]}: command not found\n`;
  };
  const expand = (c: string): string =>
    c.replace(/\$\(([^)]*)\)|`([^`]*)`/g, (_, a: string, b: string) => fakeShell(a ?? b, disk).replace(/\n+$/, ""));
  return cmd
    .split(/\s*(?:;|&&|\|\||\|)\s*/)
    .map((seg) => run1(expand(seg)))
    .join("");
}

export const CMDI: Mission[] = [
  {
    id: "break-cmdi-1",
    title: "Smuggle a second command",
    brief:
      "`net.lab/ping?host=` lets staff check if a host is up. The server runs `ping -c1 <host>` as a shell command, with your `host` pasted straight in. Run a command of your own and read `/flag`.",
    greeting: "Command injection. The server hands your text to a shell, and a shell treats `;` as 'now run this next'.",
    hints: [
      "`;` ends one command and starts another. After a real host, add your own.",
      "A URL can't carry raw spaces, so write them as `%20`: `host=127.0.0.1;cat%20/flag`.",
      "`curl -s \"net.lab/ping?host=127.0.0.1;cat%20/flag\"`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const disk: Record<string, string> = { "/flag": `${flag}\n`, "/etc/hostname": "net-tools-01\n" };
      const site: Site = (r) => {
        if (r.path !== "/ping") return notFound;
        const host = r.query.host ?? "";
        return ok(fakeShell(`ping -c1 ${host}`, disk));
      };
      return { shell: attackBox({ "net.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s "net.lab/ping?host=127.0.0.1;cat%20/flag"`, `submit ${w.flag}`],
    notEnough: () => [`curl -s "net.lab/ping?host=127.0.0.1"`],
    debrief:
      "`;cat /flag` ran because your input became part of a shell line. Run the program directly with an argument list (`execFile('ping', ['-c1', host])`): with no shell, `;` is just a character in a hostname, and the whole class of bug disappears.",
  },
  {
    id: "break-cmdi-2",
    title: "Inject inside the arguments",
    brief:
      "`tools.lab/lookup?domain=` runs `host <domain>` and the developer added a filter that rejects `;`, `&` and `|`. It forgot that a shell also runs `$(...)`. Read `/flag` anyway.",
    hints: [
      "`$(command)` runs a command and drops its output in place, no `;` needed.",
      "Wrap the URL in single quotes so your own shell leaves `$(...)` alone and sends it to the server. Encode the space as `%20`.",
      "`curl -s 'tools.lab/lookup?domain=$(cat%20/flag)'`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const disk: Record<string, string> = { "/flag": `${flag}\n` };
      const blocked = /[;&|]/;
      const site: Site = (r) => {
        if (r.path !== "/lookup") return notFound;
        const domain = r.query.domain ?? "";
        if (blocked.test(domain)) return ok("Rejected: that character isn't allowed.\n");
        const out = fakeShell(`host ${domain}`, disk);
        return ok(out);
      };
      return { shell: attackBox({ "tools.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s 'tools.lab/lookup?domain=$(cat%20/flag)'`, `submit ${w.flag}`],
    notEnough: () => [`curl -s "tools.lab/lookup?domain=example.com;cat%20/flag"`],
    debrief:
      "Blocking `;` and `|` still leaves `$(...)`, backticks, newlines and more. Filtering shell metacharacters is a losing game. The fix is the same as before: don't invoke a shell at all, and pass the input as a single argument the shell never parses.",
  },
];
