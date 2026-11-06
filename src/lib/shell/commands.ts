/**
 * The commands. Output and error text follow GNU coreutils, grep, find and
 * bash; scripts/check-shell.ts compares them against the real tools. Where a
 * tool is only partly implemented, it says so instead of inventing a result.
 */
import { sha256 } from "./hash";
import { jq, JqError } from "./jq";
import { MAN } from "./man";
import {
  EACCES, EEXIST, EISDIR, ENOENT, ENOTDIR, ENOTEMPTY, EPERM, FsError, NOW,
  basename, dirname, modeString, normalize, type Creds, type FsNode,
} from "./fs";
import { globToRegExp, posixToJs } from "./parse";
import type { Proc, Shell } from "./shell";

export interface Result {
  stdout: string;
  stderr: string;
  code: number;
}

export interface Ctx {
  args: string[];
  stdin: string;
  shell: Shell;
  creds: Creds;
  /** True when stdout isn't the terminal. */
  piped: boolean;
  name: string;
}

export type Cmd = (ctx: Ctx) => Result;

const ok = (stdout = ""): Result => ({ stdout, stderr: "", code: 0 });
const err = (stderr: string, code = 1, stdout = ""): Result => ({ stdout, stderr, code });

/** Splits `-abc --long value` style arguments; flagsWithValue take the next arg. */
function opts(args: string[], withValue = "") {
  const flags = new Map<string, string>();
  const rest: string[] = [];
  let i = 0;
  for (; i < args.length; i++) {
    const a = args[i] as string;
    if (a === "--") {
      rest.push(...args.slice(i + 1));
      break;
    }
    if (a.startsWith("--") && a.length > 2) {
      flags.set(a, "");
    } else if (a.startsWith("-") && a.length > 1) {
      for (let j = 1; j < a.length; j++) {
        const f = a[j] as string;
        if (withValue.includes(f)) {
          const inline = a.slice(j + 1);
          if (inline) flags.set(f, inline);
          else flags.set(f, (args[++i] as string) ?? "");
          break;
        }
        flags.set(f, "");
      }
    } else rest.push(a);
  }
  return { flags, rest };
}

const lines = (text: string) => {
  if (text === "") return [];
  const all = text.split("\n");
  if (all[all.length - 1] === "") all.pop();
  return all;
};
const join = (ls: string[]) => (ls.length ? `${ls.join("\n")}\n` : "");

/** Reads the named files or stdin; a command's errors are collected. */
function inputs(ctx: Ctx, files: string[]): { name: string; text: string }[] & { errors: string } {
  const out = [] as unknown as { name: string; text: string }[] & { errors: string };
  out.errors = "";
  if (files.length === 0) {
    out.push({ name: "", text: ctx.stdin });
    return out;
  }
  for (const f of files) {
    if (f === "-") {
      out.push({ name: "(standard input)", text: ctx.stdin });
      continue;
    }
    if (f === "/dev/null") {
      out.push({ name: f, text: "" });
      continue;
    }
    try {
      const node = ctx.shell.fs.lookup(f, ctx.shell.cwd, ctx.creds);
      if (node.kind === "dir") out.errors += `${ctx.name}: ${f}: ${EISDIR}\n`;
      else if (!ctx.shell.fs.can(node, ctx.creds, 4)) out.errors += `${ctx.name}: ${f}: ${EACCES}\n`;
      else out.push({ name: f, text: node.content });
    } catch (e) {
      if (!(e instanceof FsError)) throw e;
      out.errors += `${ctx.name}: ${f}: ${e.reason}\n`;
    }
  }
  return out;
}

const fmtDate = (t: number) => {
  const d = new Date(t * 1000);
  const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${m} ${String(d.getUTCDate()).padStart(2, " ")} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};

const human = (n: number) => {
  if (n < 1024) return String(n);
  const units = ["K", "M", "G"];
  let v = n;
  let u = -1;
  while (v >= 1024) {
    v /= 1024;
    u++;
  }
  return `${v < 10 ? (Math.ceil(v * 10) / 10).toFixed(1) : Math.ceil(v)}${units[u]}`;
};

const size = (n: FsNode) => (n.kind === "dir" ? 4096 : n.kind === "link" ? n.target.length : n.content.length);
const blocks = (n: FsNode) => (n.kind === "link" ? 0 : Math.ceil(size(n) / 4096) * 4);

const NAME_ORDER = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

const ls: Cmd = (ctx) => {
  const { flags, rest } = opts(ctx.args);
  const { shell, creds } = ctx;
  const { fs } = shell;
  const all = flags.has("a");
  const almost = flags.has("A");
  const long = flags.has("l");
  const humanSizes = flags.has("h");
  const dirOnly = flags.has("d");
  const one = flags.has("1") || ctx.piped;
  const recursive = flags.has("R");
  const classify = flags.has("F");
  let stderr = "";

  const sorter = (list: { name: string; node: FsNode }[]) => {
    const s = [...list].sort((a, b) => NAME_ORDER(a.name, b.name));
    if (flags.has("t")) s.sort((a, b) => b.node.mtime - a.node.mtime);
    if (flags.has("S")) s.sort((a, b) => size(b.node) - size(a.node));
    return flags.has("r") ? s.reverse() : s;
  };
  const decorate = (e: { name: string; node: FsNode }) => {
    if (!classify) return e.name;
    if (e.node.kind === "dir") return `${e.name}/`;
    if (e.node.kind === "link") return `${e.name}@`;
    return e.node.mode & 0o111 ? `${e.name}*` : e.name;
  };
  const render = (entries: { name: string; node: FsNode }[], withTotal: boolean) => {
    if (!long) {
      if (entries.length === 0) return "";
      return one ? join(entries.map(decorate)) : `${entries.map(decorate).join("  ")}\n`;
    }
    const sz = (n: FsNode) => (humanSizes ? human(size(n)) : String(size(n)));
    const w = {
      links: Math.max(1, ...entries.map((e) => String(e.node.kind === "dir" ? 2 : 1).length)),
      user: Math.max(0, ...entries.map((e) => fs.userName(e.node.uid).length)),
      group: Math.max(0, ...entries.map((e) => fs.groupName(e.node.gid).length)),
      size: Math.max(0, ...entries.map((e) => sz(e.node).length)),
    };
    let out = "";
    if (withTotal) {
      const total = entries.reduce((sum, e) => sum + blocks(e.node), 0);
      out += `total ${humanSizes && total >= 1024 ? human(total * 1024) : humanSizes && total ? `${total}K` : total}\n`;
    }
    for (const e of entries) {
      const n = e.node;
      out +=
        `${modeString(n)} ${String(n.kind === "dir" ? 2 : 1).padStart(w.links)} ` +
        `${fs.userName(n.uid).padEnd(w.user)} ${fs.groupName(n.gid).padEnd(w.group)} ` +
        `${sz(n).padStart(w.size)} ${fmtDate(n.mtime)} ${decorate(e)}` +
        `${n.kind === "link" ? ` -> ${n.target}` : ""}\n`;
    }
    return out;
  };

  const list = (node: FsNode, path: string): string => {
    if (!fs.can(node, creds, 4)) {
      stderr += `ls: cannot open directory '${path}': ${EACCES}\n`;
      return "";
    }
    const entries = [...node.children].map(([name, n]) => ({ name, node: n }));
    const shown = entries.filter((e) => all || almost || !e.name.startsWith("."));
    if (all) shown.push({ name: ".", node }, { name: "..", node });
    return render(sorter(shown), true);
  };

  const targets = rest.length ? rest : ["."];
  const files: { name: string; node: FsNode }[] = [];
  const dirs: { name: string; node: FsNode }[] = [];
  for (const t of targets) {
    try {
      const node = fs.lookup(t, shell.cwd, creds, !long);
      if (node.kind === "dir" && !dirOnly) dirs.push({ name: t, node });
      else files.push({ name: t, node });
    } catch (e) {
      if (!(e instanceof FsError)) throw e;
      stderr += `ls: cannot access '${t}': ${e.reason}\n`;
    }
  }
  let stdout = files.length ? render(sorter(files), false) : "";
  const walk = (name: string, node: FsNode) => {
    const header = recursive || targets.length > 1 ? `${name}:\n` : "";
    if (stdout) stdout += "\n";
    stdout += header + list(node, name);
    if (recursive && fs.can(node, creds, 4)) {
      for (const [child, n] of [...node.children].sort((a, b) => NAME_ORDER(a[0], b[0]))) {
        if (n.kind === "dir" && (all || almost || !child.startsWith("."))) {
          walk(name === "/" ? `/${child}` : `${name}/${child}`, n);
        }
      }
    }
  };
  for (const d of dirs.sort((a, b) => NAME_ORDER(a.name, b.name))) walk(d.name, d.node);
  return { stdout, stderr, code: stderr ? 2 : 0 };
};

