import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { DocRows } from "@/components/Lists";
import { lessonMetas } from "@/lib/content";
import { phaseOf } from "@/lib/data";
import { monthsFor, phasesFor } from "@/data/fr/months";
import { fill } from "@/i18n/lang";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.nav.lessons };
}

export default async function Page({ params }: LangParams) {
  const { lang, t } = await strings(params);
  const metas = lessonMetas(lang);
  const months = monthsFor(lang);
  const total = metas.reduce((s, m) => s + m.minutes, 0);
  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="kicker">{t.nav.lessons}</p>
        <h1>{t.lessons.h1}</h1>
        <p className="lede">{fill(t.lessons.lede, { n: metas.length, hours: Math.round(total / 60) })} <Link href="/roadmap/">{t.nav.roadmap}</Link> {t.lessons.lede2}</p>
      </header>
      {phasesFor(lang).map((p) => {
        const inPhase = metas.filter((m) => phaseOf(m.month) === p.n);
        if (!inPhase.length) return null;
        const ms = [...new Set(inPhase.map((m) => m.month))];
        return (
          <section key={p.n} className="phase-block">
            <h2 className="phase-h"><span>{p.months}</span>{p.title}</h2>
            {ms.map((mn) => (
              <div key={mn} className="month-block">
                {mn > 0 && (
                  <h3><Link href={`/roadmap/${mn}/`}>{fill(t.lessons.monthHead, { n: mn, title: months[mn - 1]?.title ?? "" })}</Link></h3>
                )}
                <DocRows docs={inPhase.filter((m) => m.month === mn)} base="/courses/" />
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
