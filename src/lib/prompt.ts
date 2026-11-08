/**
 * The command line under the header. It reads what you type the way a shell
 * would ("cd ..", "ls", "pwd") and also the way a person would ("handbook",
 * "sign in", "nmap"). Nothing here touches the page, so it can be tested.
 */

export interface Target {
  /** What the place is called, as shown in the list. */
  label: string;
  /** A path on this site, "#id" for a heading on this page, or a full URL for another site. */
  href: string;
  /** Shown on the right: where it goes, or what kind of thing it is. */
  detail: string;
  /** Other names it answers to. */
  names?: string[];
  /** Breaks ties between equally good matches: 3 a section of the site, 2 a link on this page, 1 a heading on this page, 0 anywhere else in the course. */
  tier: number;
}

const section = (label: string, href: string, ...names: string[]): Target => ({ label, href, detail: href === "/" ? "~" : `~${href}`, names, tier: 3 });

/** Every part of the site, by the names people use for it. */
export const SECTIONS: Target[] = [
  section("Today", "/", "home"),
  section("Roadmap", "/roadmap/", "plan"),
  section("How this site works", "/start/", "start", "start here"),
  section("Lessons", "/courses/", "courses", "course"),
  section("Modules", "/modules/"),
  section("Tools", "/tools/"),
  section("Tools from A to Z", "/tools/all/", "all tools", "a to z"),
  section("Dojo", "/dojo/", "challenges", "ctf"),
  section("Practice", "/practice/", "exercises", "drills"),
  section("Daily review", "/review/", "review"),
  section("Flashcards", "/practice/flashcards/", "cards"),
  section("Your mistakes", "/practice/mistakes/", "mistakes"),
  section("Today's mix", "/practice/mix/", "mix"),
  section("Case files", "/practice/cases/", "cases"),
  section("Machines", "/machines/", "boxes"),
  section("Projects", "/projects/"),
  section("Library", "/library/"),
  section("Handbook", "/guides/", "guides"),
  section("Cheat sheets", "/sheets/", "sheets"),
  section("Glossary", "/glossary/", "terms"),
  section("Resources", "/resources/"),
  section("Your progress", "/skills/", "progress", "skills"),
  section("Sign in", "/signin/", "signin", "login", "log in", "sign up", "register"),
  section("Account", "/account/", "profile"),
];

/** Lowercase, no accents or punctuation: "Cheat-sheets " and "cheat sheets" are the same. */
export const norm = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim();

/** How well one name fits what was typed, from 0 (not at all) to 100 (exactly). Both are already normalised. */
export function quality(name: string, q: string): number {
  if (!name || !q) return 0;
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  if (name.includes(` ${q}`)) return 60;
  const words = name.split(" ");
  if (q.split(" ").every((w) => words.some((x) => x.startsWith(w)))) return 40;
  if (q.length >= 3 && name.includes(q)) return 30;
  return 0;
}