const cat: Cmd = (ctx) => {
  const { flags, rest } = opts(ctx.args);
  const inp = inputs(ctx, rest);
  let text = inp.map((i) => i.text).join("");
  if (flags.has("n")) {
    text = join(lines(text).map((l, i) => `${String(i + 1).padStart(6)}\t${l}`));
  }
  return { stdout: text, stderr: inp.errors, code: inp.errors ? 1 : 0 };
};

function headTail(ctx: Ctx, tail: boolean): Result {
  const args = ctx.args.map((a) => (/^-\d+$/.test(a) ? `-n${a.slice(1)}` : a));
  const { flags, rest } = opts(args, "nc");
  const inp = inputs(ctx, rest);
  const raw = flags.get("n") ?? "10";
  const fromStart = tail && raw.startsWith("+");
  const n = Number(raw.replace(/^\+/, ""));
  let stdout = "";
  inp.forEach((file, i) => {
    if (inp.length > 1) stdout += `${i ? "\n" : ""}==> ${file.name} <==\n`;
    if (flags.has("c")) {
      const c = Number(flags.get("c"));
      stdout += tail ? file.text.slice(-c) : file.text.slice(0, c);
      return;
    }
    const ls2 = lines(file.text);
    const pick = tail ? (fromStart ? ls2.slice(Math.max(0, n - 1)) : n === 0 ? [] : ls2.slice(-n)) : ls2.slice(0, n);
    stdout += join(pick);
  });
  return { stdout, stderr: inp.errors.replace(new RegExp(`^${ctx.name}: (.*)$`, "gm"), `${ctx.name}: cannot open '$1' for reading`).replace(/'([^']+): ([^']+)' for reading/g, "'$1' for reading: $2"), code: inp.errors ? 1 : 0 };
}

const wc: Cmd = (ctx) => {
  const { flags, rest } = opts(ctx.args);
  const inp = inputs(ctx, rest);
  const count = (t: string) => ({
    l: (t.match(/\n/g) ?? []).length,
    w: t.split(/\s+/).filter(Boolean).length,
    c: t.length,
  });
  const none = !flags.has("l") && !flags.has("w") && !flags.has("c");
  const which = (["l", "w", "c"] as const).filter((k) => none || flags.has(k));
  const rows = inp.map((f) => ({ name: f.name, ...count(f.text) }));
  const total = { name: "total", l: 0, w: 0, c: 0 };
  rows.forEach((r) => {
    total.l += r.l;
    total.w += r.w;
    total.c += r.c;
  });
  if (rows.length > 1) rows.push(total);
  const usesStdin = rest.length === 0;
  const width = which.length === 1 && rows.length === 1 ? 0 : usesStdin ? 7 : String(total.c).length;
  const stdout = rows
    .map((r) => {
      const nums = which.map((k) => String(r[k]).padStart(width)).join(" ");
      return r.name ? `${nums} ${r.name}` : nums;
    })
    .join("\n");
  return { stdout: stdout ? `${stdout}\n` : "", stderr: inp.errors, code: inp.errors ? 1 : 0 };
};

const grep: Cmd = (ctx) => {
  const { flags, rest } = opts(ctx.args, "eAB");
  const { shell, creds } = ctx;
  const extended = ctx.name === "egrep" || flags.has("E");
  const pat = flags.get("e") ?? rest.shift();
  if (pat === undefined) return err("Usage: grep [OPTION]... PATTERNS [FILE]...\n", 2);
  const source = flags.has("F") ? pat.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") : posixToJs(pat, extended);
  let re: RegExp;
  try {
    re = new RegExp(flags.has("w") ? `(?<![A-Za-z0-9_])(?:${source})(?![A-Za-z0-9_])` : flags.has("x") ? `^(?:${source})$` : source, flags.has("i") ? "i" : "");
  } catch {
    return err("grep: Invalid regular expression\n", 2);
  }
  let files = rest;
  const recursive = flags.has("r") || flags.has("R");
  let stderr = "";
  if (recursive) {
    const found: string[] = [];
    const walk = (p: string, node: FsNode) => {
      if (node.kind === "dir") {
        if (!shell.fs.can(node, creds, 4) || !shell.fs.can(node, creds, 1)) {
          stderr += `grep: ${p}: ${EACCES}\n`;
          return;
        }
        for (const [n, c] of [...node.children].sort((a, b) => NAME_ORDER(a[0], b[0]))) walk(`${p}/${n}`, c);
      } else if (node.kind === "file") found.push(p);
    };
    for (const f of files.length ? files : ["."]) {
      try {
        walk(f.replace(/\/$/, ""), shell.fs.lookup(f, shell.cwd, creds));
      } catch (e) {
        if (e instanceof FsError) stderr += `grep: ${f}: ${e.reason}\n`;
        else throw e;
      }
    }
    files = found;
  }
  const inp = inputs(ctx, files);
  stderr += inp.errors;
  const prefix = (files.length > 1 || recursive || flags.has("H")) && !flags.has("h");
  const after = Number(flags.get("A") ?? 0);
  const before = Number(flags.get("B") ?? 0);
  let stdout = "";
  let matched = false;
  for (const file of inp) {
    const name = file.name === "" ? "(standard input)" : file.name;
    const ls2 = lines(file.text);
    if (/[\x00]/.test(file.text)) {
      if (ls2.some((l) => re.test(l))) {
        matched = true;
        stdout += `Binary file ${name} matches\n`;
      }
      continue;
    }
    let count = 0;
    const hit = ls2.map((l) => re.test(l) !== flags.has("v"));
    const shown = new Set<number>();
    hit.forEach((h, i) => {
      if (!h) return;
      count++;
      for (let k = Math.max(0, i - before); k <= Math.min(ls2.length - 1, i + after); k++) shown.add(k);
    });
    if (count) matched = true;
    if (flags.has("q")) continue;
    if (flags.has("l")) {
      if (count) stdout += `${name}\n`;
      continue;
    }
    if (flags.has("c")) {
      stdout += `${prefix ? `${name}:` : ""}${count}\n`;
      continue;
    }
    [...shown].sort((a, b) => a - b).forEach((i) => {
      const l = ls2[i] as string;
      const lead = `${prefix ? `${name}:` : ""}${flags.has("n") ? `${i + 1}:` : ""}`;
      if (flags.has("o") && !flags.has("v")) {
        const g = new RegExp(re.source, `g${re.flags}`);
        for (const m of l.matchAll(g)) if (m[0]) stdout += `${lead}${m[0]}\n`;
      } else stdout += `${lead}${l}\n`;
    });
  }
  return { stdout, stderr, code: stderr ? 2 : matched ? 0 : 1 };
};

