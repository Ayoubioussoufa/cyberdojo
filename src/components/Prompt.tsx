"use client";

import Link from "@/components/HoverLink";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { signOut, useAccount } from "@/lib/account";
import { SECTIONS, completions, isPath, knownPaths, listing, parse, rank, resolvePath, type Target } from "@/lib/prompt";

interface Hit {
  title: string;
  kind: string;
  href: string;
}

/** The whole course, from the search index. Fetched the first time someone focuses the line. */
let course: Target[] | null = null;
let loading: Promise<void> | null = null;
function loadCourse(): Promise<void> {
  loading ??= fetch("/data/search.json")
    .then((r) => r.json() as Promise<Hit[]>)
    .then((hits) => {
      course = hits.map((h) => ({ label: h.title, href: h.href, detail: h.kind, tier: 0 }));
    })
    .catch(() => {
      loading = null;
    });
  return loading;
}

const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** Every link and heading you can see in the page itself, so you can type what you're looking at. */
function onThisPage(): Target[] {
  const main = document.getElementById("main");
  if (!main) return [];
  const out: Target[] = [];
  for (const a of main.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    if (!a.getClientRects().length) continue;
    const label = clean(a.querySelector("h2, h3, h4")?.textContent || a.getAttribute("aria-label") || a.textContent).slice(0, 90);
    if (!label) continue;
    let url: URL;
    try {
      url = new URL(a.href);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    if (url.origin !== location.origin) {
      const host = url.hostname.replace(/^www\./, "");
      out.push({ label, href: url.href, detail: `${host} ↗`, tier: 2 });
    } else if (url.pathname === location.pathname && url.hash) {
      out.push({ label, href: url.hash, detail: "on this page", tier: 1 });
    } else {
      out.push({ label, href: url.pathname + url.search + url.hash, detail: `~${url.pathname}`, tier: 2 });
    }
  }
  for (const h of main.querySelectorAll<HTMLElement>("h2[id], h3[id]")) {
    const label = clean(h.textContent);
    if (label) out.push({ label, href: `#${h.id}`, detail: "on this page", tier: 1 });
  }
  return out;
}

type Out =
  | { kind: "none" }
  | { kind: "list"; items: Target[]; note?: string }
  | { kind: "text"; lines: string[] }
  | { kind: "help" };

const NONE: Out = { kind: "none" };

const HELP: [string, string][] = [
  ["practice, handbook, sign in", "Any part of the site, by its name."],
  ["what you see on the page", "Any link or heading on this page. On Library, handbook opens the Handbook."],
  ["nmap, kerberos, 0047", "Any lesson, module, tool, challenge or term in the course."],
  ["cd ..   cd -   cd /tools/all", "Paths work as in a shell: up a level, back to the last page, anywhere."],
  ["ls   ls /courses", "The links on this page, or the pages inside a folder."],
  ["pwd   whoami   history   clear", "Where you are, who you are, what you typed, a clean line."],
  ["Space   PgDn   PgUp   Home   End", "Scroll the page while the line is empty."],
  ["Esc   Tab   /", "Esc hands the keys to the page, Tab walks through its links, / brings you back."],
];

const here = (to: string): Target => ({ label: to, href: to, detail: "", tier: 3 });

/** A keyboard and a mouse, not a phone: only there does the line take the focus by itself, since on a phone it would open the keyboard on every page. */
const keyboardFirst = () => matchMedia("(hover: hover) and (pointer: fine)").matches;

/**
 * The site's breadcrumb, written as a shell prompt, and a command line you can type in.
 * Each directory in the path is a link back up the tree. Type a page name, anything you
 * can see on the page, or a shell command, then Enter. On a computer the line has the
 * focus on every page, so the whole site works without a mouse; / brings it back.
 */
export function Prompt() {
  const path = usePathname() ?? "/";
  const router = useRouter();
  const { ready, user } = useAccount();
  const parts = path.split("/").filter(Boolean);
  const name = ready && user ? user.username : "guest";

  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const typed = useRef("");
  const [out, setOut] = useState<Out>(NONE);
  const [sel, setSel] = useState(0);
  const picked = useRef(false);
  const [focused, setFocused] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const history = useRef<string[]>([]);
  const histAt = useRef<number | null>(null);
  const last = useRef(path);
  const prev = useRef<string | null>(null);

  const everything = () => [...SECTIONS, ...onThisPage(), ...(course ?? [])];
  const known = () => knownPaths(everything());

  /** The live list under the line while you type. */
  const suggest = (v: string): Out => {
    const cmd = parse(v);
    let items: Target[] = [];
    if (cmd.name === "go") items = rank(everything(), cmd.query);
    else if (cmd.name === "cd" && cmd.arg && cmd.arg !== "-") {
      items = isPath(cmd.arg) ? completions(path, cmd.arg, known()) : rank(everything(), cmd.arg);
    }
    return items.length ? { kind: "list", items } : NONE;
  };

  const setLine = (v: string) => {
    setValue(v);
    typed.current = v;
  };

  const change = (v: string, fromHistory = false) => {
    // The course index loads on the first keystroke, not on focus: the line is focused on every page.
    if (!course) {
      void loadCourse().then(() => {
        if (typed.current.trim()) setOut(suggest(typed.current));
      });
    }
    setLine(v);
    if (!fromHistory) histAt.current = null;
    setOut(v.trim() ? suggest(v) : NONE);
    setSel(0);
    picked.current = false;
  };

  const reset = () => {
    setLine("");
    setOut(NONE);
    setSel(0);
    picked.current = false;
    histAt.current = null;
  };

  const remember = (line: string) => {
    const h = history.current;
    if (line && h[h.length - 1] !== line) h.push(line);
    if (h.length > 50) h.shift();
  };

  const show = (lines: string[]) => {
    setLine("");
    setOut({ kind: "text", lines });
  };

  const showList = (items: Target[], note: string) => {
    setLine("");
    setSel(0);
    picked.current = false;
    setOut({ kind: "list", items, note });
  };

  /** Leave for the target. On a computer the line keeps the focus; on a phone it lets go, so the keyboard closes. */
  const go = (t: Target) => {
    reset();
    if (!keyboardFirst()) input.current?.blur();
    if (/^https?:/.test(t.href)) window.open(t.href, "_blank", "noopener,noreferrer");
    else if (t.href.startsWith("#")) location.hash = t.href;
    else if (t.href !== path) router.push(t.href);
  };

  const cd = (arg: string) => {
    if (!arg || arg === "~") return go(here("/"));
    if (arg === "-") return prev.current ? go(here(prev.current)) : show(["cd: no previous page yet"]);
    const paths = known();
    const shown = out.kind === "list" && !out.note ? out.items[sel] : undefined;
    if (isPath(arg)) {
      const to = resolvePath(path, arg);
      // Before the course index arrives, trust the path rather than refuse a real page.
      if (paths.has(to) || !course) return go(here(to));
      return shown ? go(shown) : show([`cd: ${arg}: no such page`]);
    }
    const inside = resolvePath(path, arg);
    if (paths.has(inside)) return go(here(inside));
    const top = shown ?? rank(everything(), arg, 1)[0];
    return top ? go(top) : show([`cd: ${arg}: no such page`]);
  };

  const submit = () => {
    const line = value.trim();
    if (out.kind === "list" && picked.current && out.items[sel]) {
      remember(line || out.items[sel].label);
      return go(out.items[sel]);
    }
    if (!line) return setOut(NONE);
    remember(line);
    const cmd = parse(line);
    switch (cmd.name) {
      case "help":
        setLine("");
        return setOut({ kind: "help" });
      case "pwd":
        return show([path === "/" ? "~" : `~${path.replace(/\/$/, "")}`]);
      case "whoami":
        return show([ready && user ? user.username : "guest: you're not signed in. Type sign in to keep your progress on any device."]);
      case "history":
        return show(history.current.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`));
      case "sudo":
        return show([`${name} is not in the sudoers file. This incident will be reported.`]);
      case "clear":
        return reset();
      case "exit":
        reset();
        return input.current?.blur();
      case "logout":
        if (!(ready && user)) return show(["logout: you're not signed in."]);
        show(["Signing out…"]);
        void signOut().then((problem) => show([problem ?? "Signed out."]));
        return;
      case "ls": {
        if (cmd.arg) {
          const dir = resolvePath(path, cmd.arg);
          const items = listing(dir, known());
          if (!items.length) return show([`ls: ${cmd.arg}: nothing inside, or no such folder`]);
          return showList(items, `${items.length} page${items.length === 1 ? "" : "s"} in ${dir === "/" ? "~" : `~${dir}`}. ↑ ↓ to choose, Enter to open.`);
        }
        const seen = new Set<string>();
        const items = onThisPage().filter((t) => !seen.has(t.href) && seen.add(t.href));
        if (!items.length) return show(["ls: no links on this page"]);
        return showList(items, `${items.length} link${items.length === 1 ? "" : "s"} on this page. ↑ ↓ to choose, Enter to open.`);
      }
      case "cd":
        return cd(cmd.arg);
      case "go": {
        if (!cmd.query) return setOut({ kind: "help" });
        const shown = out.kind === "list" && !out.note ? out.items[sel] : undefined;
        const top = shown ?? rank(everything(), cmd.query, 1)[0];
        if (top) return go(top);
        return show([`${cmd.query}: not found here or anywhere in the course. Type help to see what works.`]);
      }
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const items = out.kind === "list" ? out.items : [];
    // The line holds the focus on every page, so it scrolls the page too, with the keys a browser uses.
    if (e.key === "PageDown" || e.key === "PageUp" || (!value && (e.key === " " || e.key === "Home" || e.key === "End"))) {
      e.preventDefault();
      const page = Math.max(120, innerHeight - 160);
      if (e.key === "Home") scrollTo({ top: 0 });
      else if (e.key === "End") scrollTo({ top: document.documentElement.scrollHeight });
      else scrollBy({ top: e.key === "PageUp" || (e.key === " " && e.shiftKey) ? -page : page });
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const up = e.key === "ArrowUp";
      if (items.length && histAt.current === null) {
        e.preventDefault();
        picked.current = true;
        setSel((n) => (n + (up ? -1 : 1) + items.length) % items.length);
        return;
      }
      // No list open: walk back through what you typed, as a shell does.
      const h = history.current;
      if (!h.length) return;
      e.preventDefault();
      const from = histAt.current ?? h.length;
      const at = up ? Math.max(0, from - 1) : from + 1;
      if (at >= h.length) change("");
      else {
        histAt.current = at;
        change(h[at] ?? "", true);
      }
    } else if (e.key === "Tab" && !e.shiftKey && items[sel]) {
      // Complete to the chosen suggestion. When that adds nothing, Tab moves focus on as usual.
      const cmd = parse(value);
      const t = items[sel];
      const next = cmd.name === "cd" ? `cd ${isPath(cmd.arg) ? t.href : t.label}` : t.label;
      if (next !== value) {
        e.preventDefault();
        change(next);
      }
    } else if (e.key === "Escape") {
      if (out.kind !== "none") setOut(NONE);
      else if (value) reset();
      else input.current?.blur();
    }
  };

  // A new page, or a reload: clear the line, remember where we came from (for "cd -"), and take the focus.
  useEffect(() => {
    if (last.current !== path) {
      prev.current = last.current;
      last.current = path;
    }
    reset();
    if (!keyboardFirst()) return;
    // One frame later, so a page that focuses its own field first keeps it.
    const id = requestAnimationFrame(() => {
      const a = document.activeElement;
      if (a && a !== document.body && document.getElementById("main")?.contains(a)) return;
      input.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  // Keep the chosen suggestion in view while arrowing through a long list.
  useEffect(() => {
    document.getElementById(`prompt-opt-${sel}`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  // "/" from anywhere that isn't already a text box, as on GitHub and YouTube.
  useEffect(() => {
    const key = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector("dialog[open]")) return;
      e.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  useEffect(() => {
    const mq = matchMedia("(max-width: 560px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const onFocus = () => setFocused(true);

  const listId = "prompt-list";
  const open = out.kind === "list";
  const announce =
    out.kind === "list"
      ? (out.note ?? `${out.items.length} suggestion${out.items.length === 1 ? "" : "s"}, ${out.items[0]?.label} first`)
      : out.kind === "text"
        ? out.lines.join(". ")
        : out.kind === "help"
          ? "Help is open under the command line."
          : "";

  return (
    <div className="prompt">
      <div
        className="prompt-in"
        onBlur={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          setFocused(false);
          setOut(NONE);
        }}
      >
        <form
          className="prompt-line"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest("a, input")) input.current?.focus();
          }}
        >
          <nav className="prompt-where" aria-label="Breadcrumb">
            <span className="prompt-user" aria-hidden="true">{name}@cyberdojo</span>
            <span aria-hidden="true">:</span>
            <span className="prompt-path">
              <Link href="/" aria-label="Home" aria-current={parts.length ? undefined : "page"}>~</Link>
              {parts.map((p, i) => (
                <span key={i}>
                  <span aria-hidden="true">/</span>
                  <Link href={`/${parts.slice(0, i + 1).join("/")}/`} aria-current={i === parts.length - 1 ? "page" : undefined}>{p}</Link>
                </span>
              ))}
            </span>
            <span aria-hidden="true">$</span>
          </nav>
          {!focused && !value && <span className="prompt-cursor" aria-hidden="true" />}
          <input
            ref={input}
            className="prompt-input"
            value={value}
            onChange={(e) => change(e.target.value)}
            onKeyDown={onKey}
            onFocus={onFocus}
            role="combobox"
            aria-label="Command line. Type a page, a link on this page, or help, then press Enter."
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && out.items[sel] ? `prompt-opt-${sel}` : undefined}
            placeholder={narrow ? "type help" : "type where to go, or help"}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
          />
        </form>
        {out.kind === "list" && (
          <div className="prompt-out" onMouseDown={(e) => e.preventDefault()}>
            {out.note && <p className="prompt-note">{out.note}</p>}
            <ul id={listId} role="listbox" aria-label="Where to go">
              {out.items.map((t, i) => (
                <li
                  key={`${t.href}${i}`}
                  id={`prompt-opt-${i}`}
                  role="option"
                  aria-selected={i === sel}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={() => {
                    if (i !== sel) setSel(i);
                    picked.current = true;
                  }}
                  onClick={() => {
                    remember(value.trim() || t.label);
                    go(t);
                  }}
                >
                  <span className="prompt-opt-label">{t.label}</span>
                  <span className="prompt-opt-detail">{t.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {out.kind === "text" && (
          <div className="prompt-out" onMouseDown={(e) => e.preventDefault()}>
            <pre className="prompt-text">{out.lines.join("\n")}</pre>
          </div>
        )}
        {out.kind === "help" && (
          <div className="prompt-out" onMouseDown={(e) => e.preventDefault()}>
            <p className="prompt-note">Type where you want to go, then press Enter.</p>
            <dl className="prompt-help">
              {HELP.map(([ex, what]) => (
                <div key={ex}>
                  <dt>{ex}</dt>
                  <dd>{what}</dd>
                </div>
              ))}
            </dl>
            <p className="prompt-note">Tab completes, ↑ ↓ choose, Esc closes. Press / on any page to come back here.</p>
          </div>
        )}
        <p className="sr-only" role="status" aria-live="polite">{announce}</p>
      </div>
    </div>
  );
}
