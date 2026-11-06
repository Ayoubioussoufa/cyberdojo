/** HTTP by hand with curl, against simulated servers. Original exercises on the topics of pwn.college's Talking Web. */
import { curl, type Req, type Res, type Site } from "@/lib/shell/http";
import type { Shell } from "@/lib/shell/shell";
import type { Rng } from "@/lib/rng";
import { flagFrom, submitted, type Mission } from "../kit";
import { ana, tool } from "./kit";

const page = (body: string, headers: [string, string][] = []): Res => ({ status: 200, headers, body });
const missing: Res = { status: 404, body: "<h1>404 Not Found</h1>\n" };

function webBox(sites: Record<string, Site>): Shell {
  const shell = ana();
  tool(shell, "curl", curl(sites));
  return shell;
}

const token = (rng: Rng, n = 8) => Array.from({ length: n }, () => "abcdefghjkmnpqrstuvwxyz23456789"[rng.int(0, 30)]).join("");

export const WEB: Mission[] = [
  {
    id: "dojo-web-1",
    title: "Your first request",
    brief: "A web server runs at `intranet.lab`. A browser is just a program that sends text requests. Send one yourself with `curl` and read the answer.",
    hints: ["`curl http://intranet.lab/`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      return { shell: webBox({ "intranet.lab": () => page(`<h1>Welcome</h1>\n<p>Today's code: ${flag}</p>\n`) }), flag };
    },
    passed: submitted,
    solve: (w) => ["curl http://intranet.lab/", `submit ${w.flag}`],
    debrief: "Everything a browser shows starts as text like this. `curl` lets you see it with nothing added and nothing hidden, so it's the tool to reach for when a site behaves strangely.",
  },
  {
    id: "dojo-web-2",
    title: "What the page doesn't show",
    brief: "`http://intranet.lab/` looks like a plain welcome page in a browser. But a browser hides HTML comments, and `curl` doesn't. Find the comment.",
    hints: ["Comments look like `<!-- like this -->`.", "`curl -s http://intranet.lab/ | grep '<!--'`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const filler = Array.from({ length: 60 }, (_, i) => `<p>Staff notice ${i}: the canteen opens at nine.</p>\n`);
      filler.splice(rng.int(5, 55), 0, `<!-- todo before launch: remove ${flag} -->\n`);
      return { shell: webBox({ "intranet.lab": () => page(`<h1>Welcome</h1>\n${filler.join("")}`) }), flag };
    },
    passed: submitted,
    solve: (w) => ["curl -s http://intranet.lab/ | grep '<!--'", `submit ${w.flag}`],
    debrief: "Comments are sent to every visitor. Leaving credentials or internal notes in them is a common finding, and it's why a security review reads the source, not the rendered page.",
  },
  {
    id: "dojo-web-3",
    title: "Read the headers",
    brief: "The body of `http://intranet.lab/health` says only `ok`. Each response also carries headers: metadata the browser reads and doesn't show you. One holds the flag.",
    hints: ["`-i` includes the response headers in the output.", "`curl -i http://intranet.lab/health`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      return { shell: webBox({ "intranet.lab": (r) => (r.path === "/health" ? page("ok\n", [["Server", "nginx"], ["X-Debug-Token", flag]]) : missing) }), flag };
    },
    passed: submitted,
    solve: (w) => ["curl -i http://intranet.lab/health", `submit ${w.flag}`],
    debrief: "Headers carry cookies, redirects and security policy. A leftover debug header is a real leak, and headers like `Server` tell an attacker what to look up.",
  },
  {
    id: "dojo-web-4",
    title: "Read the server's source",
    brief: "`server.py` in your home folder is the source of the app at `app.lab`. It has one route nobody linked to. Read the code, find the path, and request it.",
    hints: ["`cat server.py`, and look at the `@app.route` lines.", "`curl http://app.lab/<the path you found>`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const route = `/maintenance-${token(rng, 6)}`;
      const shell = webBox({ "app.lab": (r) => (r.path === route ? page(`${flag}\n`) : r.path === "/" ? page("Nothing to see here.\n") : missing) });
      shell.fs.put("/home/ana/server.py", `from flask import Flask\napp = Flask(__name__)\n\n@app.route("/")\ndef home():\n    return "Nothing to see here."\n\n@app.route("${route}")\ndef maintenance():\n    return open("/flag").read()\n`, { owner: "ana" });
      return { shell, flag, state: { route } };
    },
    passed: submitted,
    solve: (w) => ["cat server.py", `curl http://app.lab${w.state?.route as string}`, `submit ${w.flag}`],
    debrief: "Hiding a page by not linking to it protects nothing. Anyone who guesses or finds the path gets it, so every route needs its own access check.",
  },
  {
    id: "dojo-web-5",
    title: "One address, many sites",
    brief: "The server at `10.0.0.8` hosts several sites. It decides which to serve from the `Host` header. Ask for `admin.lab` on that address.",
    hints: ["`-H` adds a header to your request.", "`curl -H 'Host: admin.lab' http://10.0.0.8/`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      return { shell: webBox({ "10.0.0.8": (r) => (r.headers.host === "admin.lab" ? page(`Admin console. ${flag}\n`) : page(`Default site. Host seen: ${r.headers.host}\n`)) }), flag };
    },
    passed: submitted,
    solve: (w) => ["curl -H 'Host: admin.lab' http://10.0.0.8/", `submit ${w.flag}`],
    debrief: "This is virtual hosting, and it's why thousands of sites can share one IP. The client controls this header, so an internal site that trusts it can be reached by anyone who asks for it by name.",
  },
  {
    id: "dojo-web-6",
    title: "Spaces don't travel",
    brief: "There's a file at the path `/annual report` on `files.lab`. Try it as is, see what `curl` says, then write the space the way URLs do.",
    hints: ["URLs can't contain a raw space. It's written `%20`.", "`curl 'http://files.lab/annual%20report'`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      return { shell: webBox({ "files.lab": (r) => (r.path === "/annual report" ? page(`Revenue up. ${flag}\n`) : missing) }), flag };
    },
    passed: submitted,
    solve: (w) => ["curl 'http://files.lab/annual%20report'", `submit ${w.flag}`],
    debrief: "Percent-encoding writes a byte as `%` plus its hex value. Attackers use it to slip past filters that check text before it's decoded, so filters must run after decoding.",
  },
  {
    id: "dojo-web-7",
    title: "Ask with parameters",
    brief: "`http://shop.lab/lookup` needs two query parameters: `user=ana` and `ticket`, whose value is in `ticket.txt`. The `&` between them means something to the shell, so quote the URL.",
    hints: ["Parameters go after `?`, joined with `&`.", "`curl \"http://shop.lab/lookup?user=ana&ticket=$(cat ticket.txt)\"`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const ticket = token(rng);
      const shell = webBox({ "shop.lab": (r) => {
        if (r.path !== "/lookup") return missing;
        if (r.query.user !== "ana") return { status: 400, body: "Missing or wrong: user\n" };
        return r.query.ticket === ticket ? page(`Order found. ${flag}\n`) : { status: 400, body: "Missing or wrong: ticket\n" };
      } });
      shell.fs.put("/home/ana/ticket.txt", `${ticket}\n`, { owner: "ana" });
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ['curl "http://shop.lab/lookup?user=ana&ticket=$(cat ticket.txt)"', `submit ${w.flag}`],
    debrief: "Without quotes, the shell sees `&` and runs the first half in the background, which drops the second parameter. Query strings also land in server logs, so secrets don't belong in them.",
  },
  {
    id: "dojo-web-8",
    title: "Submit a form",
    brief: "`http://shop.lab/login` shows a form. Read its HTML to learn the field names, then send it as your browser would, with a POST. Your details are in `creds.txt`.",
    hints: ["`curl http://shop.lab/login` shows the form.", "`-d` sends form data and switches to POST.", "`curl -d 'username=ana&pin=...' http://shop.lab/login`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const pin = String(rng.int(1000, 9999));
      const form = `<form method="post" action="/login">\n  <input name="username">\n  <input name="pin" type="password">\n</form>\n`;
      const shell = webBox({ "shop.lab": (r) => {
        if (r.path !== "/login") return missing;
        if (r.method !== "POST") return page(form);
        return r.form.username === "ana" && r.form.pin === pin ? page(`Welcome, ana. ${flag}\n`) : { status: 401, body: "Wrong details.\n" };
      } });
      shell.fs.put("/home/ana/creds.txt", `username: ana\npin: ${pin}\n`, { owner: "ana" });
      return { shell, flag, state: { pin } };
    },
    passed: submitted,
    solve: (w) => ["curl http://shop.lab/login", "cat creds.txt", `curl -d 'username=ana&pin=${w.state?.pin as string}' http://shop.lab/login`, `submit ${w.flag}`],
    debrief: "A form is a formatted POST body. Nothing forces a client to use your page, so a check done only in the browser's JavaScript protects nothing. The server has to validate everything.",
  },
  {
    id: "dojo-web-9",
    title: "Follow the redirects",
    brief: "`http://old.lab/start` has moved, and moved again. By default `curl` shows you the first answer and stops. Look at the redirect with `-i`, then make `curl` follow it to the end.",
    hints: ["`-L` follows `Location` headers.", "`curl -L http://old.lab/start`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const hops = [`/step-${token(rng, 4)}`, `/step-${token(rng, 4)}`, `/step-${token(rng, 4)}`];
      const moved = (to: string): Res => ({ status: 302, headers: [["Location", to]], body: "" });
      return { shell: webBox({ "old.lab": (r) => {
        if (r.path === "/start") return moved(hops[0] as string);
        if (r.path === hops[0]) return moved(hops[1] as string);
        if (r.path === hops[1]) return moved(hops[2] as string);
        return r.path === hops[2] ? page(`You made it. ${flag}\n`) : missing;
      } }), flag };
    },
    passed: submitted,
    solve: (w) => ["curl -i http://old.lab/start", "curl -L http://old.lab/start", `submit ${w.flag}`],
    debrief: "When a phishing link goes through a chain of redirects, `curl -sIL` shows each hop without ever opening the page in a browser.",
  },
  {
    id: "dojo-web-10",
    title: "Stay logged in",
    brief: "HTTP forgets you between requests, so `http://bank.lab/login` gives you a cookie. Log in with `user=ana&pin=4417`, saving the cookie to `jar.txt`, then send it to `http://bank.lab/account`.",
    hints: ["`-c jar.txt` saves cookies. `-b jar.txt` sends them.", "`curl -c jar.txt -d 'user=ana&pin=4417' http://bank.lab/login`", "`curl -b jar.txt http://bank.lab/account`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const session = token(rng, 16);
      return { shell: webBox({ "bank.lab": (r: Req) => {
        if (r.path === "/login" && r.method === "POST") {
          return r.form.user === "ana" && r.form.pin === "4417"
            ? { status: 200, headers: [["Set-Cookie", `session=${session}; Path=/; HttpOnly`]], body: "Logged in.\n" }
            : { status: 401, body: "Wrong details.\n" };
        }
        if (r.path === "/account") return r.cookies.session === session ? page(`Balance: 1,204.50. Reference ${flag}\n`) : { status: 401, body: "Please log in first.\n" };
        return missing;
      } }), flag };
    },
    passed: submitted,
    solve: (w) => ["curl -c jar.txt -d 'user=ana&pin=4417' http://bank.lab/login", "curl -b jar.txt http://bank.lab/account", `submit ${w.flag}`],
    debrief: "That cookie is the login: whoever holds it is you, with no password needed. So cookies get `HttpOnly`, `Secure` and `SameSite`, and this site stores only a hash of its session tokens.",
  },
];
