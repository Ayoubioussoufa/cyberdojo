/**
 * A curl for the terminal, talking to small simulated web servers. Nothing
 * leaves the browser. scripts/check-sim-tools.ts runs the same sites on a real
 * HTTP server with the real curl, and the output must match.
 */
import type { Ctx, Result } from "./commands";
import type { Program } from "./shell";

export interface Req {
  method: string;
  /** The path as sent, still percent-encoded. */
  rawPath: string;
  /** Percent-decoded. */
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: string;
  form: Record<string, string>;
  cookies: Record<string, string>;
}

export interface Res {
  status: number;
  /** Order is kept, and one name can repeat, as Set-Cookie does. */
  headers?: [string, string][];
  body?: string;
}

export type Site = (req: Req) => Res;

const REASON: Record<number, string> = { 200: "OK", 201: "Created", 301: "Moved Permanently", 302: "Found", 303: "See Other", 307: "Temporary Redirect", 400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 405: "Method Not Allowed" };

const plus = (s: string) => {
  try {
    return decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return s;
  }
};

export const parseForm = (s: string) => {
  const out: Record<string, string> = {};
  for (const pair of s.split("&")) {
    if (!pair) continue;
    const at = pair.indexOf("=");
    out[plus(at < 0 ? pair : pair.slice(0, at))] = at < 0 ? "" : plus(pair.slice(at + 1));
  }
  return out;
};

export const parseCookies = (s: string) => {
  const out: Record<string, string> = {};
  for (const part of s.split(";")) {
    const at = part.indexOf("=");
    if (at > 0) out[part.slice(0, at).trim()] = part.slice(at + 1).trim();
  }
  return out;
};

export function makeReq(method: string, target: string, headers: Record<string, string>, body: string): Req {
  const [rawPath = "/", qs = ""] = target.split(/\?(.*)/s);
  let path = rawPath;
  try {
    path = decodeURIComponent(rawPath);
  } catch {
    // Keep it raw, as a server would.
  }
  return { method, rawPath, path, query: parseForm(qs), headers, body, form: headers["content-type"]?.startsWith("application/x-www-form-urlencoded") ? parseForm(body) : {}, cookies: parseCookies(headers.cookie ?? "") };
}

interface Options {
  urls: string[];
  method: string | null;
  include: boolean;
  head: boolean;
  silent: boolean;
  verbose: boolean;
  follow: boolean;
  get: boolean;
  headers: [string, string][];
  data: string[];
  cookie: string | null;
  jar: string | null;
  output: string | null;
  agent: string;
}

const VALUE = new Set(["X", "H", "d", "b", "c", "o", "A", "--request", "--header", "--data", "--data-raw", "--data-urlencode", "--cookie", "--cookie-jar", "--output", "--user-agent"]);

function options(args: string[]): Options | string {
  const o: Options = { urls: [], method: null, include: false, head: false, silent: false, verbose: false, follow: false, get: false, headers: [], data: [], cookie: null, jar: null, output: null, agent: "curl/8.5.0" };
  const take = (f: string, v: string): string | void => {
    if (f === "X" || f === "--request") o.method = v;
    else if (f === "H" || f === "--header") {
      const at = v.indexOf(":");
      if (at > 0) o.headers.push([v.slice(0, at).trim(), v.slice(at + 1).trim()]);
    } else if (f === "d" || f === "--data" || f === "--data-raw") o.data.push(v);
    else if (f === "--data-urlencode") {
      const at = v.indexOf("=");
      o.data.push(at < 0 ? encodeURIComponent(v) : `${v.slice(0, at)}=${encodeURIComponent(v.slice(at + 1))}`);
    } else if (f === "b" || f === "--cookie") o.cookie = v;
    else if (f === "c" || f === "--cookie-jar") o.jar = v;
    else if (f === "o" || f === "--output") o.output = v;
    else if (f === "A" || f === "--user-agent") o.agent = v;
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i] as string;
    if (a.startsWith("--")) {
      if (VALUE.has(a)) {
        const v = args[++i];
        if (v === undefined) return `curl: option ${a}: requires parameter`;
        take(a, v);
      } else if (a === "--include") o.include = true;
      else if (a === "--head") o.head = true;
      else if (a === "--silent") o.silent = true;
      else if (a === "--verbose") o.verbose = true;
      else if (a === "--location") o.follow = true;
      else if (a === "--get") o.get = true;
      else if (a !== "--show-error" && a !== "--fail") return `curl: option ${a}: is unknown`;
    } else if (a.startsWith("-") && a.length > 1) {
      for (let j = 1; j < a.length; j++) {
        const f = a[j] as string;
        if (VALUE.has(f)) {
          const inline = a.slice(j + 1);
          const v = inline || args[++i];
          if (v === undefined) return `curl: option -${f}: requires parameter`;
          take(f, v);
          break;
        }
        if (f === "i") o.include = true;
        else if (f === "I") o.head = true;
        else if (f === "s") o.silent = true;
        else if (f === "v") o.verbose = true;
        else if (f === "L") o.follow = true;
        else if (f === "G") o.get = true;
        else if (f !== "S" && f !== "f") return `curl: option -${f}: is unknown`;
      }
    } else o.urls.push(a);
  }
  return o;
}

