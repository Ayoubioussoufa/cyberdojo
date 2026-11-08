import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import TOOL_INDEX from "@/data/toolindex.json";

export const metadata: Metadata = { title: "A to Z of tools" };

interface Entry {
  name: string;
  slug: string;
  href: string;
  has?: boolean;
  from: string;
}

export default function Page() {
  const list = TOOL_INDEX as Entry[];
  const guides = list.filter((t) => t.has).length;
  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Tools</p>
        <h1>A to Z of tools</h1>
        <p className="lede">{list.length} names: Kali Linux's catalogue, the tools ATT&amp;CK records in real intrusions, and every tool with a guide here. {guides} have a guide, shown in bold. The rest link to their Kali or ATT&amp;CK page.</p>
      </header>
      <ul className="tool-az">
        {list.map((t) => (
          <li key={t.slug} id={t.slug}>
            {t.has ? <Link href={t.href}><strong>{t.name}</strong></Link> : <a href={t.href} target="_blank" rel="noreferrer">{t.name}</a>}
          </li>
        ))}
      </ul>
    </div>
  );
}
