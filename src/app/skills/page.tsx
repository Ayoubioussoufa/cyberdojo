import type { Metadata } from "next";
import { ProgressBoard } from "@/components/Progress";
import { SkillMatrix, YourData } from "@/components/Skills";
import { buildPath } from "@/lib/path";

export const metadata: Metadata = { title: "Your progress" };

export default function Page() {
  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="kicker">Progress</p>
        <h1>See how far you've come</h1>
        <p className="lede">Your belt, what you've practised, and everything you can now do.</p>
      </header>
      <ProgressBoard path={buildPath()} />
      <h2 className="section-title">Score yourself honestly</h2>
      <p className="muted">At Months 6, 12, 18 and 24, rate each skill from 0 to 4: none, aware, working, proficient, advanced. T means that your chosen track reaches 3–4 by Month 24.</p>
      <div className="callout key">
        <span className="label">How to score</span>
        <ul>
          <li>Score only what you can demonstrate today with no notes and no AI, not what you've read about.</li>
          <li>Every level 3 claim needs an artifact: a report, a repo, a recorded walkthrough or a lab you can rebuild.</li>
          <li>Ask one peer or mentor to challenge two of your scores. Overconfidence is normal, and the gap is information.</li>
        </ul>
      </div>
      <SkillMatrix />
      <YourData />
    </div>
  );
}