const sort: Cmd = (ctx) => {
  const { flags, rest } = opts(ctx.args, "kt");
  const inp = inputs(ctx, rest);
  let all = inp.flatMap((f) => lines(f.text));
  const sep = flags.get("t");
  const key = flags.get("k");
  const field = (l: string): string => {
    if (!key) return l;
    const [a, b] = key.split(",");
    const from = parseInt(a as string, 10);
    const to = b ? parseInt(b, 10) : undefined;
    if (sep) return l.split(sep).slice(from - 1, to).join(sep);
    const parts = l.match(/\s*\S+/g) ?? [];
    return parts.slice(from - 1, to).join("");
  };
  const numeric = flags.has("n");
  const value = (s: string) => {
    const m = /^\s*-?\d*\.?\d+/.exec(s);
    return m ? Number(m[0]) : 0;
  };
  const fold = flags.has("f");
  const cmp = (a: string, b: string) => {
    const x = fold ? field(a).toUpperCase() : field(a);
    const y = fold ? field(b).toUpperCase() : field(b);
    if (numeric) return value(x) - value(y);
    return NAME_ORDER(x, y);
  };
  const unique = flags.has("u");
  all.sort((a, b) => {
    let c = cmp(a, b);
    if (c === 0 && !unique) c = NAME_ORDER(a, b);
    return flags.has("r") ? -c : c;
  });
  if (unique) all = all.filter((l, i) => i === 0 || cmp(all[i - 1] as string, l) !== 0);
  return { stdout: join(all), stderr: inp.errors.replace(/^sort: (.*): (No such.*)$/gm, "sort: cannot read: $1: $2"), code: inp.errors ? 2 : 0 };
};

const uniq: Cmd = (ctx) => {
  const { flags, rest } = opts(ctx.args);
  const inp = inputs(ctx, rest.slice(0, 1));
  const out: string[] = [];
  const ls2 = inp.flatMap((f) => lines(f.text));
  const same = (a: string, b: string) => (flags.has("i") ? a.toLowerCase() === b.toLowerCase() : a === b);
  for (let i = 0; i < ls2.length; ) {
    let j = i + 1;
    while (j < ls2.length && same(ls2[i] as string, ls2[j] as string)) j++;
    const n = j - i;
    if ((!flags.has("d") || n > 1) && (!flags.has("u") || n === 1)) {
      out.push(flags.has("c") ? `${String(n).padStart(7)} ${ls2[i]}` : (ls2[i] as string));
    }
    i = j;
  }
  return { stdout: join(out), stderr: inp.errors, code: inp.errors ? 1 : 0 };
};

function listSpec(spec: string): (i: number) => boolean {
  const ranges = spec.split(",").map((part) => {
    const [a, b] = part.split("-");
    if (!part.includes("-")) return [Number(a), Number(a)] as const;
    return [a ? Number(a) : 1, b ? Number(b) : Infinity] as const;
  });
  return (i) => ranges.some(([x, y]) => i >= x && i <= y);
}

const cut: Cmd = (ctx) => {
  const { flags, rest } = opts(ctx.args, "dfc");
  const inp = inputs(ctx, rest);
  const out: string[] = [];
  const spec = flags.get("f") ?? flags.get("c");
  if (!spec) return err("cut: you must specify a list of bytes, characters, or fields\n");
  const pick = listSpec(spec);
  const d = flags.get("d") ?? "\t";
  for (const l of inp.flatMap((f) => lines(f.text))) {
    if (flags.has("c")) out.push([...l].filter((_, i) => pick(i + 1)).join(""));
    else if (!l.includes(d)) out.push(l);
    else out.push(l.split(d).filter((_, i) => pick(i + 1)).join(d));
  }
  return { stdout: join(out), stderr: inp.errors, code: inp.errors ? 1 : 0 };
};

function trSet(s: string): string {
  const named: Record<string, string> = {
    "[:upper:]": "A-Z", "[:lower:]": "a-z", "[:digit:]": "0-9", "[:alpha:]": "A-Za-z", "[:space:]": " \t\n\r",
  };
  let t = s;
  for (const [k, v] of Object.entries(named)) t = t.split(k).join(v);
  t = t.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
  let out = "";
  for (let i = 0; i < t.length; i++) {
    if (t[i + 1] === "-" && t[i + 2]) {
      for (let c = t.charCodeAt(i); c <= t.charCodeAt(i + 2); c++) out += String.fromCharCode(c);
      i += 2;
    } else out += t[i];
  }
  return out;
}

const tr: Cmd = (ctx) => {
  const { flags, rest } = opts(ctx.args);
  const a = trSet(rest[0] ?? "");
  const b = trSet(rest[1] ?? "");
  let text = ctx.stdin;
  if (flags.has("d")) text = [...text].filter((c) => !a.includes(c)).join("");
  else if (rest.length > 1) {
    text = [...text]
      .map((c) => {
        const i = a.indexOf(c);
        return i < 0 ? c : (b[Math.min(i, b.length - 1)] ?? c);
      })
      .join("");
  }
  if (flags.has("s")) {
    const set = rest.length > 1 && !flags.has("d") ? b : a;
    text = [...text].filter((c, i, arr) => !(i > 0 && c === arr[i - 1] && set.includes(c))).join("");
  }
  return ok(text);
};

const sed: Cmd = (ctx) => {
  const { flags, rest } = opts(ctx.args);
  const script = rest.shift() ?? "";
  const extended = flags.has("E") || flags.has("r");
  const quiet = flags.has("n");
  const apply = (ls2: string[]): string[] | null => {
    let m = /^s(.)((?:\\.|(?!\1).)*)\1((?:\\.|(?!\1).)*)\1([gip]*)$/.exec(script);
    const out: string[] = [];
    if (m) {
      const re = new RegExp(posixToJs(m[2] as string, extended), (m[4]?.includes("g") ? "g" : "") + (m[4]?.includes("i") ? "i" : ""));
      const replacement = (m[3] as string).replace(/\$/g, "$$$$").replace(/\\(\d)/g, "$$$1").replace(/(?<!\\)&/g, "$$&").replace(/\\&/g, "&");
      for (const l of ls2) {
        const n = l.replace(re, replacement);
        if (!quiet) out.push(n);
        else if (m[4]?.includes("p") && re.test(l)) out.push(n);
      }
      return out;
    }
    m = /^(?:(\d+)(?:,(\d+|\$))?|\/(.*)\/)([dp])$/.exec(script);
    if (m) {
      const from = Number(m[1]);
      const to = m[2] === "$" ? Infinity : m[2] ? Number(m[2]) : from;
      const re = m[3] !== undefined ? new RegExp(posixToJs(m[3], extended)) : null;
      ls2.forEach((l, i) => {
        const hit = re ? re.test(l) : i + 1 >= from && i + 1 <= to;
        if (m?.[4] === "d") {
          if (!hit && !quiet) out.push(l);
        } else {
          if (hit) out.push(l);
          if (!quiet) out.push(l);
        }
      });
      return out;
    }
    return null;
  };
  const refused = `sed: this simulator handles s/old/new/, Nd, Np and /re/d. Try real sed in your VM for: ${script}\n`;
  if (flags.has("i")) {
    const { shell, creds } = ctx;
    let stderr = "";
    for (const f of rest) {
      try {
        const node = shell.fs.lookup(f, shell.cwd, creds);
        if (!shell.fs.can(node, creds, 4)) throw new FsError(EACCES);
        const res = apply(lines(node.content));
        if (!res) return err(refused);
        if (!shell.fs.can(node, creds, 2)) throw new FsError(EACCES);
        node.content = join(res);
        node.mtime = NOW;
      } catch (e) {
        if (e instanceof FsError) stderr += `sed: can't read ${f}: ${e.reason}\n`;
        else throw e;
      }
    }
    return { stdout: "", stderr, code: stderr ? 2 : 0 };
  }
  const inp = inputs(ctx, rest);
  const res = apply(inp.flatMap((f) => lines(f.text)));
  return res ? { stdout: join(res), stderr: inp.errors, code: 0 } : err(refused);
};

