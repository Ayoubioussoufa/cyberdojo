import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { LabsFilter } from "@/components/LabsFilter";
import { Subnav } from "@/components/Subnav";
import { dojoModules } from "@/data/fr/dojo";
import { DOMAINS, domainText } from "@/data/domains";
import { TOOL_CATS, catText } from "@/data/toolcats";
import { AD_DEFENCE, ELSEWHERE, TRAIN, type TrainKind, type TrainLink } from "@/data/train";
import { CASES } from "@/lib/cases";
import { lessons, machines, modules, toolDocs } from "@/lib/content";
import { PROJECTS } from "@/lib/data";
import { fill, type Lang } from "@/i18n/lang";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { t } = await strings(params);
  return { title: t.subnav.labs, description: t.labs.description };
}

interface Row {
  title: string;
  href: string;
  kind: TrainKind;
  links: TrainLink[];
}

interface Group {
  id: string;
  title: string;
  rows: Row[];
}

const rowFor = (key: string, title: string, href: string): Row[] => {
  const t = TRAIN[key];
  return t ? [{ title, href, kind: t.kind, links: t.links }] : [];
};

/** What each platform is for and what it costs, as each one states it. Counted from the links on this site. */
const PLATFORMS_EN = [
  { host: "academy.hackthebox.com", name: "HTB Academy", what: "Guided modules with a lab for each section, on both attack and defence.", cost: "Fundamental (Tier 0) modules cost nothing; the rest need a subscription, with a student plan for academic emails.", href: "https://academy.hackthebox.com/faq" },
  { host: "portswigger.net", name: "Web Security Academy", what: "Every web vulnerability class, explained, with labs to exploit.", cost: "Free.", href: "https://portswigger.net/web-security" },
  { host: "pwn.college", name: "pwn.college", what: "Linux, binary exploitation, reversing and system security as graded challenges, from Arizona State University.", cost: "Free.", href: "https://pwn.college/" },
  { host: "cryptohack.org", name: "CryptoHack", what: "Cryptography courses, then attacks on real schemes, solved in Python.", cost: "Free.", href: "https://cryptohack.org/" },
  { host: "overthewire.org", name: "OverTheWire", what: "Wargames over SSH. Bandit is the first one to play.", cost: "Free.", href: "https://overthewire.org/wargames/" },
  { host: "github.com/redcanaryco", name: "Atomic Red Team", what: "Small attack tests you run in your own lab, to prove your detections fire.", cost: "Free and open source.", href: "https://github.com/redcanaryco/atomic-red-team" },
  { host: "lolbas-project.github.io", name: "LOLBAS", what: "How each built-in Windows program gets abused, with commands to test in your lab.", cost: "Free.", href: "https://lolbas-project.github.io/" },
];

const PLATFORMS_FR: Record<string, { what: string; cost: string }> = {
  "academy.hackthebox.com": { what: "Des modules guidés avec un lab par section, en attaque comme en défense.", cost: "Les modules fondamentaux (Tier 0) sont gratuits ; les autres demandent un abonnement, avec une offre étudiante pour les adresses universitaires." },
  "portswigger.net": { what: "Chaque classe de vulnérabilité web, expliquée, avec des labs à exploiter.", cost: "Gratuit." },
  "pwn.college": { what: "Linux, exploitation de binaires, rétro-ingénierie et sécurité système sous forme de défis notés, par l'université d'État de l'Arizona.", cost: "Gratuit." },
  "cryptohack.org": { what: "Des cours de cryptographie, puis des attaques sur de vrais schémas, résolues en Python.", cost: "Gratuit." },
  "overthewire.org": { what: "Des wargames via SSH. Bandit est le premier à faire.", cost: "Gratuit." },
  "github.com/redcanaryco": { what: "De petits tests d'attaque à lancer dans votre propre lab, pour prouver que vos détections se déclenchent.", cost: "Gratuit et open source." },
  "lolbas-project.github.io": { what: "Comment chaque programme intégré à Windows est détourné, avec des commandes à tester dans votre lab.", cost: "Gratuit." },
};

const platforms = (lang: Lang) => (lang === "fr" ? PLATFORMS_EN.map((p) => ({ ...p, ...(PLATFORMS_FR[p.host] ?? {}) })) : PLATFORMS_EN);

const hostOf = (url: string) => {
  const u = new URL(url);
  return u.hostname === "github.com" ? `github.com/${u.pathname.split("/")[1]}` : u.hostname.replace(/^www\./, "");
};

