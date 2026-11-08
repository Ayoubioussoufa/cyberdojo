import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { DOMAINS } from "@/data/domains";
import { AD_DEFENCE, ELSEWHERE, type TrainLink } from "@/data/train";
import { lessons, modules } from "@/lib/content";

export const metadata: Metadata = { title: "Modules" };

const LEVELS = ["foundation", "intermediate", "advanced"];

const Out = ({ links }: { links: TrainLink[] }) => (
  <ul className="train-links">
    {links.map((l) => (
      <li key={l.url}>
        <a href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
      </li>
    ))}
  </ul>
);

export default function Page() {
  const all = modules();
  const titles = new Map(lessons().map((d) => [d.meta.number, d]));
  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Modules</p>
        <h1>The whole field, attack and defence</h1>
        <p className="lede">The Roadmap makes you a junior defender. Modules take each topic further, up to Master's level: why an attack is possible, what it leaves behind, how to stop it, and a lab to prove it. Use them in any order, once you've met what they list under "Read first".</p>
      </header>
      {DOMAINS.map((d) => {
        const mine = all.filter((m) => m.meta.domain === d.id).sort((a, b) => LEVELS.indexOf(a.meta.level ?? "") - LEVELS.indexOf(b.meta.level ?? ""));
        return (
          <section key={d.id} id={`domain-${d.id}`} className="module-domain">
            <h2>{d.id}. {d.title}</h2>
            <p className="muted">{d.blurb}</p>
            {d.lessons.length > 0 && (
              <p className="muted">
                Basics on the Roadmap:{" "}
                {d.lessons.flatMap((n, i) => {
                  const l = titles.get(n);
                  return l ? [<span key={n}>{i ? ", " : ""}<Link href={`/courses/${l.meta.slug}/`}>{l.meta.title}</Link></span>] : [];
                })}
              </p>
            )}
            <ul className="module-list">
              {mine.map((m) => (
                <li key={m.meta.slug}>
                  <Link href={`/modules/${m.meta.slug}/`}>{m.meta.title}</Link>
                  <span className="module-level">{m.meta.level}</span>
                  <span className="muted">{m.meta.summary}</span>
                </li>
              ))}
              {ELSEWHERE.filter((e) => e.domain === d.id).map((e) => (
                <li key={e.title} className="module-elsewhere">
                  <strong>{e.title}</strong>
                  <span className="module-level">taught elsewhere</span>
                  <span className="muted">
                    {e.summary} No module here: learn the attack on a legal platform below. The concepts are in{" "}
                    {e.lessons.flatMap((s, i) => {
                      const l = lessons().find((x) => x.meta.slug === s);
                      return l ? [<span key={s}>{i ? ", " : ""}<Link href={`/courses/${s}/`}>{l.meta.title}</Link></span>] : [];
                    })}
                    .
                  </span>
                  <Out links={e.links} />
                </li>
              ))}
              {ELSEWHERE.some((e) => e.domain === d.id) && (
                <li className="module-elsewhere">
                  <strong>Defending against them</strong>
                  <span className="muted">The defender's counterpart to the AD topics above.</span>
                  <Out links={AD_DEFENCE} />
                </li>
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
