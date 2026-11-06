/**
 * A small SQLite for the terminal: SELECT only, on in-memory tables. It covers
 * what the SQL missions teach, and scripts/check-sim-tools.ts runs every feature
 * against real SQLite, so anything taught here behaves the same on a real server.
 */
import type { Program } from "./shell";

export type Cell = string | number | null;

export interface Table {
  name: string;
  /** Column name → "INTEGER" or "TEXT". */
  columns: [string, "INTEGER" | "TEXT"][];
  rows: Cell[][];
}

class SqlError extends Error {}

type Tok = { t: "id" | "str" | "num" | "op" | "kw"; v: string };

const KEYWORDS = new Set(["SELECT", "DISTINCT", "FROM", "WHERE", "AND", "OR", "NOT", "LIKE", "IS", "NULL", "IN", "AS", "ORDER", "BY", "ASC", "DESC", "LIMIT", "OFFSET"]);

function lex(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i] as string;
    if (/\s/.test(c)) {
      i++;
    } else if (src.startsWith("--", i)) {
      while (i < src.length && src[i] !== "\n") i++;
    } else if (c === "'") {
      let s = "";
      i++;
      for (;;) {
        if (i >= src.length) throw new SqlError("unrecognized token: \"'\"");
        if (src[i] === "'") {
          if (src[i + 1] !== "'") break;
          i++;
        }
        s += src[i++];
      }
      i++;
      out.push({ t: "str", v: s });
    } else if (c === '"') {
      const end = src.indexOf('"', i + 1);
      if (end < 0) throw new SqlError("unrecognized token: '\"'");
      out.push({ t: "id", v: src.slice(i + 1, end) });
      i = end + 1;
    } else if (/[0-9]/.test(c)) {
      const m = /^[0-9]+(\.[0-9]+)?/.exec(src.slice(i)) as RegExpExecArray;
      out.push({ t: "num", v: m[0] });
      i += m[0].length;
    } else if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i)) as RegExpExecArray;
      const up = m[0].toUpperCase();
      out.push(KEYWORDS.has(up) ? { t: "kw", v: up } : { t: "id", v: m[0] });
      i += m[0].length;
    } else {
      const two = src.slice(i, i + 2);
      if (["!=", "<>", "<=", ">=", "||"].includes(two)) {
        out.push({ t: "op", v: two });
        i += 2;
      } else if ("=<>+-*/%(),;.".includes(c)) {
        out.push({ t: "op", v: c });
        i++;
      } else {
        throw new SqlError(`unrecognized token: "${c}"`);
      }
    }
  }
  return out;
}

type Expr =
  | { k: "lit"; v: Cell }
  | { k: "col"; name: string }
  | { k: "bin"; op: string; a: Expr; b: Expr }
  | { k: "un"; op: string; a: Expr }
  | { k: "call"; fn: string; args: Expr[]; star?: boolean }
  | { k: "in"; a: Expr; list: Expr[]; not: boolean }
  | { k: "isnull"; a: Expr; not: boolean };

interface Query {
  distinct: boolean;
  items: ({ star: true } | { star?: false; e: Expr; text: string; alias?: string })[];
  from: string | null;
  where: Expr | null;
  order: { e: Expr; desc: boolean }[];
  limit: number | null;
  offset: number;
}

const AGG = new Set(["count", "min", "max", "sum"]);

class Parser {
  private p = 0;
  constructor(private toks: Tok[]) {}
  private peek = () => this.toks[this.p];
  private is = (v: string) => {
    const t = this.peek();
    return !!t && t.v === v && (t.t === "kw" || t.t === "op");
  };
  private eat = (v: string) => (this.is(v) ? (this.p++, true) : false);
  private near(): never {
    const t = this.peek();
    throw new SqlError(t ? `near "${t.v}": syntax error` : "incomplete input");
  }
  private need(v: string) {
    if (!this.eat(v)) this.near();
  }

