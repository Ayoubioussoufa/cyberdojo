"use client";

import Link from "@/components/HoverLink";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "./Search";
import { useAccount } from "@/lib/account";
import { useLang } from "@/i18n/LangProvider";
import { LANG_COOKIE, splitLang, switchTo } from "@/i18n/lang";
import type { Dict } from "@/i18n/ui";
import { DESKTOP } from "@/lib/desktop";
import { TutorChip } from "./tutor/TutorChip";

const LINKS: { href: string; label: keyof Dict["nav"]; also: string[] }[] = [
  { href: "/", label: "today", also: [] },
  { href: "/roadmap/", label: "roadmap", also: ["/start/"] },
  { href: "/courses/", label: "lessons", also: [] },
  { href: "/modules/", label: "modules", also: [] },
  { href: "/tools/", label: "tools", also: [] },
  { href: "/dojo/", label: "dojo", also: [] },
  { href: "/practice/", label: "practice", also: ["/machines/", "/review/", "/break-in/"] },
  { href: "/projects/", label: "projects", also: [] },
  { href: "/library/", label: "library", also: ["/guides/", "/sheets/", "/glossary/", "/resources/"] },
  { href: "/skills/", label: "progress", also: [] },
];

/** The same page in the other language. The cookie makes English addresses open in that language too. */
function LangSwitch() {
  const { lang, t } = useLang();
  const other = lang === "fr" ? "en" : "fr";
  const go = () => {
    document.cookie = `${LANG_COOKIE}=${other}; path=/; max-age=31536000; samesite=lax`;
    const { pathname, search, hash } = window.location;
    window.location.assign(`${switchTo(pathname, other)}${search}${hash}`);
  };
  return (
    <button type="button" className="icon-btn lang-btn" onClick={go} lang={other} aria-label={t.nav.otherLangLabel} title={t.nav.otherLangLabel}>
      {t.nav.otherLang}
    </button>
  );
}

export function Nav() {
  const path = splitLang(usePathname()).path;
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const { ready, user } = useAccount();

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);
  useEffect(() => setOpen(false), [path]);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // The choice just won't be remembered.
    }
  };

  const active = (l: (typeof LINKS)[number]) => (l.href === "/" ? path === "/" : [l.href, ...l.also].some((h) => path.startsWith(h)));

  return (
    <header className="nav">
      <div className="nav-in">
        <Link href="/" className="brand" aria-label={t.nav.home}>
          <span className="brand-word">cyberdojo</span>
          <span className="brand-mark" aria-hidden="true" />
        </Link>
        <nav className={`nav-links${open ? " open" : ""}`} aria-label={t.nav.main}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={active(l) ? "on" : ""} aria-current={active(l) ? "page" : undefined}>
              {t.nav[l.label]}
            </Link>
          ))}
        </nav>
        <div className="nav-tools">
          <Search />
          {DESKTOP
            ? <TutorChip active={path.startsWith("/tutor/")} />
            : ready && (user
              ? <Link href="/account/" className="nav-user" title={t.nav.account}>{user.username}</Link>
              : <Link href="/signin/" className="nav-signin">{t.nav.signIn}</Link>)}
          <button type="button" className="icon-btn" onClick={toggle} aria-label={dark ? t.nav.light : t.nav.dark}>
            {dark ? "☀" : "☾"}
          </button>
          <LangSwitch />
          <button type="button" className="icon-btn menu" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={t.nav.menu}>
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
