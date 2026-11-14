import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/HoverLink";
import { NotTranslated } from "@/components/NotTranslated";
import { WORKSHOP, workshopLabs, type Step } from "@/data/workshop";
import { DESKTOP } from "@/lib/desktop";
import { fill } from "@/i18n/lang";
import { strings, type LangParams } from "@/i18n/server";

export const dynamicParams = false;
export const generateStaticParams = () => WORKSHOP.map((l) => ({ lab: l.id }));

type Props = LangParams<{ lab: string }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lab } = await params;
  const { lang } = await strings(params);
  return { title: workshopLabs(lang).find((l) => l.id === lab)?.title ?? "Workshop" };
}

/** `backticks` in a sentence become inline code; everything else is plain, escaped text. */
const inline = (s: string) => s.split(/(`[^`]+`)/).map((p, i) => (p.startsWith("`") ? <code key={i}>{p.slice(1, -1)}</code> : p));

function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="ws-steps">
      {steps.map((s, i) => (
        <li key={i}>
          <p>{inline(s.text)}</p>
          {s.code && <pre><code>{s.code}</code></pre>}
        </li>
      ))}
    </ol>
  );
}

export default async function Page({ params }: Props) {
  const { lab: id } = await params;
  const { lang, t } = await strings(params);
  const labs = workshopLabs(lang);
  const at = labs.findIndex((l) => l.id === id);
  const lab = labs[at];
  if (!lab) notFound();
  const next = labs[at + 1];
  return (
    <div className="page narrow workshop-lab">
      <p className="back"><Link href="/workshop/">{t.workshop.allLabs}</Link></p>
      <header className="page-head">
        <p className="kicker">{lab.tag}</p>
        <h1>{lab.title}</h1>
        <p className="lede">{lab.tagline}</p>
        <p className="ws-meta">{fill(t.workshop.minutes, { n: lab.minutes })} · {t.workshop.needs}: {lab.needs.join(", ")}</p>
      </header>

      <div className="prose">
        {lab.intro.map((p, i) => <p key={i}>{inline(p)}</p>)}
      </div>

      <div className="callout law">
        <span className="label">{t.workshop.kicker}</span>
        <p>{t.workshop.law}</p>
      </div>

      {DESKTOP && <p className="ws-tutor">{t.workshop.withTutor}</p>}

      <div className="callout">
        <span className="label">{t.workshop.isolate}</span>
        <p>{inline(lab.isolate)}</p>
      </div>

      <NotTranslated lang={lang} />
      {lang === "fr" && <p className="muted ws-en-note">{t.workshop.stepsEnglish}</p>}

      <section className="ws-phase" aria-labelledby="ws-build">
        <h2 id="ws-build">{t.workshop.build}</h2>
        <Steps steps={lab.build} />
      </section>

      <section className="ws-phase ws-attack" aria-labelledby="ws-attack">
        <h2 id="ws-attack">{t.workshop.attack}</h2>
        <Steps steps={lab.attack} />
        <div className="callout"><span className="label">{t.workshop.observe}</span><p>{inline(lab.observe)}</p></div>
      </section>

      <section className="ws-phase ws-defend" aria-labelledby="ws-defend">
        <h2 id="ws-defend">{t.workshop.defend}</h2>
        <Steps steps={lab.defend} />
      </section>

      <div className="callout key">
        <span className="label">{t.workshop.detect}</span>
        <p>{inline(lab.detect)}</p>
      </div>

      <footer className="ws-foot">
        <p className="ws-learn">
          <span>{t.workshop.learnMore}</span>{" "}
          {lab.learn.map((l, i) => (
            <span key={l.href}>{i ? ", " : ""}<Link href={l.href}>{l.title}</Link></span>
          ))}
        </p>
        {next && <Link className="btn" href={`/workshop/${next.id}/`}>{t.workshop.next}: {next.title}</Link>}
      </footer>
    </div>
  );
}
