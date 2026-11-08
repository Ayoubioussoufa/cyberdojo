"use client";

import Link from "@/components/HoverLink";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "./Search";
import { useAccount } from "@/lib/account";

const LINKS = [
  { href: "/", label: "Today", also: [] as string[] },
  { href: "/roadmap/", label: "Roadmap", also: ["/start/"] },
  { href: "/courses/", label: "Lessons", also: [] },
  { href: "/modules/", label: "Modules", also: [] },
  { href: "/tools/", label: "Tools", also: [] },
  { href: "/dojo/", label: "Dojo", also: [] },
  { href: "/practice/", label: "Practice", also: ["/machines/", "/review/"] },
  { href: "/projects/", label: "Projects", also: [] },
  { href: "/library/", label: "Library", also: ["/guides/", "/sheets/", "/glossary/", "/resources/"] },
  { href: "/skills/", label: "Progress", also: [] },
];

export function Nav() {
  const path = usePathname();
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
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M12 2.5 4 5.6v6.1c0 4.8 3.3 8.3 8 9.8 4.7-1.5 8-5 8-9.8V5.6L12 2.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="m8.6 12 2.4 2.4 4.4-4.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="brand-word">CyberDojo</span>
        </Link>
        <nav className={`nav-links${open ? " open" : ""}`} aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={active(l) ? "on" : ""} aria-current={active(l) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-tools">
          <Search />
          {ready && (user
            ? <Link href="/account/" className="nav-user" title="Your account">{user.username}</Link>
            : <Link href="/signin/" className="nav-signin">Sign in</Link>)}
          <button type="button" className="icon-btn" onClick={toggle} aria-label={dark ? "Use light theme" : "Use dark theme"}>
            {dark ? "☀" : "☾"}
          </button>
          <button type="button" className="icon-btn menu" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