export default async function Page({ params }: LangParams) {
  const { lang, t } = await strings(params);
  const L = t.labs;
  const PLATFORMS = platforms(lang);
  const groups: Group[] = [
    {
      id: "lessons",
      title: L.lessons,
      rows: lessons(lang).flatMap((d) => rowFor(d.meta.slug, d.meta.title, `/courses/${d.meta.slug}/`)),
    },
    ...DOMAINS.map((dm) => ({
      id: `modules-${dm.id}`,
      title: fill(L.modulesOf, { title: domainText(dm, lang).title }),
      rows: modules(lang)
        .filter((d) => d.meta.slug.startsWith(`${dm.id}-`))
        .flatMap((d) => rowFor(d.meta.slug, d.meta.title, `/modules/${d.meta.slug}/`)),
    })),
    ...TOOL_CATS.map((c) => ({
      id: `tools-${c.folder}`,
      title: fill(L.toolsOf, { title: catText(c, lang).title }),
      rows: toolDocs(lang)
        .filter((d) => d.meta.category === c.folder)
        .flatMap((d) => rowFor(d.meta.slug, d.meta.title, `/tools/${d.meta.slug}/`)),
    })),
    { id: "dojo", title: L.dojo, rows: dojoModules(lang).flatMap((m) => rowFor(`dojo:${m.id}`, m.title, `/dojo/${m.id}/`)) },
    { id: "machines", title: t.subnav.machines, rows: machines(lang).flatMap((d) => rowFor(d.meta.slug, d.meta.title, `/machines/${d.meta.slug}/`)) },
    { id: "projects", title: t.nav.projects, rows: PROJECTS.flatMap((p) => rowFor(p.id, `${p.id}: ${p.title}`, `/projects/${p.id}/`)) },
    { id: "cases", title: t.pages.casesTitle, rows: CASES.flatMap((c) => rowFor(`case:${c.id}`, c.title, `/practice/cases/${c.id}/`)) },
  ].filter((g) => g.rows.length);

  const all = groups.flatMap((g) => g.rows);
  const count = new Map<string, number>();
  for (const r of all) for (const l of r.links) count.set(hostOf(l.url), (count.get(hostOf(l.url)) ?? 0) + 1);
  const named = new Set(PLATFORMS.map((p) => p.host));
  const others = [...count.entries()].filter(([h]) => !named.has(h)).reduce((n, [, c]) => n + c, 0);
  const text = (r: Row) => [r.title, r.kind, ...r.links.flatMap((l) => [l.label, hostOf(l.url)])].join(" ").toLowerCase();

  return (
    <div className="page labs">
      <Subnav group="practice" />
      <header className="page-head">
        <p className="kicker">{t.nav.practice}</p>
        <h1>{t.subnav.labs}</h1>
        <p className="lede">{L.lede}</p>
      </header>

      <div className="callout law">
        <span className="label">{L.invited}</span>
        <p>{L.invitedText} <Link href="/courses/0002-the-rules-of-the-game/">{L.rules}</Link> {L.rulesEnd}</p>
      </div>

      <h2 className="section-title">{L.platforms}</h2>
      <div className="table-wrap">
        <table className="labs-platforms">
          <thead><tr><th>{L.platform}</th><th>{L.what}</th><th>{L.cost}</th><th>{L.count}</th></tr></thead>
          <tbody>
            {PLATFORMS.map((p) => (
              <tr key={p.host}>
                <td><a href={p.href} target="_blank" rel="noreferrer">{p.name}</a></td>
                <td>{p.what}</td>
                <td>{p.cost}</td>
                <td>{count.get(p.host) ?? 0}</td>
              </tr>
            ))}
            <tr>
              <td>{L.open}</td>
              <td>{L.openWhat}</td>
              <td>{L.openCost}</td>
              <td>{others}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="section-title">{L.every}</h2>
      <p className="page-links">
        <a href="#lessons">{t.nav.lessons}</a>
        <a href="#modules-01">{t.nav.modules}</a>
        <a href="#tools-01-recon-osint">{t.nav.tools}</a>
        <a href="#dojo">Dojo</a>
        <a href="#machines">{t.subnav.machines}</a>
        <a href="#projects">{t.nav.projects}</a>
        <a href="#cases">{t.pages.casesTitle}</a>
        <a href="#elsewhere">{L.elsewhereLink}</a>
      </p>
      <LabsFilter total={all.length + ELSEWHERE.length}>
        {groups.map((g) => (
          <section key={g.id} id={g.id} className="labs-group" data-group="">
            <h3>{g.title}</h3>
            <ul className="labs-list">
              {g.rows.map((r) => (
                <li key={r.href} data-text={text(r)}>
                  <p className="labs-page">
                    <Link href={r.href}>{r.title}</Link>
                    {r.kind === "attack" && <span className="labs-kind">{L.attack}</span>}
                  </p>
                  <ul className="labs-out">
                    {r.links.map((l) => (
                      <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer">{l.label}</a></li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section id="elsewhere" className="labs-group" data-group="">
          <h3>{L.elsewhere}</h3>
          <p className="muted">{L.elsewhereText}</p>
          <ul className="labs-list">
            {ELSEWHERE.map((e) => (
              <li key={e.title} data-text={[e.title, e.summary, "attack", ...e.links.map((l) => l.label)].join(" ").toLowerCase()}>
                <p className="labs-page">{e.title}<span className="labs-kind">{L.attack}</span></p>
                <ul className="labs-out">
                  {e.links.map((l) => (
                    <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer">{l.label}</a></li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="muted">{L.defending} {AD_DEFENCE.map((l, i) => (
            <span key={l.url}>{i ? ", " : ""}<a href={l.url} target="_blank" rel="noreferrer">{l.label}</a></span>
          ))}.</p>
        </section>
      </LabsFilter>
    </div>
  );
}
