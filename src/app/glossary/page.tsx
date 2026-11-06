import type { Metadata } from "next";
import { GlossaryList } from "@/components/GlossaryList";
import { glossary } from "@/lib/content";

export const metadata: Metadata = { title: "Glossary" };

export default function Page() {
  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="kicker">Glossary</p>
        <h1>Every term, in plain words</h1>
        <p className="lede">The course's shared language. These are the same definitions you see when you hover a dotted word in a lesson.</p>
      </header>
      <GlossaryList terms={glossary()} />
    </div>
  );
}
