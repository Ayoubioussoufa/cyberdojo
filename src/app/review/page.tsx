import type { Metadata } from "next";
import { Subnav } from "@/components/Subnav";
import { Review } from "@/components/Review";

export const metadata: Metadata = { title: "Review" };

export default function Page() {
  return (
    <div className="page narrow">
      <Subnav group="practice" />
      <header className="page-head">
        <p className="kicker">Spaced review</p>
        <h1>Bring it back before you forget</h1>
        <p className="lede">Reading feels like learning. Remembering is learning. Ten minutes here each day is worth more than an hour of rereading.</p>
      </header>
      <Review />
    </div>
  );
}
