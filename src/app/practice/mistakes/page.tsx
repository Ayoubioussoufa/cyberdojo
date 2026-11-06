import type { Metadata } from "next";
import Link from "next/link";
import { Mistakes } from "@/components/Mistakes";

export const metadata: Metadata = { title: "Your mistakes" };

export default function Page() {
  return (
    <div className="page narrow">
      <p className="back"><Link href="/practice/">← All practice</Link></p>
      <header className="page-head">
        <p className="kicker">Practice</p>
        <h1>Your mistakes, to retry</h1>
        <p className="lede">Each wrong answer is a gift: it shows you exactly what to learn next. Get one right, and it leaves this list.</p>
      </header>
      <Mistakes />
    </div>
  );
}