const awk: Cmd = (ctx) => {
  const { flags, rest } = opts(ctx.args, "F");
  const prog = (rest.shift() ?? "").trim();
  const inp = inputs(ctx, rest);
  const sep = flags.get("F");
  const help = "awk: this simulator handles filters joined by &&, {print ...}, and {s+=$3} END {print s}, like awk -F: '$3 == 0 {print $1}'. Try real awk in your VM for anything longer.\n";
  const sum = /^(.*?)\s*\{\s*([A-Za-z_]\w*)\s*\+=\s*\$(\d+)\s*;?\s*\}\s*END\s*\{\s*print\s+\2\s*;?\s*\}$/.exec(prog);
  const whole = sum ? null : /^(.*?)\s*(?:\{\s*print(?:\s+(.*?))?\s*;?\s*\})?$/.exec(prog);
  if (!prog || (!sum && !whole)) return err(help);
  const filterSrc = (sum ? sum[1] : whole?.[1]) ?? "";
  const printExpr = whole?.[2];
  type Line = { line: string; fields: string[]; idx: number; get: (n: number) => string };
  const tests: ((l: Line) => boolean)[] = [];
  for (const part of filterSrc.trim() ? filterSrc.split(/\s*&&\s*/) : []) {
    const m = /^(?:\/(.*)\/|NR\s*(==|!=|>=|<=|>|<)\s*(\d+)|\$(\d+)\s*(==|!=|>=|<=|>|<|~)\s*("[^"]*"|\/.*\/|-?\d+))$/.exec(part.trim());
    if (!m) return err(help);
    const [, reSrc, nrOp, nrN, fieldN, op, val] = m;
    if (reSrc !== undefined) {
      const re = new RegExp(posixToJs(reSrc, true));
      tests.push((l) => re.test(l.line));
    } else if (nrOp) {
      const n = Number(nrN);
      tests.push((l) => {
        const c = l.idx + 1;
        return nrOp === "==" ? c === n : nrOp === "!=" ? c !== n : nrOp === ">" ? c > n : nrOp === "<" ? c < n : nrOp === ">=" ? c >= n : c <= n;
      });
    } else {
      tests.push((l) => {
        const left = l.get(Number(fieldN));
        const v = val as string;
        if (op === "~") return new RegExp(posixToJs(v.slice(1, -1), true)).test(left);
        const isStr = v.startsWith('"');
        const r = isStr ? v.slice(1, -1) : Number(v);
        const lv = isStr || left === "" || Number.isNaN(Number(left)) ? left : Number(left);
        const rc = typeof r === "number" && typeof lv === "string" ? String(r) : r;
        return op === "==" ? lv === rc : op === "!=" ? lv !== rc : op === ">" ? lv > rc : op === "<" ? lv < rc : op === ">=" ? lv >= rc : lv <= rc;
      });
    }
  }
  const out: string[] = [];
  let unsupported = "";
  let total = 0;
  const num = (v: number) => (Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(6))));
  const split = (l: string) => (sep ? l.split(sep === "\\t" ? "\t" : sep) : l.split(/[ \t]+/).filter(Boolean));
  inp.flatMap((f) => lines(f.text)).forEach((line, idx) => {
    const fields = split(line);
    const get = (n: number) => (n === 0 ? line : (fields[n - 1] ?? ""));
    if (!tests.every((t) => t({ line, fields, idx, get }))) return;
    if (sum) {
      total += parseFloat(get(Number(sum[3]))) || 0;
      return;
    }
    if (!printExpr) {
      out.push(line);
      return;
    }
    const parts = printExpr.split(/\s*,\s*/).map((p) => {
      if (p === "NF") return String(fields.length);
      if (p === "NR") return String(idx + 1);
      if (p === "$NF") return get(fields.length);
      const back = /^\$\(NF-(\d+)\)$/.exec(p);
      if (back) return get(fields.length - Number(back[1]));
      const f = /^\$(\d+)$/.exec(p);
      if (f) return get(Number(f[1]));
      const calc = /^\$(\d+)\s*([*+\-/])\s*(\$?)(\d+)$/.exec(p);
      if (calc) {
        const x = parseFloat(get(Number(calc[1]))) || 0;
        const y = calc[3] ? parseFloat(get(Number(calc[4]))) || 0 : Number(calc[4]);
        return num(calc[2] === "*" ? x * y : calc[2] === "+" ? x + y : calc[2] === "-" ? x - y : x / y);
      }
      const s = /^"(.*)"$/.exec(p);
      if (s) return s[1] as string;
      unsupported = p;
      return "";
    });
    out.push(parts.join(" "));
  });
  if (unsupported) return err(`awk: this simulator can't print ${unsupported}. Try real awk in your VM.\n`, 2);
  if (sum) out.push(num(total));
  return { stdout: join(out), stderr: inp.errors, code: inp.errors ? 2 : 0 };
};

function permTest(spec: string): (mode: number) => boolean {
  const kind = spec[0];
  const raw = kind === "-" || kind === "/" ? spec.slice(1) : spec;
  let want: number;
  if (/^[0-7]+$/.test(raw)) want = parseInt(raw, 8);
  else {
    want = 0;
    for (const part of raw.split(",")) {
      const m = /^([ugoa]*)[=+]([rwxst]*)$/.exec(part);
      if (!m) continue;
      const who = m[1] || "ugo";
      for (const c of m[2] as string) {
        if (c === "s") {
          if (who.includes("u") || who.includes("a")) want |= 0o4000;
          if (who.includes("g") || who.includes("a")) want |= 0o2000;
        } else if (c === "t") want |= 0o1000;
        else {
          const b = c === "r" ? 4 : c === "w" ? 2 : 1;
          if (who.includes("u") || who.includes("a")) want |= b << 6;
          if (who.includes("g") || who.includes("a")) want |= b << 3;
          if (who.includes("o") || who.includes("a")) want |= b;
        }
      }
    }
  }
  if (kind === "-") return (m) => (m & want) === want;
  if (kind === "/") return (m) => want === 0 || (m & want) !== 0;
  return (m) => (m & 0o7777) === want;
}

type Test = (path: string, node: FsNode, depth: number) => boolean;

