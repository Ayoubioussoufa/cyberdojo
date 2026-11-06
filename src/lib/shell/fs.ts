/**
 * The simulator's filesystem: an in-memory tree with real Unix semantics for
 * owners, groups, mode bits, the sticky bit and path resolution. Everything a
 * lesson says about permissions is enforced here, so the feedback is honest.
 */

export interface User {
  name: string;
  uid: number;
  gid: number;
  /** Extra groups, by gid. */
  groups: number[];
  home: string;
  shell: string;
}

export interface Group {
  name: string;
  gid: number;
}

export type NodeKind = "file" | "dir" | "link";

export interface FsNode {
  kind: NodeKind;
  mode: number;
  uid: number;
  gid: number;
  /** Seconds since the epoch. */
  mtime: number;
  content: string;
  children: Map<string, FsNode>;
  target: string;
  /** A built-in program this file stands for (see programs in commands.ts). */
  program?: string;
}

export class FsError extends Error {
  constructor(public reason: string) {
    super(reason);
  }
}

export const ENOENT = "No such file or directory";
export const EACCES = "Permission denied";
export const ENOTDIR = "Not a directory";
export const EISDIR = "Is a directory";
export const EPERM = "Operation not permitted";
export const EEXIST = "File exists";
export const ENOTEMPTY = "Directory not empty";

export const NOW = 1_793_000_000; // A fixed clock: Oct 2026.

export function newNode(kind: NodeKind, mode: number, uid: number, gid: number): FsNode {
  return { kind, mode, uid, gid, mtime: NOW, content: "", children: new Map(), target: "" };
}

export function normalize(path: string, cwd: string): string {
  const parts = (path.startsWith("/") ? path : `${cwd}/${path}`).split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return `/${out.join("/")}`;
}

export const dirname = (path: string) => {
  const i = path.lastIndexOf("/");
  return i <= 0 ? "/" : path.slice(0, i);
};
export const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);

export class Vfs {
  root: FsNode = newNode("dir", 0o755, 0, 0);
  users: User[] = [];
  groups: Group[] = [];

  user(name: string): User | undefined {
    return this.users.find((u) => u.name === name);
  }
  userName(uid: number): string {
    return this.users.find((u) => u.uid === uid)?.name ?? String(uid);
  }
  groupName(gid: number): string {
    return this.groups.find((g) => g.gid === gid)?.name ?? String(gid);
  }
  groupId(name: string): number | undefined {
    return this.groups.find((g) => g.name === name)?.gid;
  }

  /** Permission check for one access bit (4 read, 2 write, 1 execute). */
  can(node: FsNode, who: Creds, bit: number): boolean {
    if (who.euid === 0) return bit !== 1 || node.kind === "dir" || (node.mode & 0o111) !== 0;
    if (node.uid === who.euid) return ((node.mode >> 6) & bit) !== 0;
    if (who.gids.includes(node.gid)) return ((node.mode >> 3) & bit) !== 0;
    return (node.mode & bit) !== 0;
  }

