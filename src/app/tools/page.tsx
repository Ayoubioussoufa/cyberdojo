import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { ToolHub } from "@/components/ToolHub";
import { TOOL_CATS } from "@/data/toolcats";
import { toolDocs } from "@/lib/content";

export const metadata: Metadata = { title: "Tools" };

export default function Page() {
  const tools = toolDocs().map((d) => ({ slug: d.meta.slug, title: d.meta.title, summary: d.meta.summary, cat: d.meta.category ?? "", side: d.meta.side ?? "both", aka: d.meta.aka ?? [] }));
  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Tools</p>
        <h1>Every tool, and how it really works</h1>
        <p className="lede">What each tool does, how it works underneath, how to run it safely, and what it looks like to a defender. Looking for a name that isn't here? Try the <Link href="/tools/all/">A to Z of tools</Link>.</p>
      </header>
      <ToolHub tools={tools} cats={TOOL_CATS} />
    </div>
  );
}