const find: Cmd = (ctx) => {
  const { shell, creds } = ctx;
  const { fs } = shell;
  const args = [...ctx.args];
  const roots: string[] = [];
  while (args.length && !(args[0] as string).startsWith("-") && args[0] !== "!" && args[0] !== "(") roots.push(args.shift() as string);
  if (roots.length === 0) roots.push(".");
  let maxDepth = Infinity;
  let minDepth = 0;
  const execs: string[][] = [];
  let printed = false;
  // A flat AND list, with -o splitting it into alternatives.
  const alts: Test[][] = [[]];
  let negate = false;
  const add = (t: Test) => {
    const n = negate;
    negate = false;
    (alts[alts.length - 1] as Test[]).push(n ? (p, nd, d) => !t(p, nd, d) : t);
  };
  while (args.length) {
    const a = args.shift() as string;
    const take = () => args.shift() ?? "";
    if (a === "!" || a === "-not") negate = true;
    else if (a === "-o" || a === "-or") alts.push([]);
    else if (a === "-a" || a === "-and") continue;
    else if (a === "-name" || a === "-iname") {
      const v = take();
      const re = globToRegExp(a === "-iname" ? v.toLowerCase() : v);
      add((p) => re.test(a === "-iname" ? basename(p).toLowerCase() : p === "/" ? "/" : basename(p.replace(/\/+$/, ""))));
    } else if (a === "-type") {
      const v = take();
      add((_, n) => (v === "f" ? n.kind === "file" : v === "d" ? n.kind === "dir" : v === "l" ? n.kind === "link" : false));
    } else if (a === "-perm") {
      const t = permTest(take());
      add((_, n) => t(n.mode));
    } else if (a === "-user") {
      const v = take();
      add((_, n) => fs.userName(n.uid) === v || String(n.uid) === v);
    } else if (a === "-group") {
      const v = take();
      add((_, n) => fs.groupName(n.gid) === v || String(n.gid) === v);
    } else if (a === "-newer") {
      const ref = take();
      let t: number;
      try {
        t = fs.lookup(ref, ctx.shell.cwd, creds).mtime;
      } catch {
        return err(`find: '${ref}': No such file or directory\n`);
      }
      add((_, n) => n.mtime > t);
    } else if (a === "-empty") add((_, n) => (n.kind === "dir" ? n.children.size === 0 : size(n) === 0));
    else if (a === "-size") {
      const m = /^([+-]?)(\d+)([cbkMG]?)$/.exec(take());
      if (!m) return err("find: invalid -size\n");
      const unit = { c: 1, k: 1024, M: 1024 ** 2, G: 1024 ** 3, b: 512, "": 512 }[m[3] as "c"];
      const want = Number(m[2]);
      add((_, n) => {
        const got = Math.ceil(size(n) / unit);
        return m[1] === "+" ? got > want : m[1] === "-" ? got < want : got === want;
      });
    } else if (a === "-maxdepth") maxDepth = Number(take());
    else if (a === "-mindepth") minDepth = Number(take());
    else if (a === "-print") printed = true;
    else if (a === "-exec") {
      const cmd: string[] = [];
      while (args.length && args[0] !== ";" && args[0] !== "+") cmd.push(args.shift() as string);
      if (args.length === 0) return err("find: missing argument to `-exec'\n");
      args.shift();
      execs.push(cmd);
      printed = true;
    } else return err(`find: unknown predicate \`${a}'\n`);
  }
  let stdout = "";
  let stderr = "";
  const visit = (path: string, node: FsNode, depth: number) => {
    if (depth >= minDepth && alts.some((group) => group.every((t) => t(path, node, depth)))) {
      if (execs.length) {
        for (const cmd of execs) {
          const res = shell.invoke(cmd.map((c) => c.split("{}").join(path)), "", creds, true);
          stdout += res.stdout;
          stderr += res.stderr;
        }
      } else stdout += `${path}\n`;
    }
    if (node.kind === "dir" && depth < maxDepth) {
      if (!fs.can(node, creds, 4) || !fs.can(node, creds, 1)) {
        stderr += `find: ‘${path}’: ${EACCES}\n`;
        return;
      }
      for (const [name, child] of [...node.children].sort((a, b) => NAME_ORDER(a[0], b[0]))) {
        visit(path === "/" ? `/${name}` : `${path.replace(/\/+$/, "")}/${name}`, child, depth + 1);
      }
    }
  };
  for (const root of roots) {
    try {
      visit(root, fs.lookup(root, shell.cwd, creds, false), 0);
    } catch (e) {
      if (e instanceof FsError) stderr += `find: ‘${root}’: ${e.reason}\n`;
      else throw e;
    }
  }
  void printed;
  return { stdout, stderr, code: stderr ? 1 : 0 };
};

function applyMode(mode: number, spec: string, kind: FsNode["kind"], umask: number): number | null {
  if (/^[0-7]{1,4}$/.test(spec)) {
    const v = parseInt(spec, 8);
    // Like GNU chmod: fewer than 5 digits leave a directory's special bits alone
    // only when they aren't given; four digits set them for files.
    return spec.length === 4 || kind !== "dir" ? v : (mode & 0o7000) | v;
  }
  let m = mode;
  for (const clause of spec.split(",")) {
    const c = /^([ugoa]*)([-+=])([rwxXst]*|[ugo])$/.exec(clause);
    if (!c) return null;
    const who = c[1] || "";
    const all = who === "" || who.includes("a");
    const op = c[2] as string;
    let bits = 0;
    for (const p of c[3] as string) {
      const shiftFor = (w: string) => (w === "u" ? 6 : w === "g" ? 3 : 0);
      const targets = all ? ["u", "g", "o"] : [...who];
      for (const t of targets) {
        const s = shiftFor(t);
        if (p === "r") bits |= 4 << s;
        if (p === "w") bits |= 2 << s;
        if (p === "x" || (p === "X" && (kind === "dir" || (mode & 0o111) !== 0))) bits |= 1 << s;
        if (p === "s" && t === "u") bits |= 0o4000;
        if (p === "s" && t === "g") bits |= 0o2000;
        if (p === "t") bits |= 0o1000;
      }
    }
    const scope = (all ? 0o777 | 0o7000 : 0) |
      (who.includes("u") ? 0o4700 : 0) | (who.includes("g") ? 0o2070 : 0) | (who.includes("o") ? 0o1007 : 0);
    if (who === "") bits &= ~umask;
    if (op === "+") m |= bits;
    else if (op === "-") m &= ~bits;
    else m = (m & ~(scope & (who === "" || who.includes("a") ? 0o777 : scope))) | bits;
  }
  return m;
}

const chmod: Cmd = (ctx) => {
  const args = ctx.args.filter((a) => a !== "-R");
  const recursive = args.length !== ctx.args.length;
  const spec = args[0];
  const files = args.slice(1);
  if (!spec || files.length === 0) return err("chmod: missing operand\n");
  let stderr = "";
  const apply = (node: FsNode, name: string) => {
    if (ctx.creds.euid !== 0 && ctx.creds.euid !== node.uid) {
      stderr += `chmod: changing permissions of '${name}': ${EPERM}\n`;
      return;
    }
    const m = applyMode(node.mode, spec, node.kind, ctx.shell.umask);
    if (m === null) {
      stderr += `chmod: invalid mode: ‘${spec}’\n`;
      return;
    }
    node.mode = m;
    if (recursive && node.kind === "dir") {
      for (const [n, c] of node.children) if (c.kind !== "link") apply(c, `${name}/${n}`);
    }
  };
  for (const f of files) {
    try {
      apply(ctx.shell.fs.lookup(f, ctx.shell.cwd, ctx.creds), f);
    } catch (e) {
      if (!(e instanceof FsError)) throw e;
      stderr += `chmod: cannot access '${f}': ${e.reason}\n`;
    }
  }
  return { stdout: "", stderr, code: stderr ? 1 : 0 };
};

const chown: Cmd = (ctx) => {
  const { fs, cwd } = ctx.shell;
  const args = ctx.args.filter((a) => a !== "-R");
  const spec = args[0] ?? "";
  const files = args.slice(1);
  const byGroupOnly = ctx.name === "chgrp";
  const [userPart, groupPart] = byGroupOnly ? ["", spec] : spec.split(":");
  const uid = userPart ? fs.user(userPart)?.uid : undefined;
  const gid = groupPart ? fs.groupId(groupPart) : undefined;
  if (userPart && uid === undefined) return err(`chown: invalid user: ‘${spec}’\n`);
  if (groupPart && gid === undefined) return err(`${ctx.name}: invalid group: ‘${spec}’\n`);
  let stderr = "";
  for (const f of files) {
    try {
      const node = fs.lookup(f, cwd, ctx.creds);
      const memberOk = gid !== undefined && ctx.creds.gids.includes(gid) && ctx.creds.euid === node.uid;
      if (ctx.creds.euid !== 0 && !(uid === undefined && memberOk)) {
        stderr += `${ctx.name}: changing ${byGroupOnly || uid === undefined ? "group" : "ownership"} of '${f}': ${EPERM}\n`;
        continue;
      }
      if (uid !== undefined) node.uid = uid;
      if (gid !== undefined) node.gid = gid;
    } catch (e) {
      if (!(e instanceof FsError)) throw e;
      stderr += `${ctx.name}: cannot access '${f}': ${e.reason}\n`;
    }
  }
  return { stdout: "", stderr, code: stderr ? 1 : 0 };
};

const signals: Record<string, number> = { HUP: 1, INT: 2, QUIT: 3, KILL: 9, TERM: 15, STOP: 19, CONT: 18 };

