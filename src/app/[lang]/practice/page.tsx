import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { DrillGroups, PracticeTop } from "@/components/PracticeHub";
import { LazyRange } from "@/components/Lazy";
import { Subnav } from "@/components/Subnav";
import { CASES } from "@/lib/cases";
import { DRILL_LIST } from "@/lib/drills";
import { RANGES } from "@/lib/missions";
import { MISSIONS_MACHINES } from "@/lib/missions/machines";
import { fill } from "@/i18n/lang";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.nav.practice };
}

export default async function Page({ params }: LangParams) {
  const { t } = await strings(params);
  const p = t.practice;
  const MODES = [
    { href: "/break-in/", title: t.breakin.h1, blurb: p.breakinBlurb },
    { href: "/practice/cases/", title: t.pages.casesTitle, blurb: fill(p.casesBlurb, { n: CASES.length }) },
    { href: "/practice/hunts/", title: p.hunts, blurb: p.huntsBlurb },
    { href: "/practice/flaws/", title: p.flaws, blurb: p.flawsBlurb },
    { href: "/practice/build/", title: p.build, blurb: p.buildBlurb },
    { href: "/practice/order/", title: p.order, blurb: p.orderBlurb },
    { href: "/dojo/", title: "Dojo", blurb: p.dojoBlurb },
    { href: "/machines/", title: t.subnav.machines, blurb: p.machinesBlurb },
    { href: "/practice/flashcards/", title: t.subnav.flashcards, blurb: p.cardsBlurb },
    { href: "/practice/labs/", title: t.subnav.labs, blurb: p.labsBlurb },
  ];
  const drills = DRILL_LIST.filter((d) => !["hunts", "flaws", "order", "build"].includes(d.id)).map(({ id, title, blurb, month }) => ({ id, title, blurb, month }));
  const ranges = Object.entries(RANGES).filter(([id]) => id !== "sandbox" && !(id in MISSIONS_MACHINES));
  return (
    <div className="page">
      <Subnav group="practice" />
      <header className="page-head">
        <p className="kicker">{t.nav.practice}</p>
        <h1>{p.h1}</h1>
        <p className="lede">{p.lede}</p>
      </header>
      <PracticeTop />

      <h2 className="section-title">{p.play}</h2>
      <div className="grid3">
        {MODES.map((m) => (
          <Link key={m.href} href={m.href} className="card link-card">
            <h3>{m.title}</h3>
            <p className="muted">{m.blurb}</p>
          </Link>
        ))}
      </div>

      <h2 className="section-title">{p.drills}</h2>
      <p className="muted">{p.drillsText}</p>
      <DrillGroups drills={drills} />

      <h2 className="section-title">{p.missions}</h2>
      <details className="drill-group">
        <summary>{p.allSets} <span className="path-count">{ranges.length}</span></summary>
        <div className="grid3">
          {ranges.map(([id, r]) => (
            <Link key={id} href={`/practice/${id}/`} className="card link-card">
              <span className="phase-n">{fill(p.nMissions, { n: r.missions.length })}</span>
              <h3>{r.title}</h3>
            </Link>
          ))}
        </div>
      </details>

      <h2 className="section-title">{p.free}</h2>
      <LazyRange id="sandbox" />
    </div>
  );
}
