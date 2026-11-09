import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { notFound } from "next/navigation";
import { LazyRange } from "@/components/Lazy";
import { BreakInProgress } from "@/components/BreakInHub";
import { NotTranslated } from "@/components/NotTranslated";
import { BREAK_IN, breakClasses } from "@/data/breakin";
import { RANGES } from "@/lib/missions";
import { strings, type LangParams } from "@/i18n/server";

export const dynamicParams = false;
export const generateStaticParams = () => BREAK_IN.map((c) => ({ module: c.id }));

type Props = LangParams<{ module: string }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { module } = await params;
  const { lang } = await strings(params);
  return { title: breakClasses(lang).find((c) => c.id === module)?.title ?? "Try to break in" };
}

const code = (s: string) => s.split(/(`[^`]+`)/).map((p, i) => (p.startsWith("`") ? <code key={i}>{p.slice(1, -1)}</code> : p));

export default async function Page({ params }: Props) {
  const { module } = await params;
  const { lang, t } = await strings(params);
  const all = breakClasses(lang);
  const at = all.findIndex((c) => c.id === module);
  const c = all[at];
  if (!c) notFound();
  const flags = (RANGES[c.range]?.missions ?? []).map((m) => m.id);
  const next = all[at + 1];
  return (
    <div className="page narrow breakin-module">
      <p className="back"><Link href="/break-in/">{t.breakin.allClasses}</Link></p>
      <header className="page-head">
        <p className="kicker">{c.owasp}</p>
        <h1>{c.title}</h1>
        <p className="lede">{c.tagline}</p>
        <BreakInProgress flags={flags} />
      </header>

      <div className="prose breakin-intro">
        {c.intro.map((p, i) => <p key={i}>{code(p)}</p>)}
      </div>

      <div className="callout law">
        <span className="label">{t.breakin.safeLabel}</span>
        <p>{t.breakin.safeShort}</p>
      </div>

      <NotTranslated lang={lang} />
      <LazyRange id={c.range} />

      <div className="callout key breakin-defence">
        <span className="label">{t.breakin.defence}</span>
        <p>{code(c.defence)}</p>
      </div>

      <footer className="breakin-foot">
        <p className="breakin-learn">
          <span>{t.breakin.learnMore}</span>{" "}
          {c.learn.map((l, i) => (
            <span key={l.href}>{i ? ", " : ""}<Link href={l.href}>{l.title}</Link></span>
          ))}
        </p>
        {next && <Link className="btn" href={`/break-in/${next.id}/`}>{t.breakin.nextClass}: {next.title}</Link>}
      </footer>
    </div>
  );
}
