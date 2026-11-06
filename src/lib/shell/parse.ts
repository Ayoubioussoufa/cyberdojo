/**
 * Bash's grammar, the part a learner meets in the first months: quoting,
 * variables, command substitution, globs, pipes, redirection, ; && || and &.
 */

export interface Piece {
  text: string;
  /** Quoted text is never split or globbed. */
  quoted: boolean;
  /** "var" pieces are expanded; "sub" pieces are a $(command). */
  type: "lit" | "var" | "sub";
}

export type Word = Piece[];

export interface Redirect {
  fd: 1 | 2 | 0;
  mode: "write" | "append" | "read" | "dup";
  target: Word | null;
}

export interface Simple {
  words: Word[];
  redirects: Redirect[];
  text: string;
}

export interface Pipeline {
  commands: Simple[];
  background: boolean;
}

export interface ListItem {
  op: ";" | "&&" | "||" | null;
  pipeline: Pipeline;
}

export class SyntaxErr extends Error {}

type Tok = { t: "word"; word: Word } | { t: "op"; op: string; fd?: number };

function readDollar(s: string, i: number, quoted: boolean, out: Piece[]): number {
  const next = s[i + 1];
  if (next === "(") {
    let depth = 1;
    let j = i + 2;
    while (j < s.length && depth > 0) {
      if (s[j] === "(") depth++;
      if (s[j] === ")") depth--;
      j++;
    }
    if (depth > 0) throw new SyntaxErr("unexpected end of input while looking for `)'");
    out.push({ text: s.slice(i + 2, j - 1), quoted, type: "sub" });
    return j;
  }
  if (next === "{") {
    const end = s.indexOf("}", i);
    if (end < 0) throw new SyntaxErr("bad substitution");
    out.push({ text: s.slice(i + 2, end), quoted, type: "var" });
    return end + 1;
  }
  if (next === "?" || next === "$" || next === "#") {
    out.push({ text: next, quoted, type: "var" });
    return i + 2;
  }
  const m = /^[A-Za-z_][A-Za-z0-9_]*|^[0-9]/.exec(s.slice(i + 1));
  if (m) {
    out.push({ text: m[0], quoted, type: "var" });
    return i + 1 + m[0].length;
  }
  out.push({ text: "$", quoted, type: "lit" });
  return i + 1;
}

function tokenize(s: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i] as string;
    if (c === " " || c === "\t" || c === "\n") {
      i++;
      continue;
    }
    if (c === "#") break;
    if (c === "&" && s[i + 1] === "&") {
      toks.push({ t: "op", op: "&&" });
      i += 2;
      continue;
    }
    if (c === "|" && s[i + 1] === "|") {
      toks.push({ t: "op", op: "||" });
      i += 2;
      continue;
    }
    if (c === "|" || c === ";" || c === "&") {
      toks.push({ t: "op", op: c });
      i++;
      continue;
    }
    const fdMatch = /^([012])?(>>|>&|>|<)/.exec(s.slice(i));
    if (fdMatch) {
      const fd = fdMatch[1] ? Number(fdMatch[1]) : undefined;
      const op = fdMatch[2] as string;
      toks.push(fd === undefined ? { t: "op", op } : { t: "op", op, fd });
      i += fdMatch[0].length;
      continue;
    }
    const pieces: Piece[] = [];
    let lit = "";
    const flush = () => {
      if (lit) pieces.push({ text: lit, quoted: false, type: "lit" });
      lit = "";
    };
    let sawQuote = false;
    while (i < s.length) {
      const ch = s[i] as string;
      if (" \t\n|;&<>".includes(ch)) break;
      if (ch === "\\") {
        flush();
        pieces.push({ text: s[i + 1] ?? "", quoted: true, type: "lit" });
        i += 2;
      } else if (ch === "'") {
        flush();
        sawQuote = true;
        const end = s.indexOf("'", i + 1);
        if (end < 0) throw new SyntaxErr("unexpected EOF while looking for matching `''");
        pieces.push({ text: s.slice(i + 1, end), quoted: true, type: "lit" });
        i = end + 1;
      } else if (ch === '"') {
        flush();
        sawQuote = true;
        i++;
        let buf = "";
        const fl = () => {
          if (buf) pieces.push({ text: buf, quoted: true, type: "lit" });
          buf = "";
        };
        for (;;) {
          if (i >= s.length) throw new SyntaxErr('unexpected EOF while looking for matching `"\'');
          const d = s[i] as string;
          if (d === '"') {
            i++;
            break;
          }
          if (d === "\\" && '"\\$`'.includes(s[i + 1] ?? "")) {
            buf += s[i + 1];
            i += 2;
          } else if (d === "$") {
            fl();
            i = readDollar(s, i, true, pieces);
          } else {
            buf += d;
            i++;
          }
        }
        fl();
      } else if (ch === "$") {
        flush();
        i = readDollar(s, i, false, pieces);
      } else {
        lit += ch;
        i++;
      }
    }
    flush();
    if (pieces.length === 0 && sawQuote) pieces.push({ text: "", quoted: true, type: "lit" });
    toks.push({ t: "word", word: pieces });
  }
  return toks;
}

