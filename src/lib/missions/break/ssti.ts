/**
 * Server-side template injection (SSTI), simulated. The toy app builds its
 * template by pasting your input into the template source, so `{{ ... }}` you
 * send is evaluated by the engine instead of printed. A tiny evaluator below
 * handles only `{{ a*b }}` arithmetic and a short list of variables, against
 * data in the closure. The fix, in the debrief: render user input as data, never
 * concatenate it into the template.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, notFound } from "./kit";
import type { Site } from "@/lib/shell/http";

/** Evaluate the `{{ ... }}` groups in a template string against a small context. */
function render(tpl: string, ctx: Record<string, unknown>): string {
  return tpl.replace(/\{\{\s*([^}]*?)\s*\}\}/g, (_, expr: string) => {
    const e = (expr as string).trim();
    const arith = /^(\d+)\s*([*+\-])\s*(\d+)$/.exec(e);
    if (arith) {
      const a = Number(arith[1]);
      const b = Number(arith[3]);
      return String(arith[2] === "*" ? a * b : arith[2] === "+" ? a + b : a - b);
    }
    // A dotted lookup into the context, e.g. config.secret
    let node: unknown = ctx;
    for (const part of e.split(".")) {
      if (node && typeof node === "object" && part in (node as Record<string, unknown>)) node = (node as Record<string, unknown>)[part];
      else return "";
    }
    return typeof node === "string" || typeof node === "number" ? String(node) : "";
  });
}

export const SSTI: Mission[] = [
  {
    id: "break-ssti-1",
    title: "Prove the template runs your input",
    brief:
      "`greet.lab/hello?name=` says `Hello <name>`, and it builds that by pasting your name into the template source. So `{{ ... }}` you send is evaluated, not printed. First prove it with some maths, then read the `flag` variable the template can see.",
    greeting: "SSTI: your input lands in the template itself, so the engine runs it. `{{7*7}}` coming back as 49 is the classic tell.",
    hints: [
      "Send `name={{7*7}}`. If the page says `Hello 49`, the engine ran your expression.",
      "The template has a variable called `flag` in scope. Ask for it: `name={{flag}}`.",
      "`curl -s \"greet.lab/hello?name={{flag}}\"`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const site: Site = (r) => {
        if (r.path !== "/hello") return notFound;
        const name = r.query.name ?? "";
        return ok(`${render(`Hello ${name}`, { flag })}\n`);
      };
      return { shell: attackBox({ "greet.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s "greet.lab/hello?name={{7*7}}"`, `curl -s "greet.lab/hello?name={{flag}}"`, `submit ${w.flag}`],
    notEnough: () => [`curl -s "greet.lab/hello?name=world"`],
    debrief:
      "Your `{{flag}}` ran because your input was part of the template, not a value passed to it. Pass user data as a variable the engine escapes (`render(tpl, { name })`), and never build the template string by concatenation. A sandboxed engine is a weak second line, not the fix.",
  },
  {
    id: "break-ssti-2",
    title: "Get around the word filter",
    brief:
      "`card.lab/hi?name=` learned that `{{flag}}` is dangerous and strips the word `flag` from your input. The same secret is also reachable as `config.secret`. Read it anyway.",
    hints: [
      "The filter only removes the literal word `flag`. Reach the value by another name.",
      "`config.secret` holds the same value: `name={{config.secret}}`.",
      "`curl -s \"card.lab/hi?name={{config.secret}}\"`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const site: Site = (r) => {
        if (r.path !== "/hi") return notFound;
        const name = (r.query.name ?? "").replace(/flag/gi, "");
        return ok(`${render(`Hi ${name}`, { flag, config: { secret: flag } })}\n`);
      };
      return { shell: attackBox({ "card.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s "card.lab/hi?name={{config.secret}}"`, `submit ${w.flag}`],
    notEnough: () => [`curl -s "card.lab/hi?name={{flag}}"`],
    debrief:
      "Blocking the word `flag` did nothing: the same data was one more name away, and real template engines expose dozens of paths to objects, classes and the runtime. Filtering template syntax is hopeless. Keep input out of the template source entirely.",
  },
];
