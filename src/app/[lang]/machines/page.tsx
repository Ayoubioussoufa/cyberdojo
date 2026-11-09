import type { Metadata } from "next";
import { Subnav } from "@/components/Subnav";
import { MachineCards } from "@/components/MachineCards";
import { machines } from "@/lib/content";
import { MISSIONS_MACHINES } from "@/lib/missions/machines";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.subnav.machines };
}

const ORDER = ["lantern", "harbor", "keystone", "switchboard", "parrot"];

export default async function Page({ params }: LangParams) {
  const { lang, t } = await strings(params);
  const docs = ORDER.flatMap((s) => machines(lang).filter((d) => d.meta.slug === s));
  const cards = docs.map((d) => ({ ...d.meta, stages: (MISSIONS_MACHINES[d.meta.slug]?.missions ?? []).map((m) => m.id) }));
  return (
    <div className="page">
      <Subnav group="practice" />
      <header className="page-head">
        <p className="kicker">{t.subnav.machines}</p>
        <h1>{t.pages.machinesH1}</h1>
        <p className="lede">{t.pages.machinesLede}</p>
      </header>
      <MachineCards cards={cards} />
      <div className="callout law">
        <span className="label">{t.panel.stayLegal}</span>
        <p>{t.pages.machinesLaw1} <a href="https://tryhackme.com/" target="_blank" rel="noreferrer">TryHackMe</a> {t.pages.or} <a href="https://www.hackthebox.com/" target="_blank" rel="noreferrer">Hack The Box</a>{t.pages.machinesLaw2}</p>
      </div>
    </div>
  );
}