export function parse(line: string): ListItem[] {
  const toks = tokenize(line);
  const items: ListItem[] = [];
  let i = 0;
  let op: ListItem["op"] = null;
  const bad = (near: string) => new SyntaxErr(`syntax error near unexpected token \`${near}'`);

  while (i < toks.length) {
    const commands: Simple[] = [];
    let background = false;
    for (;;) {
      const words: Word[] = [];
      const redirects: Redirect[] = [];
      while (i < toks.length) {
        const tok = toks[i] as Tok;
        if (tok.t === "word") {
          words.push(tok.word);
          i++;
        } else if ([">", ">>", "<", ">&"].includes(tok.op)) {
          const fd = (tok.fd ?? (tok.op === "<" ? 0 : 1)) as 0 | 1 | 2;
          const next = toks[i + 1];
          if (!next || next.t !== "word") throw bad("newline");
          if (tok.op === ">&") {
            redirects.push({ fd, mode: "dup", target: next.word });
          } else {
            redirects.push({
              fd,
              mode: tok.op === ">" ? "write" : tok.op === ">>" ? "append" : "read",
              target: next.word,
            });
          }
          i += 2;
        } else break;
      }
      if (words.length === 0 && redirects.length === 0) {
        const tok = toks[i];
        throw bad(tok && tok.t === "op" ? tok.op : "newline");
      }
      commands.push({ words, redirects, text: "" });
      const tok = toks[i];
      if (tok && tok.t === "op" && tok.op === "|") {
        i++;
        if (i >= toks.length) throw new SyntaxErr("syntax error: unexpected end of file");
        continue;
      }
      break;
    }
    const tok = toks[i];
    let nextOp: ListItem["op"] = null;
    if (tok && tok.t === "op") {
      if (tok.op === "&") background = true;
      else if (tok.op === ";" || tok.op === "&&" || tok.op === "||") nextOp = tok.op;
      else throw bad(tok.op);
      i++;
    }
    items.push({ op, pipeline: { commands, background } });
    op = nextOp ?? ";";
    if (nextOp && nextOp !== ";" && i >= toks.length) throw bad("newline");
  }
  return items;
}

/** Turns a glob into a RegExp. Quoted characters arrive escaped with a backslash. */
export function globToRegExp(glob: string): RegExp {
  let re = "^";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i] as string;
    if (c === "\\") {
      i++;
      re += (glob[i] ?? "").replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    } else if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else if (c === "[") {
      const end = glob.indexOf("]", i + 2);
      if (end < 0) re += "\\[";
      else {
        let set = glob.slice(i + 1, end);
        if (set.startsWith("!")) set = `^${set.slice(1)}`;
        re += `[${set}]`;
        i = end;
      }
    } else re += c.replace(/[.+^${}()|\\/]/g, "\\$&");
  }
  return new RegExp(`${re}$`);
}

const CLASSES: Record<string, string> = {
  alpha: "a-zA-Z",
  digit: "0-9",
  alnum: "a-zA-Z0-9",
  upper: "A-Z",
  lower: "a-z",
  space: " \\t\\n\\r\\f\\v",
  punct: "!-\\/:-@\\[-`{-~",
  xdigit: "0-9A-Fa-f",
};

/** POSIX basic or extended regular expression → JavaScript RegExp source. */
export function posixToJs(src: string, extended: boolean): string {
  let out = "";
  let i = 0;
  while (i < src.length) {
    const c = src[i] as string;
    if (c === "[") {
      let j = i + 1;
      if (src[j] === "^") j++;
      if (src[j] === "]") j++;
      while (j < src.length && src[j] !== "]") {
        if (src[j] === "[" && src[j + 1] === ":") {
          const e = src.indexOf(":]", j);
          if (e > 0) j = e + 1;
        }
        j++;
      }
      let body = src.slice(i + 1, j);
      body = body.replace(/\[:(\w+):\]/g, (_, n: string) => CLASSES[n] ?? "");
      if (body.startsWith("^]")) body = `^\\]${body.slice(2)}`;
      else if (body.startsWith("]")) body = `\\]${body.slice(1)}`;
      out += `[${body.replace(/\\(?![tnrfv\]\[\/-])/g, "\\\\").replace(/(?<!\\)\[/g, "\\[")}]`;
      i = j + 1;
    } else if (c === "\\") {
      const n = src[i + 1] ?? "";
      if (!extended && "+?|(){}".includes(n)) out += n;
      else if (n === "<" || n === ">") out += "\\b";
      else out += `\\${n}`;
      i += 2;
    } else if (!extended && "+?|(){}".includes(c)) {
      out += `\\${c}`;
      i++;
    } else {
      out += c === "/" ? "\\/" : c;
      i++;
    }
  }
  return out;
}
