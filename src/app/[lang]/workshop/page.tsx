import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { Subnav } from "@/components/Subnav";
import { workshopLabs } from "@/data/workshop";
import { fill } from "@/i18n/lang";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { t } = await strings(params);
  return { title: t.workshop.title, description: t.workshop.description };
}

/** The Workshop hub: real build-attack-defend labs on the learner's own machine. Members and the app. */
export default async function Page({ params }: LangParams) {
  const { lang, t } = await strings(params);
  const labs = workshopLabs(lang);
  return (
    <div className="page workshop-hub">
      <Subnav group="practice" />
      <header className="page-head">
        <p className="kicker">{t.workshop.kicker}</p>
        <h1>{t.workshop.title}</h1>
        <p className="lede">{t.workshop.lede}</p>
      </header>

      <div className="callout law">
        <span className="label">{t.workshop.kicker}</span>
        <p>{t.workshop.law}</p>
      </div>

      <ul className="ws-cards">
        {labs.map((lab) => (
          <li key={lab.id}>
            <Link href={`/workshop/${lab.id}/`} className="ws-card">
              <span className="ws-card-tag">{lab.tag}</span>
              <h2>{lab.title}</h2>
              <p>{lab.tagline}</p>
              <span className="ws-card-meta">{fill(t.workshop.minutes, { n: lab.minutes })} · {lab.needs.join(", ")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