  query(): Query {
    this.need("SELECT");
    const distinct = this.eat("DISTINCT");
    const items: Query["items"] = [];
    do {
      if (this.eat("*")) {
        items.push({ star: true });
        continue;
      }
      const start = this.p;
      const e = this.expr();
      const text = this.toks.slice(start, this.p).map((t) => (t.t === "str" ? `'${t.v}'` : t.v)).join("");
      let alias: string | undefined;
      if (this.eat("AS") || this.peek()?.t === "id") {
        const a = this.peek();
        if (!a || a.t !== "id") this.near();
        alias = a.v;
        this.p++;
      }
      items.push(alias === undefined ? { e, text } : { e, text, alias });
    } while (this.eat(","));
    let from: string | null = null;
    if (this.eat("FROM")) {
      const t = this.peek();
      if (!t || t.t !== "id") this.near();
      from = t.v;
      this.p++;
    }
    const where = this.eat("WHERE") ? this.expr() : null;
    const order: Query["order"] = [];
    if (this.eat("ORDER")) {
      this.need("BY");
      do {
        const e = this.expr();
        const desc = this.eat("DESC");
        if (!desc) this.eat("ASC");
        order.push({ e, desc });
      } while (this.eat(","));
    }
    let limit: number | null = null;
    let offset = 0;
    if (this.eat("LIMIT")) {
      const t = this.peek();
      if (!t || t.t !== "num") this.near();
      limit = Number(t.v);
      this.p++;
      if (this.eat("OFFSET")) {
        const o = this.peek();
        if (!o || o.t !== "num") this.near();
        offset = Number(o.v);
        this.p++;
      }
    }
    this.eat(";");
    if (this.peek()) this.near();
    return { distinct, items, from, where, order, limit, offset };
  }

  private expr(): Expr {
    return this.or();
  }
  private or(): Expr {
    let a = this.and();
    while (this.eat("OR")) a = { k: "bin", op: "OR", a, b: this.and() };
    return a;
  }
  private and(): Expr {
    let a = this.not();
    while (this.eat("AND")) a = { k: "bin", op: "AND", a, b: this.not() };
    return a;
  }
  private not(): Expr {
    return this.eat("NOT") ? { k: "un", op: "NOT", a: this.not() } : this.cmp();
  }
  private cmp(): Expr {
    const a = this.add();
    if (this.eat("IS")) {
      const not = this.eat("NOT");
      this.need("NULL");
      return { k: "isnull", a, not };
    }
    const negated = this.eat("NOT");
    if (this.eat("IN")) {
      this.need("(");
      const list: Expr[] = [];
      do list.push(this.expr());
      while (this.eat(","));
      this.need(")");
      return { k: "in", a, list, not: negated };
    }
    if (this.eat("LIKE")) {
      const e: Expr = { k: "bin", op: "LIKE", a, b: this.add() };
      return negated ? { k: "un", op: "NOT", a: e } : e;
    }
    if (negated) this.near();
    for (const op of ["=", "!=", "<>", "<=", ">=", "<", ">"]) if (this.eat(op)) return { k: "bin", op, a, b: this.add() };
    return a;
  }
  private add(): Expr {
    let a = this.mul();
    for (;;) {
      const op = ["+", "-", "||"].find((o) => this.is(o));
      if (!op) return a;
      this.p++;
      a = { k: "bin", op, a, b: this.mul() };
    }
  }
  private mul(): Expr {
    let a = this.atom();
    for (;;) {
      const op = ["*", "/", "%"].find((o) => this.is(o));
      if (!op) return a;
      this.p++;
      a = { k: "bin", op, a, b: this.atom() };
    }
  }
  private atom(): Expr {
    const t = this.peek();
    if (!t) this.near();
    if (t.t === "str") return this.p++, { k: "lit", v: t.v };
    if (t.t === "num") return this.p++, { k: "lit", v: Number(t.v) };
    if (t.t === "kw" && t.v === "NULL") return this.p++, { k: "lit", v: null };
    if (this.eat("-")) return { k: "un", op: "-", a: this.atom() };
    if (this.eat("(")) {
      const e = this.expr();
      this.need(")");
      return e;
    }
    if (t.t === "id") {
      this.p++;
      if (this.eat("(")) {
        const fn = t.v.toLowerCase();
        if (this.eat("*")) {
          this.need(")");
          return { k: "call", fn, args: [], star: true };
        }
        const args: Expr[] = [];
        if (!this.is(")")) {
          do args.push(this.expr());
          while (this.eat(","));
        }
        this.need(")");
        return { k: "call", fn, args };
      }
      return { k: "col", name: t.v };
    }
    return this.near();
  }
}

