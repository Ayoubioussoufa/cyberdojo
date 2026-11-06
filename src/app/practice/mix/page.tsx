import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { Mix } from "@/components/Mix";
import { buildPath } from "@/lib/path";

export const metadata: Metadata = { title: "Today's mix" };

export default function Page() {
  return (
    <div className="page narrow">
      <p className="back"><Link href="/practice/">← All practice</Link></p>
      <header className="page-head">
        <p className="kicker">Practice</p>
        <h1>Today's mix</h1>
      </header>
      <section className="drill"><Mix path={buildPath()} /></section>
    </div>
  );
}
