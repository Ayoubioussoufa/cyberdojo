import type { Metadata } from "next";
import { ProgressBoard } from "@/components/Progress";
import { SkillMatrix, YourData } from "@/components/Skills";
import { buildPath } from "@/lib/path";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.pages.skillsTitle };
}

export default async function Page({ params }: LangParams) {
  const { lang, t } = await strings(params);
  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="kicker">{t.nav.progress}</p>
        <h1>{t.pages.skillsH1}</h1>
        <p className="lede">{t.pages.skillsLede}</p>
      </header>
      <ProgressBoard path={buildPath(lang)} />
      <h2 className="section-title">{t.pages.scoreH2}</h2>
      <p className="muted">{t.pages.scoreText}</p>
      <div className="callout key">
        <span className="label">{t.pages.scoreHow}</span>
        <ul>
          <li>{t.pages.score1}</li>
          <li>{t.pages.score2}</li>
          <li>{t.pages.score3}</li>
        </ul>
      </div>
      <SkillMatrix />
      <YourData />
    </div>
  );
}