const rank = (v: Cell) => (v === null ? 0 : typeof v === "number" ? 1 : 2);

function compare(a: Cell, b: Cell): number {
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  if (typeof a === "number" && typeof b === "number") return a - b;
  const x = a as string;
  const y = b as string;
  return x < y ? -1 : x > y ? 1 : 0;
}

const numeric = (v: Cell): number => {
  if (typeof v === "number") return v;
  if (v === null) return 0;
  const m = /^\s*[+-]?[0-9]*\.?[0-9]+/.exec(v);
  return m ? Number(m[0]) : 0;
};

const text = (v: Cell) => (v === null ? null : String(v));

function likeRe(pattern: string) {
  let out = "";
  for (const c of pattern) out += c === "%" ? "[\\s\\S]*" : c === "_" ? "[\\s\\S]" : c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${out}$`, "i");
}

/** SQLite's substr: 1-based, and negative positions count from the end. */
function substr(s: string, from: number, len?: number) {
  const at = from > 0 ? from - 1 : from < 0 ? Math.max(s.length + from, 0) : 0;
  const take = from === 0 && len !== undefined ? Math.max(len - 1, 0) : len;
  return take === undefined ? s.slice(at) : s.slice(at, at + Math.max(take, 0));
}

const hasAgg = (e: Expr): boolean => {
  if (e.k === "call") return (AGG.has(e.fn) && (e.star || e.args.length === 1)) || e.args.some(hasAgg);
  if (e.k === "bin") return hasAgg(e.a) || hasAgg(e.b);
  if (e.k === "un") return hasAgg(e.a);
  return false;
};

interface Scope {
  table: Table | null;
  row: Cell[];
  rowid: number;
}

function column(scope: Scope, name: string) {
  const i = scope.table?.columns.findIndex(([c]) => c.toLowerCase() === name.toLowerCase()) ?? -1;
  return i;
}

function evaluate(e: Expr, s: Scope): Cell {
  switch (e.k) {
    case "lit":
      return e.v;
    case "col": {
      const i = column(s, e.name);
      if (i >= 0) return s.row[i] as Cell;
      if (["rowid", "oid", "_rowid_"].includes(e.name.toLowerCase()) && s.table) return s.rowid;
      throw new SqlError(`no such column: ${e.name}`);
    }
    case "un": {
      const v = evaluate(e.a, s);
      if (v === null) return null;
      return e.op === "-" ? -numeric(v) : numeric(v) === 0 ? 1 : 0;
    }
    case "isnull": {
      const isNull = evaluate(e.a, s) === null;
      return (e.not ? !isNull : isNull) ? 1 : 0;
    }
    case "in": {
      const v = convert(e.a, evaluate(e.a, s), s);
      if (v === null) return null;
      const hit = e.list.some((x) => compare(v, convert(e.a, evaluate(x, s), s)) === 0);
      return (e.not ? !hit : hit) ? 1 : 0;
    }
    case "call": {
      const args = e.args.map((a) => evaluate(a, s));
      const first = args[0] ?? null;
      if (e.fn === "substr" || e.fn === "substring") {
        if (args.length < 2 || args.length > 3) throw new SqlError(`wrong number of arguments to function ${e.fn}()`);
        if (first === null) return null;
        return substr(String(first), numeric(args[1] as Cell), args.length === 3 ? numeric(args[2] as Cell) : undefined);
      }
      if (e.fn === "length") return first === null ? null : String(first).length;
      if (e.fn === "upper") return first === null ? null : String(first).toUpperCase();
      if (e.fn === "lower") return first === null ? null : String(first).toLowerCase();
      if (e.fn === "typeof") return first === null ? "null" : typeof first === "number" ? "integer" : "text";
      throw new SqlError(`no such function: ${e.fn}`);
    }
    case "bin": {
      if (e.op === "AND" || e.op === "OR") {
        const a = evaluate(e.a, s);
        const b = evaluate(e.b, s);
        const x = a === null ? null : numeric(a) !== 0;
        const y = b === null ? null : numeric(b) !== 0;
        if (e.op === "AND") return x === false || y === false ? 0 : x === null || y === null ? null : 1;
        return x === true || y === true ? 1 : x === null || y === null ? null : 0;
      }
      let a = evaluate(e.a, s);
      let b = evaluate(e.b, s);
      if (e.op === "||") return a === null || b === null ? null : `${text(a)}${text(b)}`;
      if (a === null || b === null) return null;
      if (e.op === "LIKE") return likeRe(String(b)).test(String(a)) ? 1 : 0;
      if (["+", "-", "*", "/", "%"].includes(e.op)) {
        const x = numeric(a);
        const y = numeric(b);
        if (e.op === "+") return x + y;
        if (e.op === "-") return x - y;
        if (e.op === "*") return x * y;
        if (y === 0) return null;
        return e.op === "/" ? Math.trunc(x / y) : x % y;
      }
      b = convert(e.a, b, s);
      a = convert(e.b, a, s);
      const c = compare(a, b);
      const yes = e.op === "=" ? c === 0 : e.op === "!=" || e.op === "<>" ? c !== 0 : e.op === "<" ? c < 0 : e.op === ">" ? c > 0 : e.op === "<=" ? c <= 0 : c >= 0;
      return yes ? 1 : 0;
    }
  }
}

/** Column affinity: comparing an INTEGER column with '7' compares it with 7. */
function convert(side: Expr, v: Cell, s: Scope): Cell {
  if (side.k !== "col" || typeof v !== "string") return v;
  const i = column(s, side.name);
  if (i < 0 || s.table?.columns[i]?.[1] !== "INTEGER") return v;
  return /^\s*[+-]?[0-9]+(\.[0-9]+)?\s*$/.test(v) ? Number(v) : v;
}

function aggregate(e: Expr, scopes: Scope[]): Cell {
  if (e.k === "call" && AGG.has(e.fn) && (e.star || e.args.length === 1)) {
    if (e.star) return scopes.length;
    const vals = scopes.map((s) => evaluate(e.args[0] as Expr, s)).filter((v) => v !== null);
    if (e.fn === "count") return vals.length;
    if (vals.length === 0) return null;
    if (e.fn === "sum") return vals.reduce<number>((n, v) => n + numeric(v), 0);
    return vals.reduce((a, b) => ((e.fn === "min" ? compare(b, a) < 0 : compare(b, a) > 0) ? b : a));
  }
  if (e.k === "bin") return evaluate({ ...e, a: { k: "lit", v: aggregate(e.a, scopes) }, b: { k: "lit", v: aggregate(e.b, scopes) } }, scopes[0] ?? { table: null, row: [], rowid: 0 });
  return evaluate(e, scopes[0] ?? { table: null, row: [], rowid: 0 });
}

const truthy = (v: Cell) => v !== null && numeric(v) !== 0;

export interface QueryResult {
  names: string[];
  rows: Cell[][];
}

const schemaSql = (t: Table) => `CREATE TABLE ${t.name} (${t.columns.map(([c, ty]) => `${c} ${ty}`).join(", ")})`;

export function runQuery(tables: Table[], sql: string): QueryResult {
  const q = new Parser(lex(sql)).query();
  const master: Table = {
    name: "sqlite_master",
    columns: [["type", "TEXT"], ["name", "TEXT"], ["tbl_name", "TEXT"], ["rootpage", "INTEGER"], ["sql", "TEXT"]],
    rows: tables.map((t, i) => ["table", t.name, t.name, i + 2, schemaSql(t)]),
  };
  const lookup = (n: string) => (["sqlite_master", "sqlite_schema"].includes(n.toLowerCase()) ? master : tables.find((t) => t.name.toLowerCase() === n.toLowerCase()));
  const table = q.from === null ? null : (lookup(q.from) ?? null);
  if (q.from !== null && !table) throw new SqlError(`no such table: ${q.from}`);

  const base: Scope[] = table ? table.rows.map((row, i) => ({ table, row, rowid: i + 1 })) : [{ table: null, row: [], rowid: 0 }];
  const kept = q.where ? base.filter((s) => truthy(evaluate(q.where as Expr, s))) : base;

  const items = q.items.flatMap((it) => {
    if (!it.star) return [it];
    if (!table) throw new SqlError("no tables specified");
    return table.columns.map(([c]) => ({ e: { k: "col", name: c } as Expr, text: c, alias: undefined as string | undefined }));
  });
  const names = items.map((it) => it.alias ?? it.text);

  if (items.some((it) => hasAgg(it.e))) return { names, rows: [items.map((it) => aggregate(it.e, kept))] };

  let scopes = kept;
  if (q.order.length) {
    scopes = [...kept].sort((x, y) => {
      for (const o of q.order) {
        const c = compare(evaluate(o.e, x), evaluate(o.e, y));
        if (c) return o.desc ? -c : c;
      }
      return x.rowid - y.rowid;
    });
  }
  let rows = scopes.map((s) => items.map((it) => evaluate(it.e, s)));
  if (q.distinct) {
    const seen = new Set<string>();
    rows = rows.filter((r) => {
      const k = JSON.stringify(r);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  const end = q.limit === null ? undefined : q.offset + q.limit;
  return { names, rows: rows.slice(q.offset, end) };
}

const show = (v: Cell) => (v === null ? "" : String(v));

/** Installs `sqlite3 <file> "<query>"` for these databases. Path → tables. */
export function sqlite3(databases: Record<string, Table[]>): Program {
  return (ctx) => {
    const args = ctx.args.filter((a) => !a.startsWith("-"));
    const header = ctx.args.includes("-header");
    const [file, sql] = args;
    const say = (stdout: string) => ({ stdout, stderr: "", code: 0 });
    const fail = (stderr: string) => ({ stdout: "", stderr, code: 1 });
    if (!file) return fail('usage: sqlite3 <database> "SELECT ..."\n');
    const full = file.startsWith("/") ? file : `${ctx.shell.cwd}/${file}`.replace(/\/+/g, "/");
    const tables = databases[full];
    if (!tables) return fail(`Error: unable to open database "${file}": unable to open database file\n`);
    if (!sql) return fail('This terminal has no interactive mode. Put the query in quotes after the file: sqlite3 vault.db "SELECT ..."\n');
    if (sql.trim() === ".tables") return say(`${tables.map((t) => t.name).join("  ")}\n`);
    if (sql.trim() === ".schema") return say(tables.map((t) => `${schemaSql(t)};\n`).join(""));
    try {
      const r = runQuery(tables, sql);
      const body = r.rows.map((row) => `${row.map(show).join("|")}\n`).join("");
      return say(`${header && r.rows.length ? `${r.names.join("|")}\n` : ""}${body}`);
    } catch (e) {
      if (e instanceof SqlError) return fail(`Parse error: ${e.message}\n`);
      throw e;
    }
  };
}

export { SqlError };
