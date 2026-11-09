import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { notFound } from "next/navigation";
import { LazyRange } from "@/components/Lazy";
import { ModuleBelt } from "@/components/DojoHub";
import { NotTranslated } from "@/components/NotTranslated";
import { DOJO } from "@/data/dojo";
import { dojoModules } from "@/data/fr/dojo";
import { RANGES } from "@/lib/missions";
import { Html } from "@/components/Html";
import { trainHtml } from "@/lib/content";
import { fill } from "@/i18n/lang";
import { strings, type LangParams } from "@/i18n/server";

export const dynamicParams = false;
export const generateStaticParams = () => DOJO.map((m) => ({ module: m.id }));

type Props = LangParams<{ module: string }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { module } = await params;
  const { lang } = await strings(params);
  return { title: dojoModules(lang).find((m) => m.id === module)?.title ?? "Dojo" };
}

const code = (s: string) => s.split(/(`[^`]+`)/).map((p, i) => (p.startsWith("`") ? <code key={i}>{p.slice(1, -1)}</code> : p));

export default async function Page({ params }: Props) {
  const { module } = await params;
  const { lang, t } = await strings(params);
  const all = dojoModules(lang);
  const at = all.findIndex((m) => m.id === module);
  const m = all[at];
  if (!m) notFound();
  const ids = (RANGES[m.range]?.missions ?? []).map((x) => x.id);
  const next = all[at + 1];
  const train = trainHtml(`dojo:${m.id}`, undefined, lang);
  return (
    <div className="page narrow dojo-module">
      <p className="back"><Link href="/dojo/">{t.dojo.allModules}</Link></p>
      <header className="page-head">
        <h1>{m.title}</h1>
        <ModuleBelt belt={m.belt} ids={ids} />
      </header>
      <div className="prose dojo-intro">
        {m.intro.map((p, i) => <p key={i}>{code(p)}</p>)}
      </div>
      <ul className="dojo-tools" aria-label={t.dojo.uses}>
        {m.tools.map((x) => <li key={x}><code>{x}</code></li>)}
      </ul>
      <NotTranslated lang={lang} />
      <LazyRange id={m.range} />
      {train && <Html html={train} />}
      <footer className="dojo-foot">
        {m.lesson && <p>{t.dojo.fullExplanation} <Link href={m.lesson.href}>{m.lesson.title}</Link>.</p>}
        <p className="muted">{m.credit.note} <a href={m.credit.href} target="_blank" rel="noreferrer">{t.dojo.original}</a>.</p>
        {next && <Link className="btn" href={`/dojo/${next.id}/`}>{fill(t.dojo.nextModule, { title: next.title })}</Link>}
      </footer>
    </div>
  );
}
