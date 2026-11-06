import type { Metadata } from "next";
import { Subnav } from "@/components/Subnav";
import { GlossaryList } from "@/components/GlossaryList";

export const metadata: Metadata = { title: "Glossary" };

export default function Page() {
  return (
    <div className="page narrow">
      <Subnav group="library" />
      <header className="page-head">
        <p className="kicker">Glossary</p>
        <h1>Every term, in plain words</h1>
        <p className="lede">The course's shared language. These are the same definitions you see when you hover a dotted word in a lesson.</p>
      </header>
      <GlossaryList />
    </div>
  );
}
