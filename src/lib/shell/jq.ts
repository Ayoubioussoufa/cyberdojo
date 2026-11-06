/**
 * A small part of jq, enough for reading JSON logs: paths, `[]`, pipes, select
 * with comparisons, `and`/`or`, length, keys, test("regex") and @tsv on arrays.
 * Anything else is refused out loud, so a learner isn't taught something false.
 */
type Json = unknown;
type Stream = Json[];
type Filter = (v: Json) => Stream;

export class JqError extends Error {}

function splitTop(s: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote = false;
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i] as string;
    if (c === '"' && s[i - 1] !== "\\") quote = !quote;
    if (!quote) {
      if (c === "(" || c === "[") depth++;
      if (c === ")" || c === "]") depth--;
      if (depth === 0 && s.startsWith(sep, i)) {
        out.push(cur);
        cur = "";
        i += sep.length - 1;
        continue;
      }
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

const jsonOrder = (v: Json) => (v === null ? 0 : v === false ? 1 : v === true ? 2 : typeof v === "number" ? 3 : typeof v === "string" ? 4 : Array.isArray(v) ? 5 : 6);
function compare(a: Json, b: Json): number {
  const x = jsonOrder(a);
  const y = jsonOrder(b);
  if (x !== y) return x - y;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "string" && typeof b === "string") return a < b ? -1 : a > b ? 1 : 0;
  return JSON.stringify(a) === JSON.stringify(b) ? 0 : 1;
}
const truthy = (v: Json) => v !== null && v !== false && v !== undefined;

function path(src: string): Filter {
  let i = 0;
  const steps: ((v: Json) => Stream)[] = [];
  if (src[0] !== ".") throw new JqError(src);
  while (i < src.length) {
    if (src[i] === ".") {
      i++;
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i));
      if (m) {
        const key = m[0];
        i += key.length;
        steps.push((v) => {
          if (v === null || v === undefined) return [null];
          if (typeof v !== "object" || Array.isArray(v)) throw new JqError(`jq: error: Cannot index ${Array.isArray(v) ? "array" : typeof v} with "${key}"\n`);
          return [(v as Record<string, Json>)[key] ?? null];
        });
      }
    } else if (src[i] === "[") {
      const end = src.indexOf("]", i);
      if (end < 0) throw new JqError(src);
      const inner = src.slice(i + 1, end);
      i = end + 1;
      if (inner === "") {
        steps.push((v) => {
          if (Array.isArray(v)) return v;
          if (v && typeof v === "object") return Object.values(v);
          throw new JqError("jq: error: Cannot iterate over this value\n");
        });
      } else if (/^-?\d+$/.test(inner)) {
        const n = Number(inner);
        steps.push((v) => [v === null ? null : ((v as Json[]).at(n) ?? null)]);
      } else throw new JqError(src);
    } else throw new JqError(src);
  }
  return (v) => steps.reduce<Stream>((s, step) => s.flatMap(step), [v]);
}

function literal(src: string): Json | undefined {
  const t = src.trim();
  if (t === "null" || t === "true" || t === "false" || /^-?\d+(\.\d+)?$/.test(t) || /^"(?:[^"\\]|\\.)*"$/.test(t)) return JSON.parse(t) as Json;
  return undefined;
}

function expr(src: string): Filter {
  const s = src.trim();
  const pipe = splitTop(s, "|");
  if (pipe.length > 1) {
    const fs = pipe.map(expr);
    return (v) => fs.reduce<Stream>((st, f) => st.flatMap(f), [v]);
  }
  const or = splitTop(s, " or ");
  if (or.length > 1) {
    const fs = or.map(expr);
    return (v) => [fs.some((f) => f(v).some(truthy))];
  }
  const and = splitTop(s, " and ");
  if (and.length > 1) {
    const fs = and.map(expr);
    return (v) => [fs.every((f) => f(v).some(truthy))];
  }
  for (const op of ["==", "!=", ">=", "<=", ">", "<"]) {
    const parts = splitTop(s, op);
    if (parts.length === 2) {
      const l = expr(parts[0] as string);
      const r = expr(parts[1] as string);
      return (v) => l(v).flatMap((a) => r(v).map((b) => {
        const c = compare(a, b);
        return op === "==" ? c === 0 : op === "!=" ? c !== 0 : op === ">" ? c > 0 : op === "<" ? c < 0 : op === ">=" ? c >= 0 : c <= 0;
      }));
    }
  }
  const lit = literal(s);
  if (lit !== undefined) return () => [lit];
  const select = /^select\((.*)\)$/s.exec(s);
  if (select) {
    const f = expr(select[1] as string);
    return (v) => (f(v).some(truthy) ? [v] : []);
  }
  const test = /^test\("((?:[^"\\]|\\.)*)"\)$/.exec(s);
  if (test) {
    const re = new RegExp(test[1] as string);
    return (v) => {
      if (typeof v !== "string") throw new JqError("jq: error: test input must be a string\n");
      return [re.test(v)];
    };
  }
  if (s === "length") return (v) => [Array.isArray(v) || typeof v === "string" ? v.length : v && typeof v === "object" ? Object.keys(v).length : v === null ? 0 : Math.abs(v as number)];
  if (s === "keys") return (v) => [Object.keys(v as object).sort()];
  if (s === "not") return (v) => [!truthy(v)];
  if (s === "@tsv") return (v) => [(v as Json[]).map((c) => (c === null ? "" : String(c))).join("\t")];
  const arr = /^\[(.*)\]$/s.exec(s);
  if (arr) {
    const fs = splitTop(arr[1] as string, ",").map(expr);
    return (v) => [fs.flatMap((f) => f(v))];
  }
  if (s.startsWith(".")) return path(s);
  throw new JqError(s);
}

export function jq(filter: string, text: string, raw: boolean, compact: boolean): string {
  const f = expr(filter);
  const docs: Json[] = [];
  const t = text.trim();
  // Real jq reads a stream of values, so one JSON object per line works too.
  try {
    docs.push(JSON.parse(t));
  } catch {
    for (const line of t.split("\n")) if (line.trim()) docs.push(JSON.parse(line));
  }
  return docs
    .flatMap(f)
    .map((v) => (raw && typeof v === "string" ? v : compact ? JSON.stringify(v) : JSON.stringify(v, null, 2)))
    .map((s) => `${s}\n`)
    .join("");
}