const kill: Cmd = (ctx) => {
  const { shell, creds } = ctx;
  let signal = 15;
  const args = [...ctx.args];
  if (args[0] === "-l") {
    return ok(`${Object.entries(signals).map(([n, v]) => `${v}) SIG${n}`).join("  ")}\n`);
  }
  if (args[0] === "-s") {
    args.shift();
    const v = (args.shift() ?? "").replace(/^SIG/, "");
    signal = signals[v] ?? Number(v);
  } else if (args[0]?.startsWith("-")) {
    const v = (args.shift() as string).slice(1).replace(/^SIG/, "");
    signal = signals[v] ?? Number(v);
  }
  if (!signal && signal !== 0) return err("bash: kill: invalid signal specification\n");
  if (args.length === 0) return err("kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]\n", 2);
  let stderr = "";
  for (const a of args) {
    const pid = Number(a);
    const p = shell.procs.find((q) => q.pid === pid);
    if (!p) {
      stderr += `bash: kill: (${a}) - No such process\n`;
      continue;
    }
    if (creds.euid !== 0 && p.user !== shell.fs.userName(creds.euid)) {
      stderr += `bash: kill: (${a}) - ${EPERM}\n`;
      continue;
    }
    if (signal === 0 || signal === 18 || signal === 19) continue;
    if (signal === 9 || !p.ignoresTerm) shell.procs = shell.procs.filter((q) => q.pid !== pid);
  }
  return { stdout: "", stderr, code: stderr ? 1 : 0 };
};

const ps: Cmd = (ctx) => {
  const { shell } = ctx;
  const a = ctx.args.join(" ");
  const full = /aux|-ef|-e\b|ax/.test(a);
  const me = shell.fs.userName(ctx.creds.uid);
  const rows = shell.procs.filter((p) => full || (p.user === me && p.tty !== "?"));
  const psSelf: Proc = { pid: shell.nextPid + 40, ppid: 4021, user: me, tty: "pts/0", cmd: `ps ${a}`.trim() };
  const all = [...rows, psSelf];
  if (/aux/.test(a)) {
    const head = "USER         PID %CPU %MEM COMMAND\n";
    const pct = (n?: number) => (n ?? 0).toFixed(1).padStart(4);
    return ok(head + join(all.map((p) => `${p.user.padEnd(10)} ${String(p.pid).padStart(5)} ${pct(p.cpu)} ${pct(p.mem ?? 0.1)} ${p.cmd}`)));
  }
  if (/-ef/.test(a)) {
    const head = "UID          PID    PPID TTY      CMD\n";
    return ok(head + join(all.map((p) => `${p.user.padEnd(10)} ${String(p.pid).padStart(5)} ${String(p.ppid).padStart(7)} ${p.tty.padEnd(8)} ${p.cmd}`)));
  }
  const head = "    PID TTY      CMD\n";
  return ok(head + join(all.map((p) => `${String(p.pid).padStart(7)} ${p.tty.padEnd(8)} ${p.cmd.split(" ")[0]}`)));
};

function copyTree(n: FsNode, c: Creds): FsNode {
  return {
    ...n,
    uid: c.euid,
    gid: c.egid,
    children: new Map([...n.children].map(([k, v]) => [k, copyTree(v, c)])),
  };
}

const wrap = (ctx: Ctx, fn: () => Result, msg: (reason: string) => string): Result => {
  try {
    return fn();
  } catch (e) {
    if (e instanceof FsError) return err(msg(e.reason));
    throw e;
  }
};