const URL_RE = /^(?:(https?):\/\/)?([^/?#:\s]+(?::\d+)?)([^#]*)/;

const jarFile = (host: string, cookies: Map<string, string>) =>
  `# Netscape HTTP Cookie File\n# https://curl.se/docs/http-cookies.html\n# This file was generated by libcurl! Edit at your own risk.\n\n${[...cookies].map(([k, v]) => `${host.split(":")[0]}\tFALSE\t/\tFALSE\t0\t${k}\t${v}\n`).join("")}`;

/** Installs `curl` for these hosts. A key may include a port. */
export function curl(sites: Record<string, Site>): Program {
  return (ctx: Ctx): Result => {
    const fail = (stderr: string, code: number, stdout = ""): Result => ({ stdout, stderr, code });
    const o = options(ctx.args);
    if (typeof o === "string") return fail(`${o}\ncurl: try 'curl --help' for more information\n`, 2);
    const first = o.urls[0];
    if (!first) return fail("curl: try 'curl --help' or 'curl --manual' for more information\n", 2);

    const here = (p: string) => (p.startsWith("/") ? p : `${ctx.shell.cwd}/${p}`.replace(/\/+/g, "/"));
    const jar = new Map<string, string>();
    const engine = o.cookie !== null || o.jar !== null;
    if (o.cookie !== null) {
      if (o.cookie.includes("=")) for (const [k, v] of Object.entries(parseCookies(o.cookie))) jar.set(k, v);
      else {
        let text = "";
        try {
          text = ctx.shell.fs.lookup(here(o.cookie), ctx.shell.cwd, ctx.creds).content ?? "";
        } catch {
          // A missing jar is an empty jar, as on real curl.
        }
        for (const line of text.split("\n")) {
          const f = line.split("\t");
          if (f.length === 7 && !line.startsWith("# ")) jar.set(f[5] as string, f[6] as string);
        }
      }
    }

    let url = first;
    let method = o.method ?? (o.head ? "HEAD" : o.data.length && !o.get ? "POST" : "GET");
    let body = o.get ? "" : o.data.join("&");
    if (o.get && o.data.length) url += `${url.includes("?") ? "&" : "?"}${o.data.join("&")}`;
    let stdout = "";
    let stderr = "";

    for (let hop = 0; hop < 50; hop++) {
      if (/\s/.test(url)) return fail(o.silent ? "" : "curl: (3) URL rejected: Malformed input to a URL function\n", 3, stdout);
      const m = URL_RE.exec(url);
      if (!m) return fail(o.silent ? "" : `curl: (3) URL rejected: Bad hostname\n`, 3, stdout);
      const host = m[2] as string;
      const target = m[3] && m[3].startsWith("/") ? (m[3] as string) : `/${m[3] ?? ""}`;
      const site = sites[host];
      if (!site) return fail(o.silent ? "" : `curl: (6) Could not resolve host: ${host.split(":")[0]}\n`, 6, stdout);

      const headers: [string, string][] = [["Host", host], ["User-Agent", o.agent], ["Accept", "*/*"]];
      for (const [k, v] of o.headers) {
        const at = headers.findIndex(([h]) => h.toLowerCase() === k.toLowerCase());
        if (at >= 0) headers[at] = [k, v];
        else headers.push([k, v]);
      }
      if (body) {
        if (!headers.some(([h]) => h.toLowerCase() === "content-type")) headers.push(["Content-Type", "application/x-www-form-urlencoded"]);
        headers.push(["Content-Length", String(new TextEncoder().encode(body).length)]);
      }
      if (jar.size && !o.headers.some(([k]) => k.toLowerCase() === "cookie")) headers.push(["Cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; ")]);

      if (o.verbose) stderr += `> ${method} ${target} HTTP/1.1\n${headers.map(([k, v]) => `> ${k}: ${v}\n`).join("")}>\n`;
      const lower = Object.fromEntries(headers.map(([k, v]) => [k.toLowerCase(), v]));
      const res = site(makeReq(method, target, lower, body));
      const text = method === "HEAD" ? "" : (res.body ?? "");
      const rh: [string, string][] = [...(res.headers ?? [])];
      if (!rh.some(([k]) => k.toLowerCase() === "content-type")) rh.push(["Content-Type", "text/html; charset=utf-8"]);
      if (!rh.some(([k]) => k.toLowerCase() === "content-length")) rh.push(["Content-Length", String(new TextEncoder().encode(res.body ?? "").length)]);
      const status = `HTTP/1.1 ${res.status} ${REASON[res.status] ?? ""}`.trimEnd();
      const head = `${status}\n${rh.map(([k, v]) => `${k}: ${v}\n`).join("")}\n`;
      if (o.verbose) stderr += head.split("\n").slice(0, -1).map((l) => `< ${l}\n`).join("");
      if (o.include || o.head) stdout += head;

      if (engine) {
        for (const [k, v] of rh) {
          if (k.toLowerCase() !== "set-cookie") continue;
          const pair = v.split(";")[0] as string;
          const at = pair.indexOf("=");
          if (at > 0) jar.set(pair.slice(0, at), pair.slice(at + 1));
        }
      }

      const to = rh.find(([k]) => k.toLowerCase() === "location")?.[1];
      if (o.follow && to && [301, 302, 303, 307, 308].includes(res.status)) {
        url = /^https?:\/\//.test(to) ? to : `${m[1] ?? "http"}://${host}${to.startsWith("/") ? to : `/${to}`}`;
        if ([301, 302, 303].includes(res.status) && method === "POST") {
          method = o.method ?? "GET";
          body = "";
        }
        continue;
      }

      if (o.jar) ctx.shell.fs.put(here(o.jar), jarFile(host, jar), { owner: ctx.shell.fs.userName(ctx.creds.uid) });
      if (o.output) {
        ctx.shell.fs.put(here(o.output), stdout + text, { owner: ctx.shell.fs.userName(ctx.creds.uid) });
        return { stdout: "", stderr, code: 0 };
      }
      return { stdout: stdout + text, stderr, code: 0 };
    }
    return fail(o.silent ? "" : "curl: (47) Maximum (50) redirects followed\n", 47, stdout);
  };
}
