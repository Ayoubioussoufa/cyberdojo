"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/courses/", label: "Courses" },
  { href: "/roadmap/", label: "Roadmap" },
  { href: "/guides/", label: "Guides" },
  { href: "/practice/", label: "Practice" },
  { href: "/machines/", label: "Machines" },
  { href: "/review/", label: "Review" },
  { href: "/glossary/", label: "Glossary" },
  { href: "/sheets/", label: "Sheets" },
  { href: "/resources/", label: "Resources" },
];

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

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

  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

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
          CyberDojo
        </Link>
        <nav className={`nav-links${open ? " open" : ""}`} aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={active(l.href) ? "on" : ""} aria-current={active(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-tools">
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