export const COMMANDS: Record<string, Cmd> = {
  ls, cat, wc, grep, egrep: grep, sort, uniq, cut, tr, sed, awk, find, chmod, chown, chgrp: chown, kill, ps,
  less: cat, more: cat,
  head: (ctx) => headTail(ctx, false),
  tail: (ctx) => headTail(ctx, true),

  pwd: (ctx) => ok(`${ctx.shell.cwd}\n`),
  cd: (ctx) => {
    const { shell, creds } = ctx;
    const raw = ctx.args[0];
    const target = raw === undefined ? (shell.env.HOME ?? "/") : raw === "-" ? (shell.env.OLDPWD ?? shell.cwd) : raw;
    if (ctx.args.length > 1) return err("bash: cd: too many arguments\n");
    try {
      const abs = normalize(target, shell.cwd);
      const node = shell.fs.lookup(abs, "/", creds);
      if (node.kind !== "dir") return err(`bash: cd: ${target}: ${ENOTDIR}\n`);
      if (!shell.fs.can(node, creds, 1)) return err(`bash: cd: ${target}: ${EACCES}\n`);
      shell.env.OLDPWD = shell.cwd;
      shell.cwd = abs;
      shell.env.PWD = abs;
      return ok(raw === "-" ? `${abs}\n` : "");
    } catch (e) {
      if (e instanceof FsError) return err(`bash: cd: ${target}: ${e.reason}\n`);
      throw e;
    }
  },
  echo: (ctx) => {
    let args = ctx.args;
    let nl = true;
    let esc = false;
    while (args[0] && /^-[ne]+$/.test(args[0])) {
      if (args[0].includes("n")) nl = false;
      if (args[0].includes("e")) esc = true;
      args = args.slice(1);
    }
    let s = args.join(" ");
    if (esc) s = s.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    return ok(nl ? `${s}\n` : s);
  },
  printf: (ctx) => {
    const fmt = (ctx.args[0] ?? "").replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    let i = 1;
    return ok(fmt.replace(/%[sd]/g, () => ctx.args[i++] ?? ""));
  },
  true: () => ok(),
  false: () => err("", 1),
  exit: () => ok("(This simulator stays open. In a real terminal, exit closes the session.)\n"),
  clear: (ctx) => {
    ctx.shell.cleared = true;
    return ok();
  },
  history: (ctx) => ok(join(ctx.shell.history.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`))),
  export: (ctx) => {
    for (const a of ctx.args) {
      const eq = a.indexOf("=");
      if (eq > 0) ctx.shell.env[a.slice(0, eq)] = a.slice(eq + 1);
    }
    return ok();
  },
  unset: (ctx) => {
    for (const a of ctx.args) delete ctx.shell.env[a];
    return ok();
  },
  env: (ctx) => ok(join(Object.entries(ctx.shell.env).map(([k, v]) => `${k}=${v}`))),
  umask: (ctx) => {
    if (ctx.args[0]) {
      ctx.shell.umask = parseInt(ctx.args[0], 8);
      return ok();
    }
    return ok(`${ctx.shell.umask.toString(8).padStart(4, "0")}\n`);
  },
  type: (ctx) => {
    const n = ctx.args[0] ?? "";
    if (["cd", "pwd", "echo", "export", "history", "kill", "umask"].includes(n)) return ok(`${n} is a shell builtin\n`);
    const r = COMMANDS.which?.(ctx);
    return r && r.stdout ? ok(`${n} is ${r.stdout}`) : err(`bash: type: ${n}: not found\n`);
  },
  which: (ctx) => {
    const { shell, creds } = ctx;
    let stdout = "";
    for (const name of ctx.args) {
      for (const d of (shell.env.PATH ?? "").split(":")) {
        if (shell.fs.exists(`${d}/${name}`, "/", creds)) {
          stdout += `${d}/${name}\n`;
          break;
        }
      }
    }
    return { stdout, stderr: "", code: stdout ? 0 : 1 };
  },
  whoami: (ctx) => ok(`${ctx.shell.fs.userName(ctx.creds.euid)}\n`),
  hostname: (ctx) => ok(`${ctx.shell.host}\n`),
  uname: (ctx) =>
    ok(ctx.args.includes("-a") ? `Linux ${ctx.shell.host} 7.0.0-generic #1 SMP x86_64 GNU/Linux\n` : "Linux\n"),
  date: () => ok("Tue Oct 27 09:13:20 UTC 2026\n"),
  id: (ctx) => {
    const { fs } = ctx.shell;
    const target = ctx.args[0] ? fs.user(ctx.args[0]) : undefined;
    if (ctx.args[0] && !target) return err(`id: ‘${ctx.args[0]}’: no such user\n`);
    const c = target ? { uid: target.uid, euid: target.uid, egid: target.gid, gids: [target.gid, ...target.groups] } : ctx.creds;
    const g = c.gids.map((x) => `${x}(${fs.groupName(x)})`).join(",");
    const eu = c.euid !== c.uid ? ` euid=${c.euid}(${fs.userName(c.euid)})` : "";
    return ok(`uid=${c.uid}(${fs.userName(c.uid)}) gid=${c.gids[0]}(${fs.groupName(c.gids[0] as number)})${eu} groups=${g}\n`);
  },
  groups: (ctx) => {
    const { fs } = ctx.shell;
    const c = ctx.args[0] ? fs.user(ctx.args[0]) : undefined;
    const ids = c ? [c.gid, ...c.groups] : ctx.creds.gids;
    return ok(`${ctx.args[0] ? `${ctx.args[0]} : ` : ""}${ids.map((x) => fs.groupName(x)).join(" ")}\n`);
  },
  touch: (ctx) => {
    const { flags, rest } = opts(ctx.args, "d");
    const when = flags.has("d") ? Date.parse(`${flags.get("d")}Z`) / 1000 : NOW;
    let stderr = "";
    for (const f of rest) {
      try {
        ctx.shell.fs.lookup(f, ctx.shell.cwd, ctx.creds).mtime = when;
      } catch {
        try {
          ctx.shell.fs.create(f, ctx.shell.cwd, ctx.creds, "file", 0o666 & ~ctx.shell.umask).mtime = when;
        } catch (e) {
          if (!(e instanceof FsError)) throw e;
          stderr += `touch: cannot touch '${f}': ${e.reason}\n`;
        }
      }
    }
    return { stdout: "", stderr, code: stderr ? 1 : 0 };
  },
  mkdir: (ctx) => {
    const { flags, rest } = opts(ctx.args);
    const { shell, creds } = ctx;
    let stderr = "";
    for (const f of rest) {
      const parts = normalize(f, shell.cwd).split("/").filter(Boolean);
      const chain = flags.has("p") ? parts.map((_, i) => `/${parts.slice(0, i + 1).join("/")}`) : [normalize(f, shell.cwd)];
      for (const p of chain) {
        if (flags.has("p") && shell.fs.exists(p, "/", creds)) continue;
        try {
          shell.fs.create(p, "/", creds, "dir", 0o777 & ~shell.umask);
        } catch (e) {
          if (!(e instanceof FsError)) throw e;
          stderr += `mkdir: cannot create directory ‘${f}’: ${e.reason}\n`;
          break;
        }
      }
    }
    return { stdout: "", stderr, code: stderr ? 1 : 0 };
  },
  rmdir: (ctx) => {
    let stderr = "";
    for (const f of ctx.args) {
      try {
        const n = ctx.shell.fs.lookup(f, ctx.shell.cwd, ctx.creds);
        if (n.kind !== "dir") throw new FsError(ENOTDIR);
        if (n.children.size) throw new FsError(ENOTEMPTY);
        ctx.shell.fs.unlink(f, ctx.shell.cwd, ctx.creds);
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        stderr += `rmdir: failed to remove '${f}': ${e.reason}\n`;
      }
    }
    return { stdout: "", stderr, code: stderr ? 1 : 0 };
  },
  rm: (ctx) => {
    const { flags, rest } = opts(ctx.args);
    const { shell, creds } = ctx;
    const r = flags.has("r") || flags.has("R");
    const force = flags.has("f");
    let stderr = "";
    for (const f of rest) {
      try {
        const n = shell.fs.lookup(f, shell.cwd, creds, false);
        if (n.kind === "dir" && !r) {
          stderr += `rm: cannot remove '${f}': ${EISDIR}\n`;
          continue;
        }
        shell.fs.unlink(f, shell.cwd, creds);
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        if (force && e.reason === ENOENT) continue;
        stderr += `rm: cannot remove '${f}': ${e.reason}\n`;
      }
    }
    return { stdout: "", stderr, code: stderr ? 1 : 0 };
  },
  cp: (ctx) => {
    const { flags, rest } = opts(ctx.args);
    const { shell, creds } = ctx;
    const { fs, cwd } = shell;
    if (rest.length < 2) return err("cp: missing file operand\n");
    const dest = rest.pop() as string;
    let stderr = "";
    for (const s of rest) {
      try {
        const src = fs.lookup(s, cwd, creds);
        if (src.kind === "dir" && !(flags.has("r") || flags.has("R") || flags.has("a"))) {
          stderr += `cp: -r not specified; omitting directory '${s}'\n`;
          continue;
        }
        if (!fs.can(src, creds, 4)) throw new FsError(EACCES);
        let target = dest;
        if (fs.exists(dest, cwd, creds) && fs.lookup(dest, cwd, creds).kind === "dir") target = `${dest}/${basename(normalize(s, cwd))}`;
        const abs = normalize(target, cwd);
        if (src.kind === "file" && fs.exists(abs, "/", creds)) {
          const d = fs.lookup(abs, "/", creds);
          if (!fs.can(d, creds, 2)) throw new FsError(EACCES);
          d.content = src.content;
        } else {
          const made = fs.create(abs, "/", creds, src.kind, src.mode & ~shell.umask & 0o777);
          const copy = copyTree(src, creds);
          made.content = copy.content;
          made.children = copy.children;
          if (copy.program) made.program = copy.program;
        }
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        stderr += e.reason === EACCES ? `cp: cannot open '${s}' for reading: ${e.reason}\n` : `cp: cannot stat '${s}': ${e.reason}\n`;
      }
    }
    return { stdout: "", stderr, code: stderr ? 1 : 0 };
  },
  mv: (ctx) => {
    const { shell, creds } = ctx;
    const { fs, cwd } = shell;
    const rest = ctx.args.filter((a) => !a.startsWith("-"));
    if (rest.length < 2) return err("mv: missing file operand\n");
    const dest = rest.pop() as string;
    let stderr = "";
    for (const s of rest) {
      try {
        const src = fs.lookup(s, cwd, creds, false);
        let target = normalize(dest, cwd);
        if (fs.exists(target, "/", creds) && fs.lookup(target, "/", creds).kind === "dir") target = `${target}/${basename(normalize(s, cwd))}`;
        const parent = fs.lookup(dirname(target), "/", creds);
        if (!fs.can(parent, creds, 2)) throw new FsError(EACCES);
        fs.unlink(s, cwd, creds);
        parent.children.set(basename(target), src);
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        stderr += `mv: cannot move '${s}' to '${dest}': ${e.reason}\n`;
      }
    }
    return { stdout: "", stderr, code: stderr ? 1 : 0 };
  },
  ln: (ctx) => {
    const { flags, rest } = opts(ctx.args);
    if (!flags.has("s")) return err("ln: this simulator only makes symbolic links: use ln -s\n");
    return wrap(ctx, () => {
      const n = ctx.shell.fs.create(rest[1] ?? basename(rest[0] ?? ""), ctx.shell.cwd, ctx.creds, "link", 0o777);
      n.target = rest[0] ?? "";
      return ok();
    }, (r) => `ln: failed to create symbolic link '${rest[1]}': ${r === EEXIST ? EEXIST : r}\n`);
  },
  stat: (ctx) => {
    const { flags, rest } = opts(ctx.args, "c");
    const { fs, cwd } = ctx.shell;
    const f = rest[0] ?? "";
    return wrap(ctx, () => {
      const n = fs.lookup(f, cwd, ctx.creds, false);
      const fmt = flags.get("c");
      if (fmt) {
        return ok(`${fmt
          .replace(/%a/g, (n.mode & 0o7777).toString(8))
          .replace(/%A/g, modeString(n))
          .replace(/%U/g, fs.userName(n.uid))
          .replace(/%G/g, fs.groupName(n.gid))
          .replace(/%s/g, String(size(n)))
          .replace(/%n/g, f)}\n`);
      }
      return ok(
        `  File: ${f}\n  Size: ${size(n)}\nAccess: (${(n.mode & 0o7777).toString(8).padStart(4, "0")}/${modeString(n)})  ` +
          `Uid: (${String(n.uid).padStart(5)}/${fs.userName(n.uid).padStart(8)})   Gid: (${String(n.gid).padStart(5)}/${fs.groupName(n.gid).padStart(8)})\n`,
      );
    }, (r) => `stat: cannot statx '${f}': ${r}\n`);
  },
  file: (ctx) => {
    const { fs, cwd } = ctx.shell;
    let stdout = "";
    for (const f of ctx.args) {
      try {
        const n = fs.lookup(f, cwd, ctx.creds, false);
        const what =
          n.kind === "dir" ? "directory"
          : n.kind === "link" ? `symbolic link to ${n.target}`
          : n.program ? "ELF 64-bit LSB pie executable, x86-64"
          : n.content === "" ? "empty"
          : n.content.includes("\0") ? "data"
          : n.content.startsWith("#!") ? `a ${n.content.slice(2).split("\n")[0]} script, ASCII text executable`
          : "ASCII text";
        stdout += `${f}: ${what}\n`;
      } catch {
        stdout += `${f}: cannot open \`${f}' (No such file or directory)\n`;
      }
    }
    return ok(stdout);
  },
  strings: (ctx) => {
    const inp = inputs(ctx, ctx.args);
    const out = inp.flatMap((f) => f.text.match(/[\x20-\x7e]{4,}/g) ?? []);
    return { stdout: join(out), stderr: inp.errors, code: inp.errors ? 1 : 0 };
  },
  rev: (ctx) => {
    const inp = inputs(ctx, ctx.args);
    return ok(join(inp.flatMap((f) => lines(f.text)).map((l) => [...l].reverse().join(""))));
  },
  tee: (ctx) => {
    const { flags, rest } = opts(ctx.args);
    for (const f of rest) {
      const res = ctx.shell.exec(`printf '' ${flags.has("a") ? ">>" : ">"} ${f}`, "", ctx.creds);
      if (res.terminal) return err(res.terminal.replace("bash:", "tee:"), 1, ctx.stdin);
      ctx.shell.fs.lookup(f, ctx.shell.cwd, ctx.creds).content += ctx.stdin;
    }
    return ok(ctx.stdin);
  },
  seq: (ctx) => {
    const n = ctx.args.map(Number);
    const [a, b] = n.length === 1 ? [1, n[0] as number] : [n[0] as number, n[1] as number];
    const out: string[] = [];
    for (let i = a; i <= b; i++) out.push(String(i));
    return ok(join(out));
  },
  sleep: () => ok(),
  basename: (ctx) => ok(`${basename((ctx.args[0] ?? "").replace(/\/+$/, ""))}\n`),
  dirname: (ctx) => ok(`${dirname(ctx.args[0] ?? "")}\n`),
  base64: (ctx) => {
    const { flags, rest } = opts(ctx.args);
    const inp = inputs(ctx, rest);
    const text = inp.map((f) => f.text).join("");
    const bytes = (s: string) => new TextEncoder().encode(s);
    if (flags.has("d")) {
      try {
        return ok(new TextDecoder().decode(Uint8Array.from(atob(text.replace(/\s/g, "")), (c) => c.charCodeAt(0))));
      } catch {
        return err("base64: invalid input\n");
      }
    }
    const b = btoa(String.fromCharCode(...bytes(text)));
    return ok(`${b.replace(/(.{76})/g, "$1\n").replace(/\n$/, "")}\n`);
  },
  sudo: (ctx) => {
    const { shell, creds } = ctx;
    const me = shell.fs.userName(creds.uid);
    const rules = shell.sudoRules[me];
    if (ctx.args[0] === "-l") {
      if (rules) return ok(`User ${me} may run the following commands on ${shell.host}:\n${rules.map((r) => `    (root) NOPASSWD: ${r}\n`).join("")}`);
      return shell.sudoers[me]
        ? ok(`User ${me} may run the following commands on ${shell.host}:\n    (ALL : ALL) ALL\n`)
        : ok(`User ${me} is not allowed to run sudo on ${shell.host}.\n`);
    }
    if (ctx.args.length === 0) return err("usage: sudo command\n");
    if (rules && !shell.sudoers[me] && creds.uid !== 0) {
      const name = ctx.args[0] as string;
      const full = name.includes("/") ? name : `/usr/bin/${name}`;
      if (!rules.some((r) => r === full || r === name)) return err(`Sorry, user ${me} is not allowed to execute '${[full, ...ctx.args.slice(1)].join(" ")}' as root on ${shell.host}.\n`);
    } else if (!shell.sudoers[me] && creds.uid !== 0) return err(`${me} is not in the sudoers file.\n`);
    const root: Creds = { uid: 0, euid: 0, egid: 0, gids: [0] };
    return shell.invoke(ctx.args, ctx.stdin, root, ctx.piped);
  },
  passwd: () => ok("(Passwords don't change in this simulator.)\n"),
  sha256sum: (ctx) => {
    const { flags, rest } = opts(ctx.args);
    const inp = inputs(ctx, rest);
    if (flags.has("c")) {
      let out = "";
      let bad = 0;
      for (const f of inp) {
        for (const l of lines(f.text)) {
          const m = /^([0-9a-f]{64})\s+\*?(.+)$/.exec(l);
          if (!m) continue;
          try {
            const same = sha256(ctx.shell.fs.lookup(m[2] as string, ctx.shell.cwd, ctx.creds).content) === m[1];
            out += `${m[2]}: ${same ? "OK" : "FAILED"}\n`;
            if (!same) bad++;
          } catch (e) {
            if (!(e instanceof FsError)) throw e;
            bad++;
            out += `${m[2]}: FAILED open or read\n`;
          }
        }
      }
      return { stdout: out, stderr: bad ? `sha256sum: WARNING: ${bad} computed checksum${bad > 1 ? "s" : ""} did NOT match\n` : "", code: bad ? 1 : 0 };
    }
    const named = rest.length > 0;
    const out = inp.map((f) => `${sha256(f.text)}  ${named ? f.name : "-"}\n`).join("");
    return { stdout: out, stderr: inp.errors, code: inp.errors ? 1 : 0 };
  },
  jq: (ctx) => {
    const { flags, rest } = opts(ctx.args);
    const filter = rest[0];
    if (filter === undefined) return err("usage: jq [-r] [-c] <filter> [file]\n", 2);
    const inp = inputs(ctx, rest.slice(1));
    try {
      const stderr = inp.errors.replace(/^jq: (.*): (No such.*|Permission.*)$/gm, "jq: error: Could not open file $1: $2");
      return { stdout: jq(filter, inp.map((f) => f.text).join(""), flags.has("r"), flags.has("c")), stderr, code: stderr ? 2 : 0 };
    } catch (e) {
      if (e instanceof SyntaxError) return err("jq: error: input is not valid JSON\n", 2);
      if (e instanceof JqError) return err(e.message.startsWith("jq:") ? e.message : `jq: this simulator doesn't handle "${e.message}". It knows paths, [], |, select, ==, and, or, test, length and keys. Try real jq in your VM.\n`, 5);
      throw e;
    }
  },
  man: (ctx) => {
    const page = MAN[ctx.args[0] ?? ""];
    if (!ctx.args[0]) return err("What manual page do you want?\n");
    return page ? ok(`${page.trim()}\n`) : err(`No manual entry for ${ctx.args[0]}\n`, 16);
  },
  help: (ctx) =>
    ok(
      "This is a simulated Linux shell: real commands, a practice filesystem, nothing to break.\n" +
        "Move:   pwd  ls  cd\nRead:   cat  head  tail  wc  file  strings  base64\nSearch: grep  find\n" +
        "Shape:  sort  uniq  cut  tr  sed  awk  tee\nChange: touch  mkdir  cp  mv  rm  chmod  chown\n" +
        "Data:   jq  sha256sum\nPeople: whoami  id  groups  sudo\nRunning: ps  kill\nLearn:  man <command>\n" +
        "Pipes and redirection work:  |  >  >>  <  2>/dev/null\n" +
        "Finish a flag mission with:  submit <flag>\n" +
        (ctx.shell.helpExtra ? `${ctx.shell.helpExtra}\n` : ""),
    ),
  submit: (ctx) => {
    const v = ctx.args.join(" ").trim();
    if (!v) return err("usage: submit <the flag you found>\n");
    ctx.shell.submitted.push(v);
    return ok();
  },
};
