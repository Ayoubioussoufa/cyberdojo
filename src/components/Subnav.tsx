"use client";

import Link from "@/components/HoverLink";
import { usePathname } from "next/navigation";
import { useLang } from "@/i18n/LangProvider";
import { splitLang } from "@/i18n/lang";
import type { Dict } from "@/i18n/ui";

type Tab = { href: string; label: keyof Dict["subnav"] };
const GROUPS: Record<"practice" | "library", Tab[]> = {
  practice: [
    { href: "/practice/", label: "exercises" },
    { href: "/machines/", label: "machines" },
    { href: "/review/", label: "review" },
    { href: "/practice/flashcards/", label: "flashcards" },
    { href: "/practice/labs/", label: "labs" },
  ],
  library: [
    { href: "/library/", label: "all" },
    { href: "/guides/", label: "handbook" },
    { href: "/sheets/", label: "sheets" },
    { href: "/glossary/", label: "glossary" },
    { href: "/resources/", label: "resources" },
  ],
};

/** Tabs inside Practice and Library. */
export function Subnav({ group }: { group: keyof typeof GROUPS }) {
  const path = splitLang(usePathname()).path;
  const { t } = useLang();
  return (
    <nav className="subnav" aria-label={t.subnav[group]}>
      {GROUPS[group].map((l) => (
        <Link key={l.href} href={l.href} className={path === l.href ? "on" : ""} aria-current={path === l.href ? "page" : undefined}>{t.subnav[l.label]}</Link>
      ))}
    </nav>
  );
}