  /** Walks a path, checking execute (search) permission on every directory. */
  lookup(path: string, cwd: string, who: Creds, follow = true, depth = 0): FsNode {
    if (depth > 8) throw new FsError("Too many levels of symbolic links");
    const abs = normalize(path, cwd);
    let node = this.root;
    const parts = abs.split("/").filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
      if (node.kind !== "dir") throw new FsError(ENOTDIR);
      if (!this.can(node, who, 1)) throw new FsError(EACCES);
      const next = node.children.get(parts[i] as string);
      if (!next) throw new FsError(ENOENT);
      node = next;
      const isLast = i === parts.length - 1;
      if (node.kind === "link" && (follow || !isLast)) {
        const here = `/${parts.slice(0, i).join("/")}`;
        const rest = parts.slice(i + 1).join("/");
        const nextPath = normalize(rest ? `${node.target}/${rest}` : node.target, here);
        return this.lookup(nextPath, "/", who, follow, depth + 1);
      }
    }
    if (path.endsWith("/") && node.kind !== "dir") throw new FsError(ENOTDIR);
    return node;
  }

  exists(path: string, cwd: string, who: Creds): boolean {
    try {
      this.lookup(path, cwd, who);
      return true;
    } catch {
      return false;
    }
  }

  /** Adds a child, checking write + search on the parent directory. */
  create(path: string, cwd: string, who: Creds, kind: NodeKind, mode: number): FsNode {
    const abs = normalize(path, cwd);
    const parent = this.lookup(dirname(abs), "/", who);
    if (parent.kind !== "dir") throw new FsError(ENOTDIR);
    if (!this.can(parent, who, 2) || !this.can(parent, who, 1)) throw new FsError(EACCES);
    const name = basename(abs);
    if (parent.children.has(name)) throw new FsError(EEXIST);
    const inherit = (parent.mode & 0o2000) !== 0;
    const node = newNode(kind, mode, who.euid, inherit ? parent.gid : who.egid);
    if (kind === "dir" && inherit) node.mode |= 0o2000;
    parent.children.set(name, node);
    parent.mtime = NOW;
    return node;
  }

  /** Removes a name, enforcing directory write permission and the sticky bit. */
  unlink(path: string, cwd: string, who: Creds) {
    const abs = normalize(path, cwd);
    const parent = this.lookup(dirname(abs), "/", who);
    const name = basename(abs);
    const node = parent.children.get(name);
    if (!node) throw new FsError(ENOENT);
    if (!this.can(parent, who, 2) || !this.can(parent, who, 1)) throw new FsError(EACCES);
    if ((parent.mode & 0o1000) !== 0 && who.euid !== 0 && who.euid !== node.uid && who.euid !== parent.uid) {
      throw new FsError(EPERM);
    }
    parent.children.delete(name);
    parent.mtime = NOW;
  }

  /** World-building helpers: these ignore permissions. */
  put(path: string, content: string, opts: { mode?: number; owner?: string; group?: string; program?: string } = {}) {
    const abs = normalize(path, "/");
    this.mkdirp(dirname(abs));
    const node = newNode("file", opts.mode ?? 0o644, 0, 0);
    node.content = content;
    this.applyOwner(node, opts.owner, opts.group);
    if (opts.program) node.program = opts.program;
    this.rawDir(dirname(abs)).children.set(basename(abs), node);
    return node;
  }

  dir(path: string, opts: { mode?: number; owner?: string; group?: string } = {}) {
    const node = this.mkdirp(normalize(path, "/"));
    if (opts.mode !== undefined) node.mode = opts.mode;
    this.applyOwner(node, opts.owner, opts.group);
    return node;
  }

  link(path: string, target: string) {
    const abs = normalize(path, "/");
    this.mkdirp(dirname(abs));
    const node = newNode("link", 0o777, 0, 0);
    node.target = target;
    this.rawDir(dirname(abs)).children.set(basename(abs), node);
  }

  private applyOwner(node: FsNode, owner?: string, group?: string) {
    if (owner) {
      const u = this.user(owner);
      if (!u) throw new Error(`world: no user ${owner}`);
      node.uid = u.uid;
      node.gid = u.gid;
    }
    if (group) {
      const gid = this.groupId(group);
      if (gid === undefined) throw new Error(`world: no group ${group}`);
      node.gid = gid;
    }
  }

  private rawDir(path: string): FsNode {
    let node = this.root;
    for (const part of path.split("/").filter(Boolean)) {
      const next = node.children.get(part);
      if (!next) throw new Error(`world: no dir ${path}`);
      node = next;
    }
    return node;
  }

  private mkdirp(path: string): FsNode {
    let node = this.root;
    for (const part of path.split("/").filter(Boolean)) {
      let next = node.children.get(part);
      if (!next) {
        next = newNode("dir", 0o755, 0, 0);
        node.children.set(part, next);
      }
      node = next;
    }
    return node;
  }
}

/** A running process's identity: the ids the kernel checks. */
export interface Creds {
  uid: number;
  euid: number;
  egid: number;
  gids: number[];
}

export function credsOf(user: User): Creds {
  return { uid: user.uid, euid: user.uid, egid: user.gid, gids: [user.gid, ...user.groups] };
}

export function modeString(node: FsNode): string {
  const kind = node.kind === "dir" ? "d" : node.kind === "link" ? "l" : "-";
  const m = node.mode;
  const triple = (shift: number, special: number, letter: string) => {
    const r = (m >> shift) & 4 ? "r" : "-";
    const w = (m >> shift) & 2 ? "w" : "-";
    const x = (m >> shift) & 1;
    const s = (m & special) !== 0;
    return r + w + (s ? (x ? letter : letter.toUpperCase()) : x ? "x" : "-");
  };
  return kind + triple(6, 0o4000, "s") + triple(3, 0o2000, "s") + triple(0, 0o1000, "t");
}
