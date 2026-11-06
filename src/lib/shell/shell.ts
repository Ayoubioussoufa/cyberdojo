/**
 * The interpreter: runs parsed command lines against the virtual filesystem.
 * A Shell holds one logged-in user's session; a mission inspects this state
 * to grade the learner.
 */
import { COMMANDS, type Cmd, type Ctx, type Result } from "./commands";
import { Creds, EISDIR, FsError, Vfs, basename, credsOf, normalize, type FsNode, type User } from "./fs";
import { SyntaxErr, globToRegExp, parse, type Simple, type Word } from "./parse";

export interface Proc {
  pid: number;
  ppid: number;
  user: string;
  tty: string;
  cmd: string;
  /** Catches SIGTERM: only SIGKILL stops it. */
  ignoresTerm?: boolean;
}

export type Program = (ctx: Ctx) => Result;

export class Shell {
  user: User;
  creds: Creds;
  cwd: string;
  env: Record<string, string>;
  lastExit = 0;
  history: string[] = [];
  procs: Proc[] = [];
  nextPid = 4312;
  umask = 0o022;
  host = "lab";
  sudoers: Record<string, boolean> = {};
  /** Programs a world adds, by the name a file's `program` field gives. */
  programs: Record<string, Program> = {};
  /** What `submit` received, for flag missions. */
  submitted: string[] = [];
  cleared = false;
  /** False when output isn't a terminal: ls then prints one name per line. */
  tty = true;
  private depth = 0;

  constructor(public fs: Vfs, username: string) {
    const user = fs.user(username);
    if (!user) throw new Error(`no user ${username}`);
    this.user = user;
    this.creds = credsOf(user);
    this.cwd = user.home;
    this.env = {
      HOME: user.home,
      USER: user.name,
      PATH: "/usr/local/bin:/usr/bin:/bin",
      SHELL: "/bin/bash",
      PWD: user.home,
      LANG: "C",
    };
  }

  prompt(): string {
    const home = this.env.HOME ?? "";
    const dir = this.cwd === home ? "~" : this.cwd.startsWith(`${home}/`) ? `~${this.cwd.slice(home.length)}` : this.cwd;
    return `${this.user.name}@${this.host}:${dir}${this.creds.euid === 0 ? "#" : "$"} `;
  }

  /** Runs one line typed at the prompt; returns everything shown on the terminal. */
  run(line: string): string {
    const trimmed = line.trim();
    if (trimmed && this.depth === 0) this.history.push(trimmed);
    const { terminal } = this.exec(line, "", this.creds);
    return terminal;
  }

  exec(line: string, stdin: string, creds: Creds): { stdout: string; terminal: string; code: number } {
    let terminal = "";
    let stdout = "";
    try {
      const list = parse(line);
      for (const item of list) {
        if (item.op === "&&" && this.lastExit !== 0) continue;
        if (item.op === "||" && this.lastExit === 0) continue;
        if (item.pipeline.background) {
          const cmd = item.pipeline.commands.map((c) => this.expand(c, creds).argv.join(" ")).join(" | ");
          const pid = this.nextPid++;
          this.procs.push({ pid, ppid: 1000, user: this.user.name, tty: "pts/0", cmd });
          stdout += `[1] ${pid}\n`;
          this.lastExit = 0;
          continue;
        }
        const res = this.pipeline(item.pipeline.commands, stdin, creds);
        stdout += res.stdout;
        terminal += res.stderr;
        this.lastExit = res.code;
      }
    } catch (err) {
      if (err instanceof SyntaxErr) {
        terminal += `bash: ${err.message}\n`;
        this.lastExit = 2;
      } else throw err;
    }
    return { stdout, terminal: terminal + stdout, code: this.lastExit };
  }

  private pipeline(commands: Simple[], stdin: string, creds: Creds): Result {
    let input = stdin;
    let stderr = "";
    let last: Result = { stdout: "", stderr: "", code: 0 };
    commands.forEach((cmd, i) => {
      last = this.simple(cmd, input, creds, i < commands.length - 1);
      input = last.stdout;
      stderr += last.stderr;
    });
    return { stdout: last.stdout, stderr, code: last.code };
  }

  private expand(cmd: Simple, creds: Creds) {
    const argv = cmd.words.flatMap((w) => this.expandWord(w, creds));
    return { argv };
  }

