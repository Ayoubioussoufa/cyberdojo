import type { Metadata } from "next";
import Link from "next/link";
import { Subnav } from "@/components/Subnav";

export const metadata: Metadata = { title: "Library" };

const SHELVES = [
  { href: "/guides/", title: "Handbook", text: "Advice about the journey: jobs, tracks, certifications, your CV, interviews and using AI well. The Roadmap brings you to each page at the right moment." },
  { href: "/sheets/", title: "Cheat sheets", text: "Printable pages for Linux commands, ports, subnetting, Windows events and Sysmon." },
  { href: "/glossary/", title: "Glossary", text: "Every term in the course, in plain words, with a link to where it's taught." },
  { href: "/resources/", title: "Resources", text: "Books, sites, labs and communities, chosen and sorted." },
];

export default function Page() {
  return (
    <div className="page">
      <Subnav group="library" />
      <header className="page-head">
        <p className="kicker">Library</p>
        <h1>Look things up, whenever you need to</h1>
        <p className="lede">Nothing here is required reading. Your Roadmap is what moves you forward, and the Library is here for when you want to check something.</p>
      </header>
      <div className="grid3">
        {SHELVES.map((s) => (
          <Link key={s.href} href={s.href} className="card link-card">
            <h3>{s.title}</h3>
            <p className="muted">{s.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
