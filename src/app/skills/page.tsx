import type { Metadata } from "next";
import { SkillMatrix, YourData } from "@/components/Skills";

export const metadata: Metadata = { title: "Skill matrix" };

export default function Page() {
  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="kicker">Skills</p>
        <h1>Score yourself honestly</h1>
        <p className="lede">Levels run from 0 to 4: none, aware, working, proficient, advanced. T means your chosen track reaches 3–4 by Month 24. Re-score at Months 6, 12, 18 and 24.</p>
      </header>
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
