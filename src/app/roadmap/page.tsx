import type { Metadata } from "next";
import Link from "next/link";
import { PathView } from "@/components/PathView";
import { buildPath } from "@/lib/path";

export const metadata: Metadata = { title: "Your roadmap" };

export default function Page() {
  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="kicker">Roadmap</p>
        <h1>Your whole path, one step at a time</h1>
        <p className="lede">Every lesson, project and exit gate for 24 months, in the right order. You never have to work out what to do next: do the step marked below, and the roadmap moves on by itself.</p>
        <p className="page-links"><Link href="/start/">How this site works</Link><Link href="/guides/a2-how-to-use-this-plan/">How to run a month</Link></p>
      </header>
      <PathView path={buildPath()} />
    </div>
  );
}
