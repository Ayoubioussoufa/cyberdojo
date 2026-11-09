import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { DOMAINS, domainText } from "@/data/domains";
import { AD_DEFENCE, ELSEWHERE, type TrainLink } from "@/data/train";
import { lessons, modules } from "@/lib/content";
import { levelName } from "@/i18n/ui";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.nav.modules };
}

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

export default async function Page({ params }: LangParams) {
  const { lang, t } = await strings(params);
  const all = modules(lang);
  const lessonList = lessons(lang);
  const titles = new Map(lessonList.map((d) => [d.meta.number, d]));
  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">{t.nav.modules}</p>
        <h1>{t.modules.h1}</h1>
        <p className="lede">{t.modules.lede}</p>
      </header>
      {DOMAINS.map((d) => {
        const mine = all.filter((m) => m.meta.domain === d.id).sort((a, b) => LEVELS.indexOf(a.meta.level ?? "") - LEVELS.indexOf(b.meta.level ?? ""));
        return (
          <section key={d.id} id={`domain-${d.id}`} className="module-domain">
            <h2>{d.id}. {domainText(d, lang).title}</h2>
            <p className="muted">{domainText(d, lang).blurb}</p>
            {d.lessons.length > 0 && (
              <p className="muted">
                {t.modules.basics}{" "}
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
                  <span className="module-level">{levelName(lang, m.meta.level ?? "")}</span>
                  <span className="muted">{m.meta.summary}</span>
                </li>
              ))}
              {ELSEWHERE.filter((e) => e.domain === d.id).map((e) => (
                <li key={e.title} className="module-elsewhere">
                  <strong>{e.title}</strong>
                  <span className="module-level">{t.modules.elsewhere}</span>
                  <span className="muted">
                    <span lang={lang === "en" ? undefined : "en"}>{e.summary}</span> {t.modules.noModule}{" "}
                    {e.lessons.flatMap((s, i) => {
                      const l = lessonList.find((x) => x.meta.slug === s);
                      return l ? [<span key={s}>{i ? ", " : ""}<Link href={`/courses/${s}/`}>{l.meta.title}</Link></span>] : [];
                    })}
                    .
                  </span>
                  <Out links={e.links} />
                </li>
              ))}
              {ELSEWHERE.some((e) => e.domain === d.id) && (
                <li className="module-elsewhere">
                  <strong>{t.modules.defending}</strong>
                  <span className="muted">{t.modules.defendingText}</span>
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