/** The part of an href that names it: "0047-keeping-input-out-of-the-code", "nmap", or a host name. */
function slugOf(href: string): string {
  if (/^https?:/.test(href)) {
    try {
      return new URL(href).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }
  const hash = href.indexOf("#");
  if (hash >= 0 && hash < href.length - 1) return href.slice(hash + 1);
  return href.replace(/[?#].*$/, "").split("/").filter(Boolean).pop() ?? "";
}

/** The best matches for what was typed, one per destination, best first. */
export function rank(targets: Target[], query: string, limit = 8): Target[] {
  const q = norm(query);
  if (!q) return [];
  const best = new Map<string, { t: Target; s: number }>();
  for (const t of targets) {
    let s = 0;
    for (const n of [t.label, ...(t.names ?? []), slugOf(t.href)]) s = Math.max(s, quality(norm(n), q));
    if (!s) continue;
    s = s * 10 + t.tier;
    const had = best.get(t.href);
    if (!had || s > had.s) best.set(t.href, { t, s });
  }
  return [...best.values()]
    .sort((a, b) => b.s - a.s || a.t.label.length - b.t.label.length)
    .slice(0, limit)
    .map((x) => x.t);
}

/** True when an argument to cd is a path rather than a name: "..", "~/tools", "/practice/mix", "cases/". */
export const isPath = (arg: string) => arg.includes("/") || /^(\.{1,2}|~)$/.test(arg);

/** True when a whole line, with no command, can only be a path. "TCP/IP" is a name; "/tools" and "../" are paths. */
const onlyPath = (line: string) => /^(\/|~|\.\.?(\/|$))/.test(line);

/** A shell path, read from the page you're on. Always ends in a slash, like every page on this site. */
export function resolvePath(cwd: string, arg: string): string {
  const parts = arg.startsWith("/") || arg.startsWith("~") ? [] : cwd.split("/").filter(Boolean);
  for (const seg of arg.replace(/^~/, "").split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.length ? `/${parts.join("/")}/` : "/";
}

/** Every page path the line knows, with its title when one is known. Parents are included, so "cd .." always works. */
export function knownPaths(targets: Target[]): Map<string, string> {
  const known = new Map<string, string>([["/", "Today"]]);
  for (const t of [...targets].sort((a, b) => b.tier - a.tier)) {
    if (!t.href.startsWith("/")) continue;
    const path = t.href.replace(/[?#].*$/, "");
    if (!path.endsWith("/")) continue;
    if (!known.get(path) && !t.href.includes("#")) known.set(path, t.label);
    const parts = path.split("/").filter(Boolean);
    for (let i = 1; i < parts.length; i++) {
      const up = `/${parts.slice(0, i).join("/")}/`;
      if (!known.has(up)) known.set(up, "");
    }
  }
  return known;
}

/** The pages one level inside a directory. */
export function childrenOf(dir: string, known: Map<string, string>): string[] {
  return [...known.keys()].filter((p) => p !== dir && p.startsWith(dir) && p.slice(dir.length).split("/").filter(Boolean).length === 1).sort();
}

const asTarget = (known: Map<string, string>) => (p: string): Target => ({ label: p === "/" ? "~" : `~${p}`, href: p, detail: known.get(p) ?? "", tier: 3 });

/** The paths you could mean while typing one: "/pra" offers /practice/, "../" offers the parent and what's in it. */
export function completions(cwd: string, arg: string, known: Map<string, string>, limit = 8): Target[] {
  if (/(^|\/)\.{1,2}$|^~$|\/$/.test(arg)) {
    const dir = resolvePath(cwd, arg);
    return [dir, ...childrenOf(dir, known)].slice(0, limit).map(asTarget(known));
  }
  const cut = arg.lastIndexOf("/");
  const dir = resolvePath(cwd, arg.slice(0, cut + 1));
  const stem = arg.slice(cut + 1).toLowerCase();
  return childrenOf(dir, known)
    .filter((p) => p.slice(dir.length).toLowerCase().startsWith(stem))
    .slice(0, limit)
    .map(asTarget(known));
}

/** Pages one level inside a directory, for "ls /courses". */
export const listing = (dir: string, known: Map<string, string>): Target[] => childrenOf(dir, known).map(asTarget(known));

export type Command =
  | { name: "help" | "pwd" | "whoami" | "clear" | "exit" | "logout" | "history" | "sudo" }
  | { name: "ls"; arg: string }
  | { name: "cd"; arg: string }
  | { name: "go"; query: string };

const BARE = new Set(["pwd", "whoami", "clear", "exit", "logout", "history"]);

/** What a line asks for. Anything that isn't a command is a name to go to. */
export function parse(input: string): Command {
  const line = input.trim().replace(/\s+/g, " ");
  const space = line.indexOf(" ");
  const word = (space < 0 ? line : line.slice(0, space)).toLowerCase();
  const arg = space < 0 ? "" : line.slice(space + 1);
  if (!arg && (word === "help" || word === "man" || word === "?")) return { name: "help" };
  if (!arg && BARE.has(word)) return { name: word as "pwd" };
  if (word === "sudo") return { name: "sudo" };
  if (word === "ls" || word === "ll" || word === "dir") return { name: "ls", arg };
  if (word === "cd" || word === "open") return { name: "cd", arg };
  if (word === "man" || word === "find" || word === "search") return { name: "go", query: arg };
  if (onlyPath(line)) return { name: "cd", arg: line };
  return { name: "go", query: line };
}
