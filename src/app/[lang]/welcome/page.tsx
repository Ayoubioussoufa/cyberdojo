import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { AppButton } from "@/components/DownloadPicker";
import Link from "@/components/HoverLink";
import { breakClasses } from "@/data/breakin";
import { dojoModules } from "@/data/fr/dojo";
import { fill } from "@/i18n/lang";
import { strings, type LangParams } from "@/i18n/server";
import { lessons, machines, modules, toolDocs } from "@/lib/content";
import { PROJECTS } from "@/lib/data";
import { DESKTOP } from "@/lib/desktop";
import { RANGES } from "@/lib/missions";
import { latestRelease, RELEASES, REPO } from "@/lib/release";

/** The app's button follows new releases without a redeploy. */
export const revalidate = 600;

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { t } = await strings(params);
  return { title: { absolute: `CyberDojo: ${t.landing.title}` }, description: t.landing.description };
}

/** A command typed once on load; --n is its length in characters, for the typing animation. */
const Prompt = ({ who, cmd }: { who: string; cmd: string }) => (
  <p className="ld-prompt" aria-hidden="true">
    <span className="ld-who">{who}</span>:<span className="ld-dir">~</span>$ <span className="ld-cmd" style={{ "--n": cmd.length } as CSSProperties}>{cmd}</span>
  </p>
);

/**
 * The front door for visitors who aren't signed in: src/proxy.ts shows it at
 * "/" instead of sending them to the sign-in page. It offers the two ways to
 * study, says what each gives, and that everything is open source.
 */
export default async function Page({ params }: LangParams) {
  if (DESKTOP) notFound();
  const { lang, t } = await strings(params);
  const l = t.landing;
  const release = await latestRelease();
  const flags = dojoModules(lang).reduce((n, m) => n + (RANGES[m.range]?.missions.length ?? 0), 0);
  const inside = [
    [fill(l.lessons, { n: lessons(lang).length }), l.lessonsText, "/courses/"],
    [fill(l.modules, { n: modules(lang).length }), l.modulesText, "/modules/"],
    [fill(l.tools, { n: toolDocs(lang).length }), l.toolsText, "/tools/"],
    [fill(l.dojo, { n: flags }), l.dojoText, "/dojo/"],
    [fill(l.breakin, { n: breakClasses(lang).length }), l.breakinText, "/break-in/"],
    [fill(l.projects, { n: PROJECTS.length, m: machines(lang).length }), l.projectsText, "/projects/"],
  ];
  const rows = [
    [l.rowPrice, l.free, l.free],
    [l.rowAccount, l.accountWeb, l.accountApp],
    [l.rowInstall, l.installWeb, l.installApp],
    [l.rowOffline, l.offlineWeb, l.offlineApp],
    [l.rowTutor, l.tutorWeb, l.tutorApp],
    [l.rowData, l.dataWeb, l.dataApp],
    [l.rowWhere, l.whereWeb, l.whereApp],
    [l.rowUpdates, l.updatesWeb, l.updatesApp],
  ];
  const why = [[l.why1, l.why1Text], [l.why2, l.why2Text], [l.why3, l.why3Text], [l.why4, l.why4Text], [l.why5, l.why5Text]];
  const faq = [[l.faqFree, l.faqFreeText], [l.faqWho, l.faqWhoText], [l.faqLegal, l.faqLegalText], [l.faqSwitch, l.faqSwitchText], [l.faqWebTutor, l.faqWebTutorText]];

  return (
    <div className="page landing">
      <header className="ld-hero">
        <h1>{l.title}</h1>
        <p className="lede">{l.lede}</p>
        <div className="ld-paths" role="group" aria-label={l.choose}>
          <section className="ld-path" aria-labelledby="ld-web">
            <Prompt who="guest@browser" cmd="open cyberdojo" />
            <h2 id="ld-web">{l.webTitle}</h2>
            <p>{l.webText}</p>
            <Link className="btn primary lg" href="/signin/?mode=up">{l.webCta}</Link>
            <p className="ld-small">{l.haveAccount} <Link href="/signin/">{l.signIn}</Link></p>
          </section>
          <section className="ld-path" aria-labelledby="ld-app">
            <Prompt who="you@laptop" cmd="./cyberdojo" />
            <h2 id="ld-app">{l.appTitle}</h2>
            <p>{l.appText}</p>
            <AppButton release={release} fallback={l.appTitle} />
            <p className="ld-small"><Link href="/download/">{l.appAll}</Link></p>
          </section>
        </div>
        <p className="ld-free">{l.bothFree} <a href={REPO}>{l.osRepo}</a></p>
      </header>

      <section className="ld-section" aria-labelledby="ld-inside">
        <h2 id="ld-inside">{l.insideTitle}</h2>
        <dl className="ld-inside">
          {inside.map(([what, text, href]) => (
            <div key={href}>
              <dt><Link href={href as string}>{what}</Link></dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="ld-section" aria-labelledby="ld-compare">
        <h2 id="ld-compare">{l.compareTitle}</h2>
        <p className="ld-lede">{l.compareLede}</p>
        <div className="ld-table">
          <table>
            <thead>
              <tr><td /><th scope="col">{l.colWeb}</th><th scope="col">{l.colApp}</th></tr>
            </thead>
            <tbody>
              {rows.map(([label, web, app]) => <tr key={label}><th scope="row">{label}</th><td data-col={l.colWeb}>{web}</td><td data-col={l.colApp}>{app}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ld-section" aria-labelledby="ld-why">
        <h2 id="ld-why">{l.whyTitle}</h2>
        <ul className="ld-why">
          {why.map(([title, text]) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}
        </ul>
        <div className="ld-again">
          <AppButton release={release} fallback={l.appTitle} />
          <Link href="/download/">{l.appAll}</Link>
        </div>
      </section>

      <section className="ld-section ld-open" aria-labelledby="ld-os">
        <h2 id="ld-os">{l.osTitle}</h2>
        <p>{l.osText}</p>
        <p className="ld-lede">{l.osLicense}</p>
        <ul className="ld-links">
          <li><a className="btn" href={REPO}>{l.osRepo}</a></li>
          <li><a href={`${REPO}/blob/main/CONTRIBUTING.md`}>{l.osContribute}</a></li>
          <li><a href={`${REPO}/security`}>{l.osSecurity}</a></li>
          <li><a href={RELEASES}>{l.osReleases}</a></li>
        </ul>
      </section>

      <section className="ld-section" aria-labelledby="ld-start">
        <h2 id="ld-start">{l.startTitle}</h2>
        <div className="ld-start">
          <div>
            <h3>{l.startWeb}</h3>
            <ol><li>{l.web1}</li><li>{l.web2}</li><li>{l.web3}</li></ol>
            <Link className="btn primary" href="/signin/?mode=up">{l.webCta}</Link>
          </div>
          <div>
            <h3>{l.startApp}</h3>
            <ol><li>{l.app1}</li><li>{l.app2}</li><li>{l.app3}</li></ol>
            <Link className="btn" href="/download/">{l.appAll}</Link>
          </div>
        </div>
      </section>

      <section className="ld-section" aria-labelledby="ld-faq">
        <h2 id="ld-faq">{l.faqTitle}</h2>
        {faq.map(([q, a]) => <details key={q} className="dl-faq"><summary>{q}</summary><p>{a}</p></details>)}
      </section>
    </div>
  );
}
