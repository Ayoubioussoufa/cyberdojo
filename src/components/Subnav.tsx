"use client";

import Link from "@/components/HoverLink";
import { usePathname } from "next/navigation";

const GROUPS = {
  practice: [
    { href: "/practice/", label: "Exercises" },
    { href: "/machines/", label: "Machines" },
    { href: "/review/", label: "Daily review" },
    { href: "/practice/flashcards/", label: "Flashcards" },
  ],
  library: [
    { href: "/library/", label: "All" },
    { href: "/guides/", label: "Handbook" },
    { href: "/sheets/", label: "Cheat sheets" },
    { href: "/glossary/", label: "Glossary" },
    { href: "/resources/", label: "Resources" },
  ],
};

/** Tabs inside Practice and Library. */
export function Subnav({ group }: { group: keyof typeof GROUPS }) {
  const path = usePathname();
  return (
    <nav className="subnav" aria-label={group === "practice" ? "Practice" : "Library"}>
      {GROUPS[group].map((l) => (
        <Link key={l.href} href={l.href} className={path === l.href ? "on" : ""} aria-current={path === l.href ? "page" : undefined}>{l.label}</Link>
      ))}
    </nav>
  );
}