  /** One word → zero or more arguments: variables, splitting, then globs. */
  private expandWord(word: Word, creds: Creds): string[] {
    const fields: { pat: string; plain: string; glob: boolean }[] = [];
    let cur = { pat: "", plain: "", glob: false };
    let started = false;
    const esc = (s: string) => s.replace(/[\\*?[\]]/g, "\\$&");
    word.forEach((piece, index) => {
      let text = piece.text;
      if (piece.type === "var") text = this.variable(piece.text);
      if (piece.type === "sub") text = this.exec(piece.text, "", creds).stdout.replace(/\n+$/, "");
      if (piece.type === "lit" && !piece.quoted && index === 0 && (text === "~" || text.startsWith("~/"))) {
        text = (this.env.HOME ?? "") + text.slice(1);
      }
      if (piece.quoted) {
        cur.pat += esc(text);
        cur.plain += text;
        started = true;
      } else if (piece.type === "lit") {
        cur.pat += text;
        cur.plain += text;
        if (/[*?[]/.test(text)) cur.glob = true;
        started = true;
      } else {
        const parts = text.split(/[ \t\n]+/);
        parts.forEach((part, i) => {
          if (i > 0) {
            if (started) fields.push(cur);
            cur = { pat: "", plain: "", glob: false };
            started = false;
          }
          if (part) {
            cur.pat += part;
            cur.plain += part;
            if (/[*?[]/.test(part)) cur.glob = true;
            started = true;
          }
        });
      }
    });
    if (started) fields.push(cur);
    return fields.flatMap((f) => (f.glob ? this.glob(f.pat, f.plain, creds) : [f.plain]));
  }

  private variable(name: string): string {
    if (name === "?") return String(this.lastExit);
    if (name === "$") return "4021";
    if (name === "#" || /^[0-9]$/.test(name)) return name === "0" ? "bash" : name === "#" ? "0" : "";
    return this.env[name] ?? "";
  }

  private glob(pattern: string, plain: string, creds: Creds): string[] {
    const absolute = pattern.startsWith("/");
    const parts = pattern.split("/").filter(Boolean);
    let results: string[] = [absolute ? "/" : ""];
    for (const part of parts) {
      const next: string[] = [];
      for (const base of results) {
        const isPattern = /(^|[^\\])[*?[]/.test(part);
        if (!isPattern) {
          const name = part.replace(/\\(.)/g, "$1");
          const candidate = base + (base && !base.endsWith("/") ? "/" : "") + name;
          if (this.fs.exists(candidate, this.cwd, creds)) next.push(candidate);
          continue;
        }
        const re = globToRegExp(part);
        let dir: FsNode;
        try {
          dir = this.fs.lookup(base || ".", this.cwd, creds);
        } catch {
          continue;
        }
        if (dir.kind !== "dir" || !this.fs.can(dir, creds, 4)) continue;
        for (const name of [...dir.children.keys()].sort()) {
          if (name.startsWith(".") && !part.startsWith(".")) continue;
          if (re.test(name)) next.push(base + (base && !base.endsWith("/") ? "/" : "") + name);
        }
      }
      results = next;
    }
    return results.length > 0 ? results : [plain];
  }

  private simple(cmd: Simple, stdin: string, creds: Creds, piped: boolean): Result {
    let input = stdin;
    const out: { path: string | null; append: boolean; dupOf?: number }[] = [
      { path: null, append: false },
      { path: null, append: false },
      { path: null, append: false },
    ];
    let toPipeErr = false;
    for (const r of cmd.redirects) {
      const target = r.target ? (this.expandWord(r.target, creds)[0] ?? "") : "";
      if (r.mode === "dup") {
        if (target === "1" && r.fd === 2) {
          out[2] = { ...(out[1] as { path: string | null; append: boolean }) };
          toPipeErr = (out[1] as { path: string | null }).path === null;
        } else if (target === "2" && r.fd === 1) {
          out[1] = { ...(out[2] as { path: string | null; append: boolean }) };
        }
      } else if (r.mode === "read") {
        try {
          const node = this.fs.lookup(target, this.cwd, creds);
          if (node.kind === "dir") return fail(`bash: ${target}: ${EISDIR}\n`);
          if (!this.fs.can(node, creds, 4)) return fail(`bash: ${target}: Permission denied\n`);
          input = node.content;
        } catch (e) {
          if (e instanceof FsError) return fail(`bash: ${target}: ${e.reason}\n`);
          throw e;
        }
      } else {
        if (target === "/dev/null") {
          out[r.fd] = { path: "/dev/null", append: false };
          continue;
        }
        try {
          this.openForWrite(target, r.mode === "append", creds);
        } catch (e) {
          if (e instanceof FsError) return fail(`bash: ${target}: ${e.reason}\n`);
          throw e;
        }
        out[r.fd] = { path: target, append: r.mode === "append" };
      }
    }

    const argv = cmd.words.flatMap((w) => this.expandWord(w, creds));
    let res: Result;
    if (argv.length === 0) res = { stdout: "", stderr: "", code: 0 };
    else if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(argv[0] as string) && argv.length === 1) {
      const a = argv[0] as string;
      const eq = a.indexOf("=");
      this.env[a.slice(0, eq)] = a.slice(eq + 1);
      res = { stdout: "", stderr: "", code: 0 };
    } else res = this.invoke(argv, input, creds, !this.tty || piped || out[1]?.path !== null);

    let stdout = res.stdout;
    let stderr = res.stderr;
    const send = (data: string, sink: { path: string | null; append: boolean }) => {
      if (sink.path === "/dev/null" || !sink.path) return;
      const node = this.fs.lookup(sink.path, this.cwd, creds);
      node.content += data;
    };
    const o = out[1] as { path: string | null; append: boolean };
    const e = out[2] as { path: string | null; append: boolean };
    if (e.path !== null) {
      send(stderr, e);
      stderr = "";
    } else if (toPipeErr) {
      stdout = stderr + stdout;
      stderr = "";
    }
    if (o.path !== null) {
      send(stdout, o);
      stdout = "";
    }
    return { stdout, stderr, code: res.code };
  }

  private openForWrite(path: string, append: boolean, creds: Creds) {
    let node: FsNode;
    try {
      node = this.fs.lookup(path, this.cwd, creds);
    } catch (e) {
      if (e instanceof FsError && e.reason === "No such file or directory") {
        const mode = 0o666 & ~this.umask;
        this.fs.create(path, this.cwd, creds, "file", mode);
        return;
      }
      throw e;
    }
    if (node.kind === "dir") throw new FsError(EISDIR);
    if (!this.fs.can(node, creds, 2)) throw new FsError("Permission denied");
    if (!append) node.content = "";
  }

  /** Finds and starts a command: built-ins, then PATH, honouring set-user-ID. */
  invoke(argv: string[], stdin: string, creds: Creds, piped: boolean): Result {
    const name = argv[0] as string;
    const args = argv.slice(1);
    const make = (c: Creds): Ctx => ({ args, stdin, shell: this, creds: c, piped, name });

    const builtin = BUILTINS.has(name) ? COMMANDS[name] : undefined;
    if (builtin) return builtin(make(creds));

    let path: string | null = null;
    if (name.includes("/")) path = normalize(name, this.cwd);
    else {
      for (const dir of (this.env.PATH ?? "").split(":")) {
        if (this.fs.exists(`${dir}/${name}`, "/", creds)) {
          path = `${dir}/${name}`;
          break;
        }
      }
      if (!path) return fail(`${name}: command not found\n`, 127);
    }

    let node: FsNode;
    try {
      node = this.fs.lookup(path, "/", creds);
    } catch (e) {
      if (e instanceof FsError) return fail(`bash: ${name}: ${e.reason}\n`, e.reason === "Permission denied" ? 126 : 127);
      throw e;
    }
    if (node.kind === "dir") return fail(`bash: ${name}: Is a directory\n`, 126);
    if (!this.fs.can(node, creds, 1)) return fail(`bash: ${name}: Permission denied\n`, 126);

    // The kernel's rule: a set-user-ID file runs with its owner's effective ID.
    const running: Creds = {
      ...creds,
      euid: node.mode & 0o4000 ? node.uid : creds.euid,
      egid: node.mode & 0o2000 ? node.gid : creds.egid,
    };

    if (node.program) {
      const fn: Cmd | Program | undefined = this.programs[node.program] ?? COMMANDS[node.program];
      if (!fn) return fail(`bash: ${name}: cannot execute binary file\n`, 126);
      return fn(make(running));
    }

    // A text file with the execute bit is a script. Scripts ignore set-user-ID
    // on Linux, so they keep the caller's ids.
    if (!this.fs.can(node, creds, 4) && creds.euid !== 0) return fail(`bash: ${name}: Permission denied\n`, 126);
    if (this.depth > 6) return fail(`bash: ${name}: too many nested scripts\n`, 126);
    this.depth++;
    let stdout = "";
    let stderr = "";
    let code = 0;
    for (const line of node.content.split("\n")) {
      if (!line.trim() || line.startsWith("#")) continue;
      const r = this.exec(line, stdin, creds);
      stdout += r.stdout;
      stderr += r.terminal.slice(0, r.terminal.length - r.stdout.length);
      code = r.code;
    }
    this.depth--;
    return { stdout, stderr, code };
  }
}

function fail(stderr: string, code = 1): Result {
  return { stdout: "", stderr, code };
}

/** Commands that are part of the shell itself, not files on disk. */
const BUILTINS = new Set([
  "cd", "pwd", "echo", "export", "unset", "history", "clear", "umask", "help", "exit",
  "true", "false", "submit", "type", "printf", "kill",
]);

export { basename };
