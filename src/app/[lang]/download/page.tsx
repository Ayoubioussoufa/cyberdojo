import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DownloadPicker } from "@/components/DownloadPicker";
import { strings, type LangParams } from "@/i18n/server";
import { DESKTOP } from "@/lib/desktop";
import { latestRelease, RELEASES, REPO } from "@/lib/release";

/** GitHub is asked again at most every ten minutes, so a new release shows up on its own. */
export const revalidate = 600;

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { t } = await strings(params);
  return { title: t.download.navLabel, description: t.download.description };
}

/** The website's page for the desktop app. Open to everyone, signed in or not (src/proxy.ts). */
export default async function Page({ params }: LangParams) {
  if (DESKTOP) notFound();
  const { t } = await strings(params);
  const release = await latestRelease();
  const file = (os: string, kind: string, fallback: string) => release?.installers.find((i) => i.os === os && i.kind === kind)?.name ?? fallback;
  const appImage = file("linux", "AppImage", "CyberDojo-linux-x86_64.AppImage");
  const deb = file("linux", "deb", "CyberDojo-linux-amd64.deb");
  const what = [
    [t.download.what1, t.download.what1Text],
    [t.download.what2, t.download.what2Text],
    [t.download.what3, t.download.what3Text],
    [t.download.what4, t.download.what4Text],
  ];
  const faq = [
    [t.download.faqSafe, t.download.faqSafeText],
    [t.download.faqOffline, t.download.faqOfflineText],
    [t.download.faqProgress, t.download.faqProgressText],
    [t.download.faqModel, t.download.faqModelText],
    [t.download.faqIntel, t.download.faqIntelText],
  ];
  return (
    <div className="page download">
      <header className="dl-hero">
        <h1>{t.download.title}</h1>
        <p className="lede">{t.download.lede}</p>
        {release ? <DownloadPicker release={release} /> : <p className="dl-soon">{t.download.soon}</p>}
        <p className="dl-links">
          <a href={RELEASES}>{t.download.allReleases}</a>
          {release?.checksums && <a href={release.checksums}>{t.download.checksums}</a>}
          <a href={REPO}>{t.download.source}</a>
        </p>
      </header>

      <section className="dl-section" aria-labelledby="dl-what">
        <h2 id="dl-what">{t.download.whatTitle}</h2>
        <ul className="dl-what">
          {what.map(([title, text]) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}
        </ul>
      </section>

      <section className="dl-section" aria-labelledby="dl-need">
        <h2 id="dl-need">{t.download.needTitle}</h2>
        <ul className="dl-need">
          <li>{t.download.windowsNote}</li>
          <li>{t.download.macNote}</li>
          <li>{t.download.linuxNote}</li>
          <li>{t.download.needMemory}</li>
          <li>{t.download.needDisk}</li>
          <li>{t.download.needNet}</li>
        </ul>
      </section>

      <section className="dl-section" aria-labelledby="dl-install">
        <h2 id="dl-install">{t.download.installTitle}</h2>
        <div className="dl-install">
          <div>
            <h3>Windows</h3>
            <ol><li>{t.download.win1}</li><li>{t.download.win2}</li><li>{t.download.win3}</li></ol>
          </div>
          <div>
            <h3>macOS</h3>
            <ol><li>{t.download.mac1}</li><li>{t.download.mac2}</li><li>{t.download.mac3}</li></ol>
            <p className="dl-note">{t.download.macOld}</p>
            <p className="dl-note">{t.download.macDamaged}</p>
            <pre><code>xattr -dr com.apple.quarantine /Applications/CyberDojo.app</code></pre>
          </div>
          <div>
            <h3>Linux</h3>
            <ol>
              <li>{t.download.linux1}<pre><code>chmod +x {appImage}{"\n"}./{appImage}</code></pre></li>
              <li>{t.download.linux2}<pre><code>sudo apt install ./{deb}</code></pre></li>
            </ol>
          </div>
        </div>
        <p className="dl-first">{t.download.firstRun}</p>
      </section>

      <section className="dl-section" aria-labelledby="dl-faq">
        <h2 id="dl-faq">{t.download.faqTitle}</h2>
        {faq.map(([q, a]) => <details key={q} className="dl-faq"><summary>{q}</summary><p>{a}</p></details>)}
      </section>
    </div>
  );
}
