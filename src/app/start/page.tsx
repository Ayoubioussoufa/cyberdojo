import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { Pace } from "@/components/Pace";
import { SiteMap } from "@/components/SiteMap";
import { buildPath } from "@/lib/path";

export const metadata: Metadata = { title: "How this site works" };

export default function Page() {
  return (
    <div className="page narrow prose-page tour">
      <header className="page-head">
        <p className="kicker">Start here, 2 minutes</p>
        <h1>How CyberDojo works</h1>
        <p className="lede">This site takes you from zero to a job in cybersecurity. It's big, but you only ever need to look at one thing: your next step.</p>
      </header>

      <section>
        <h2><span className="tour-n">1</span> The one rule</h2>
        <p>Open <Link href="/roadmap/">the Roadmap</Link>, and do the step it marks. When you finish, it moves on. You never need to decide what to study, or look through menus.</p>
        <SiteMap />
      </section>

      <section>
        <h2><span className="tour-n">2</span> What each part is for</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Part</th><th>What it is</th><th>When you use it</th></tr></thead>
            <tbody>
              <tr><td><Link href="/roadmap/">Roadmap</Link></td><td>Every step for 24 months, in order</td><td>Every time you sit down</td></tr>
              <tr><td><Link href="/courses/">Lessons</Link></td><td>Teach one skill, with questions and exercises</td><td>When the Roadmap sends you</td></tr>
              <tr><td><Link href="/practice/">Practice</Link></td><td>Cases, hunts, drills, machines and daily review</td><td>A little, most days</td></tr>
              <tr><td><Link href="/projects/">Projects</Link></td><td>16 real things you build and publish</td><td>When the Roadmap sends you</td></tr>
              <tr><td><Link href="/library/">Library</Link></td><td>The Handbook, cheat sheets, glossary and resources</td><td>When you want to look something up</td></tr>
              <tr><td><Link href="/skills/">Progress</Link></td><td>Your belt, your skills and what you can now do</td><td>Whenever you want to see how far you've come</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2><span className="tour-n">3</span> Lessons or Handbook?</h2>
        <p>People often mix these up, so here's the difference.</p>
        <div className="compare">
          <div className="card">
            <p className="band">Lessons</p>
            <h3>Teach you to do something</h3>
            <p className="muted">"How do Linux permissions work?" You learn it, answer questions, and practise in a terminal. There are 78, in a set order, and each builds on the last.</p>
          </div>
          <div className="card">
            <p className="band">Handbook</p>
            <h3>Advice about the journey</h3>
            <p className="muted">"Which job suits me?" "How do I write a CV?" You read it once, at the right moment. It teaches no technical skills, and the Roadmap brings you to each page when it's useful.</p>
          </div>
        </div>
      </section>

      <section>
        <h2><span className="tour-n">4</span> What a lesson looks like</h2>
        <ol>
          <li><strong>Read.</strong> Everything is explained from scratch. Hover over, or tap, any dotted word to see its meaning.</li>
          <li><strong>Answer.</strong> Each section has a question, and you're told why straight away.</li>
          <li><strong>Do.</strong> Type real commands in the terminal on the page. Finish a mission by typing <code>submit your-answer</code>.</li>
          <li><strong>Get corrected.</strong> One button copies all your answers for your AI tutor.</li>
          <li><strong>Mark it as done.</strong> Your roadmap moves on, and questions come back later in your daily review, just before you'd forget them.</li>
        </ol>
      </section>

      <section>
        <h2><span className="tour-n">5</span> How you'll know you're improving</h2>
        <ul>
          <li><strong>Belts.</strong> You earn a new one each time you finish a stage, from white to black.</li>
          <li><strong>Exit gates.</strong> Each month ends with skills to prove with no notes and no AI. Passing one means that you really can do it.</li>
          <li><strong>A list of what you can now do.</strong> It grows with each lesson, in plain words.</li>
          <li><strong>Less help.</strong> Projects guide you step by step at first. As you improve, they guide you less, so you'll feel yourself needing them less.</li>
        </ul>
      </section>

      <section>
        <h2><span className="tour-n">6</span> Pick your pace</h2>
        <p>Your progress stays in this browser, and nothing is sent anywhere. Save it to a file from <Link href="/skills/">Progress</Link> before you change computer.</p>
        <Pace path={buildPath()} />
      </section>
    </div>
  );
}
