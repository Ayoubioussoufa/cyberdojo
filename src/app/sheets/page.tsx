import type { Metadata } from "next";
import { Subnav } from "@/components/Subnav";
import Link from "@/components/HoverLink";
import { sheets } from "@/lib/content";

export const metadata: Metadata = { title: "Cheat sheets" };

const ORDER = ["linux-commands", "ports", "subnetting", "windows-events", "sysmon-ids"];

export default function Page() {
  const docs = ORDER.flatMap((s) => sheets().filter((d) => d.meta.slug === s));
  return (
    <div className="page">
      <Subnav group="library" />
      <header className="page-head">
        <p className="kicker">Cheat sheets</p>
        <h1>Keep these next to you</h1>
        <p className="lede">Short reference pages, made to be printed. Open one and press Print: it loses the menus and the dark colours, and fits onto A4.</p>
      </header>
      <div className="grid3">
        {docs.map((d) => (
          <Link key={d.meta.slug} href={`/sheets/${d.meta.slug}/`} className="card link-card">
            <span className="phase-n">Printable</span>
            <h3>{d.meta.title}</h3>
            <p className="muted">{d.meta.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
