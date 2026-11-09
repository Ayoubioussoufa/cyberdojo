"use client";

import Link from "@/components/HoverLink";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { signOut, useAccount } from "@/lib/account";
import { sectionsFor, completions, isPath, knownPaths, listing, parse, rank, resolvePath, type Target } from "@/lib/prompt";
import { fill, plural, useLang } from "@/i18n/LangProvider";
import { localize, splitLang, type Lang } from "@/i18n/lang";
import { say, type Dict } from "@/i18n/ui";

interface Hit {
  title: string;
  kind: string;
  href: string;
}

/** The whole course, from the search index. Fetched the first time someone focuses the line. */
let course: Target[] | null = null;
let loading: Promise<void> | null = null;
/** One language per page load: the language switch reloads the page, so this cache never mixes them. */
function loadCourse(lang: Lang, t: Dict): Promise<void> {
  loading ??= fetch(localize("/data/search.json", lang))
    .then((r) => r.json() as Promise<Hit[]>)
    .then((hits) => {
      const kinds = t.kind as Record<string, string>;
      course = hits.map((h) => ({ label: h.title, href: h.href, detail: kinds[h.kind] ?? h.kind, tier: 0 }));
    })
    .catch(() => {
      loading = null;
    });
  return loading;
}

const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** Every link and heading you can see in the page itself, so you can type what you're looking at. Site paths come back without the /fr prefix. */
function onThisPage(t: Dict): Target[] {
  const here = t.prompt.onPage;
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
      out.push({ label, href: url.hash, detail: here, tier: 1 });
    } else {
      const site = splitLang(url.pathname).path;
      out.push({ label, href: site + url.search + url.hash, detail: `~${site}`, tier: 2 });
    }
  }
  for (const h of main.querySelectorAll<HTMLElement>("h2[id], h3[id]")) {
    const label = clean(h.textContent);
    if (label) out.push({ label, href: `#${h.id}`, detail: here, tier: 1 });
  }
  return out;
}

type Out =
  | { kind: "none" }
  | { kind: "list"; items: Target[]; note?: string }
  | { kind: "text"; lines: string[] }
  | { kind: "help" };

const NONE: Out = { kind: "none" };

/** The help rows: what to type, then what it does. The examples to type are the language's own. */
const helpRows = (t: Dict): [string, string][] => {
  const P = t.prompt;
  return [
    [P.h1ex, P.h1],
    [P.h2ex, P.h2],
    ["nmap, kerberos, 0047", P.h3],
    ["cd ..   cd -   cd /tools/all", P.h4],
    ["ls   ls /courses", P.h5],
    ["pwd   whoami   history   clear", P.h6],
    [P.h7ex, P.h7],
    ["Esc   Tab   /", P.h8],
  ];
};

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
  const path = splitLang(usePathname() ?? "/").path;
  const router = useRouter();
  const { lang, t } = useLang();
  const P = t.prompt;
  const sections = sectionsFor(lang);
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

  const everything = () => [...sections, ...onThisPage(t), ...(course ?? [])];
  const known = () => knownPaths(everything(), t.nav.today);

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
      void loadCourse(lang, t).then(() => {
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
    else if (t.href !== path) router.push(localize(t.href, lang));
  };

  const cd = (arg: string) => {
    if (!arg || arg === "~") return go(here("/"));
    if (arg === "-") return prev.current ? go(here(prev.current)) : show([P.noPrev]);
    const paths = known();
    const shown = out.kind === "list" && !out.note ? out.items[sel] : undefined;
    if (isPath(arg)) {
      const to = resolvePath(path, arg);
      // Before the course index arrives, trust the path rather than refuse a real page.
      if (paths.has(to) || !course) return go(here(to));
      return shown ? go(shown) : show([fill(P.noPage, { arg })]);
    }
    const inside = resolvePath(path, arg);
    if (paths.has(inside)) return go(here(inside));
    const top = shown ?? rank(everything(), arg, 1)[0];
    return top ? go(top) : show([fill(P.noPage, { arg })]);
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
        return show([ready && user ? user.username : P.guest]);
      case "history":
        return show(history.current.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`));
      case "sudo":
        return show([fill(P.sudo, { name })]);
      case "clear":
        return reset();
      case "exit":
        reset();
        return input.current?.blur();
      case "logout":
        if (!(ready && user)) return show([P.notIn]);
        show([P.signingOut]);
        void signOut().then((problem) => show([say(lang, problem ?? "Signed out.")]));
        return;
      case "ls": {
        if (cmd.arg) {
          const dir = resolvePath(path, cmd.arg);
          const items = listing(dir, known());
          if (!items.length) return show([fill(P.lsNone, { arg: cmd.arg })]);
          return showList(items, plural(lang, P.lsPages, items.length, { dir: dir === "/" ? "~" : `~${dir}` }));
        }
        const seen = new Set<string>();
        const items = onThisPage(t).filter((x) => !seen.has(x.href) && seen.add(x.href));
        if (!items.length) return show([P.lsEmpty]);
        return showList(items, plural(lang, P.lsLinks, items.length));
      }
      case "cd":
        return cd(cmd.arg);
      case "go": {
        if (!cmd.query) return setOut({ kind: "help" });
        const shown = out.kind === "list" && !out.note ? out.items[sel] : undefined;
        const top = shown ?? rank(everything(), cmd.query, 1)[0];
        if (top) return go(top);
        return show([fill(P.notFound, { q: cmd.query })]);
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
      ? (out.note ?? plural(lang, P.suggestions, out.items.length, { first: out.items[0]?.label ?? "" }))
      : out.kind === "text"
        ? out.lines.join(". ")
        : out.kind === "help"
          ? P.helpOpen
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
          <nav className="prompt-where" aria-label={P.breadcrumb}>
            <span className="prompt-user" aria-hidden="true">{name}@cyberdojo</span>
            <span aria-hidden="true">:</span>
            <span className="prompt-path">
              <Link href="/" aria-label={P.home} aria-current={parts.length ? undefined : "page"}>~</Link>
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
            aria-label={P.label}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && out.items[sel] ? `prompt-opt-${sel}` : undefined}
            placeholder={narrow ? P.short : P.long}
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
            <ul id={listId} role="listbox" aria-label={P.where}>
              {out.items.map((x, i) => (
                <li
                  key={`${x.href}${i}`}
                  id={`prompt-opt-${i}`}
                  role="option"
                  aria-selected={i === sel}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={() => {
                    if (i !== sel) setSel(i);
                    picked.current = true;
                  }}
                  onClick={() => {
                    remember(value.trim() || x.label);
                    go(x);
                  }}
                >
                  <span className="prompt-opt-label">{x.label}</span>
                  <span className="prompt-opt-detail">{x.detail}</span>
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
            <p className="prompt-note">{P.helpTop}</p>
            <dl className="prompt-help">
              {helpRows(t).map(([ex, what]) => (
                <div key={ex}>
                  <dt>{ex}</dt>
                  <dd>{what}</dd>
                </div>
              ))}
            </dl>
            <p className="prompt-note">{P.helpBottom}</p>
          </div>
        )}
        <p className="sr-only" role="status" aria-live="polite">{announce}</p>
      </div>
    </div>
  );
}
