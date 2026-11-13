/**
 * Turns the standalone server's pnpm-style node_modules into a flat one, with
 * no symbolic links, so the server can be shipped in an installer.
 *
 * Why: pnpm keeps each package once under node_modules/.pnpm and links to it.
 * Copying those links into an installer breaks the app on every system:
 * Node's fs.cpSync rewrites them as absolute paths into the build machine,
 * Windows installers turn them into plain copies (and a copied package can no
 * longer find its own dependencies, which pnpm keeps beside the original),
 * and macOS refuses to sign a bundle with links leading out of it.
 *
 * So the server gets npm's classic layout instead: one version of each
 * package at the top of node_modules, and any other version a package needs
 * nested in that package's own node_modules.
 */
import fs from "node:fs";
import path from "node:path";

interface Pkg {
  name: string;
  version: string;
  dir: string;
  /** Each dependency's name and the real folder pnpm links it to. */
  deps: Map<string, string>;
}

/** Package names in a node_modules folder, scoped ones as "@scope/name". */
function names(nodeModules: string): string[] {
  if (!fs.existsSync(nodeModules)) return [];
  return fs.readdirSync(nodeModules).flatMap((entry) => {
    if (entry.startsWith(".")) return [];
    if (!entry.startsWith("@")) return [entry];
    return fs.readdirSync(path.join(nodeModules, entry)).map((n) => `${entry}/${n}`);
  });
}

/**
 * Where a link leads, worked out from the link's own text. fs.realpathSync would ask the system to follow it,
 * and on Windows the links in Next's standalone output often can't be followed (EPERM): Next creates
 * them without saying they point to folders. Reading the target always works.
 */
export function resolveLink(p: string): string {
  let at = path.resolve(p);
  for (let hops = 0; hops < 40; hops++) {
    let entry: fs.Stats;
    try {
      entry = fs.lstatSync(at);
    } catch {
      return at;
    }
    if (!entry.isSymbolicLink()) return at;
    const target = fs.readlinkSync(at).replace(/^\\\\\?\\/, "");
    at = path.resolve(path.dirname(at), target);
  }
  throw new Error(`flatten: too many links in a row at ${p}`);
}

const versionOf = (dir: string) => (JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")) as { version?: string }).version ?? "0.0.0";

/** Compares "2.1.2" and "2.0.2" numerically, part by part. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(/[.+-]/).map(Number);
  const pb = b.split(/[.+-]/).map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (Number.isNaN(pa[i]) ? 0 : (pa[i] ?? 0)) - (Number.isNaN(pb[i]) ? 0 : (pb[i] ?? 0));
    if (d) return d;
  }
  return 0;
}

/** Every real package in pnpm's store, with where each of its dependencies really lives. */
function readStore(store: string): Pkg[] {
  const out: Pkg[] = [];
  for (const id of fs.readdirSync(store)) {
    if (id === "node_modules") continue;
    const nm = path.join(store, id, "node_modules");
    const here = names(nm);
    for (const name of here) {
      const dir = path.join(nm, name);
      if (fs.lstatSync(dir).isSymbolicLink()) continue;
      const deps = new Map<string, string>();
      for (const dep of here) if (dep !== name) deps.set(dep, resolveLink(path.join(nm, dep)));
      out.push({ name, version: versionOf(dir), dir: path.resolve(dir), deps });
    }
  }
  return out;
}

/** A copy that must contain no links: a real package folder never does under pnpm, and this checks it. */
function copyReal(from: string, to: string) {
  fs.cpSync(from, to, { recursive: true, verbatimSymlinks: true });
}

/**
 * Writes the flat node_modules for the standalone server at `standalone` into `to`.
 * Returns how each pnpm folder maps to its flat copy, for links elsewhere in the build.
 */
export function flattenModules(standalone: string, to: string): Map<string, string> {
  const source = path.join(standalone, "node_modules");
  const packages = readStore(path.join(source, ".pnpm"));
  const byDir = new Map(packages.map((p) => [p.dir, p]));
  // The version at the top: the one the app links to directly, otherwise the newest.
  const top = new Map<string, Pkg>();
  for (const name of names(source)) {
    const p = byDir.get(resolveLink(path.join(source, name)));
    if (p) top.set(p.name, p);
  }
  for (const p of packages) {
    const chosen = top.get(p.name);
    if (!chosen || (!names(source).includes(p.name) && compareVersions(p.version, chosen.version) > 0)) top.set(p.name, p);
  }
  const placed = new Map<string, string>();
  fs.mkdirSync(to, { recursive: true });
  // Each package at `at`, then whatever it needs in another version than the one it would find above it.
  const place = (p: Pkg, at: string, visible: Map<string, string>, depth: number) => {
    copyReal(p.dir, at);
    if (!placed.has(p.dir)) placed.set(p.dir, at);
    if (depth > 8) throw new Error(`flatten: dependencies nested too deep at ${at}`);
    const inside = new Map(visible);
    const nested: Pkg[] = [];
    for (const [dep, dir] of p.deps) {
      if (inside.get(dep) === dir) continue;
      const d = byDir.get(dir);
      if (!d) continue;
      inside.set(dep, dir);
      nested.push(d);
    }
    for (const d of nested) place(d, path.join(at, "node_modules", d.name), inside, depth + 1);
  };
  const visible = new Map([...top.values()].map((p) => [p.name, p.dir]));
  for (const p of top.values()) place(p, path.join(to, p.name), visible, 0);
  return placed;
}

/**
 * Copies a folder of the build, replacing each link into pnpm's store with
 * the flat copy of the package it pointed to (Next aliases external packages
 * as .next-desktop/node_modules/<name>-<hash>).
 */
export function copyResolvingLinks(from: string, to: string, placed: Map<string, string>) {
  const entry = fs.lstatSync(from);
  if (entry.isSymbolicLink()) {
    const real = resolveLink(from);
    const flat = placed.get(real);
    copyReal(flat ?? real, to);
    return;
  }
  if (entry.isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const name of fs.readdirSync(from)) copyResolvingLinks(path.join(from, name), path.join(to, name), placed);
    return;
  }
  fs.copyFileSync(from, to);
  fs.chmodSync(to, entry.mode);
}

/** Every symbolic link under `dir`: the shipped server must have none. */
export function links(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isSymbolicLink()) out.push(p);
      else if (e.isDirectory()) walk(p);
    }
  };
  walk(dir);
  return out;
}
