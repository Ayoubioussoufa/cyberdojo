import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { LabsFilter } from "@/components/LabsFilter";
import { Subnav } from "@/components/Subnav";
import { DOJO } from "@/data/dojo";
import { DOMAINS } from "@/data/domains";
import { TOOL_CATS } from "@/data/toolcats";
import { AD_DEFENCE, ELSEWHERE, TRAIN, type TrainKind, type TrainLink } from "@/data/train";
import { CASES } from "@/lib/cases";
import { lessons, machines, modules, toolDocs } from "@/lib/content";
import { PROJECTS } from "@/lib/data";

export const metadata: Metadata = {
  title: "Hands-on labs",
  description: "Every lesson, module, tool and exercise on CyberDojo, with the legal platforms where you practise it for real.",
};

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
const PLATFORMS = [
  { host: "academy.hackthebox.com", name: "HTB Academy", what: "Guided modules with a lab for each section, on both attack and defence.", cost: "Fundamental (Tier 0) modules cost nothing; the rest need a subscription, with a student plan for academic emails.", href: "https://academy.hackthebox.com/faq" },
  { host: "portswigger.net", name: "Web Security Academy", what: "Every web vulnerability class, explained, with labs to exploit.", cost: "Free.", href: "https://portswigger.net/web-security" },
  { host: "pwn.college", name: "pwn.college", what: "Linux, binary exploitation, reversing and system security as graded challenges, from Arizona State University.", cost: "Free.", href: "https://pwn.college/" },
  { host: "cryptohack.org", name: "CryptoHack", what: "Cryptography courses, then attacks on real schemes, solved in Python.", cost: "Free.", href: "https://cryptohack.org/" },
  { host: "overthewire.org", name: "OverTheWire", what: "Wargames over SSH. Bandit is the first one to play.", cost: "Free.", href: "https://overthewire.org/wargames/" },
  { host: "github.com/redcanaryco", name: "Atomic Red Team", what: "Small attack tests you run in your own lab, to prove your detections fire.", cost: "Free and open source.", href: "https://github.com/redcanaryco/atomic-red-team" },
  { host: "lolbas-project.github.io", name: "LOLBAS", what: "How each built-in Windows program gets abused, with commands to test in your lab.", cost: "Free.", href: "https://lolbas-project.github.io/" },
];

const hostOf = (url: string) => {
  const u = new URL(url);
  return u.hostname === "github.com" ? `github.com/${u.pathname.split("/")[1]}` : u.hostname.replace(/^www\./, "");
};

export default function Page() {
  const groups: Group[] = [
    {
      id: "lessons",
      title: "Lessons, in Roadmap order",
      rows: lessons().flatMap((d) => rowFor(d.meta.slug, d.meta.title, `/courses/${d.meta.slug}/`)),
    },
    ...DOMAINS.map((dm) => ({
      id: `modules-${dm.id}`,
      title: `Modules: ${dm.title}`,
      rows: modules()
        .filter((d) => d.meta.slug.startsWith(`${dm.id}-`))
        .flatMap((d) => rowFor(d.meta.slug, d.meta.title, `/modules/${d.meta.slug}/`)),
    })),
    ...TOOL_CATS.map((c) => ({
      id: `tools-${c.folder}`,
      title: `Tools: ${c.title}`,
      rows: toolDocs()
        .filter((d) => d.meta.category === c.folder)
        .flatMap((d) => rowFor(d.meta.slug, d.meta.title, `/tools/${d.meta.slug}/`)),
    })),
    { id: "dojo", title: "Dojo modules", rows: DOJO.flatMap((m) => rowFor(`dojo:${m.id}`, m.title, `/dojo/${m.id}/`)) },
    { id: "machines", title: "Machines", rows: machines().flatMap((d) => rowFor(d.meta.slug, d.meta.title, `/machines/${d.meta.slug}/`)) },
    { id: "projects", title: "Projects", rows: PROJECTS.flatMap((p) => rowFor(p.id, `${p.id}: ${p.title}`, `/projects/${p.id}/`)) },
    { id: "cases", title: "Case files", rows: CASES.flatMap((c) => rowFor(`case:${c.id}`, c.title, `/practice/cases/${c.id}/`)) },
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
        <p className="kicker">Practice</p>
        <h1>Hands-on labs</h1>
        <p className="lede">CyberDojo teaches each attack from the defender&apos;s side: why it works, what it leaves behind, how to stop it. To do the attack itself, or to drill a skill on real systems, go to a platform built for it. Every link is listed here, and on the page it belongs to.</p>
      </header>

      <div className="callout law">
        <span className="label">Only where you&apos;re invited</span>
        <p>Attack only the labs these platforms give you, or machines you own. The same commands against anyone else&apos;s system, even out of curiosity, can be a crime. <Link href="/courses/0002-the-rules-of-the-game/">The rules lesson</Link> explains where the line is.</p>
      </div>

      <h2 className="section-title">The platforms</h2>
      <div className="table-wrap">
        <table className="labs-platforms">
          <thead><tr><th>Platform</th><th>What you do there</th><th>Cost</th><th>Links here</th></tr></thead>
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
              <td>Open-source labs</td>
              <td>Vulnerable apps, clusters, clouds and datasets you run yourself: OWASP Juice Shop, GOAD, CloudGoat, Kubernetes Goat, MemLabs, KC7 and more.</td>
              <td>Free; cloud labs bill your own account while they run.</td>
              <td>{others}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="section-title">Every page, with its labs</h2>
      <p className="page-links">
        <a href="#lessons">Lessons</a>
        <a href="#modules-01">Modules</a>
        <a href="#tools-01-recon-osint">Tools</a>
        <a href="#dojo">Dojo</a>
        <a href="#machines">Machines</a>
        <a href="#projects">Projects</a>
        <a href="#cases">Case files</a>
        <a href="#elsewhere">Taught elsewhere</a>
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
                    {r.kind === "attack" && <span className="labs-kind">attack</span>}
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
          <h3>Taught elsewhere: Active Directory attacks</h3>
          <p className="muted">CyberDojo has no module for these. The concepts are in the lessons named, and the attacks are taught by the platforms below.</p>
          <ul className="labs-list">
            {ELSEWHERE.map((e) => (
              <li key={e.title} data-text={[e.title, e.summary, "attack", ...e.links.map((l) => l.label)].join(" ").toLowerCase()}>
                <p className="labs-page">{e.title}<span className="labs-kind">attack</span></p>
                <ul className="labs-out">
                  {e.links.map((l) => (
                    <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer">{l.label}</a></li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="muted">Defending against them: {AD_DEFENCE.map((l, i) => (
            <span key={l.url}>{i ? ", " : ""}<a href={l.url} target="_blank" rel="noreferrer">{l.label}</a></span>
          ))}.</p>
        </section>
      </LabsFilter>
    </div>
  );
}
