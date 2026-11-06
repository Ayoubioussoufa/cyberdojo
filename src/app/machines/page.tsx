import type { Metadata } from "next";
import { MachineCards } from "@/components/MachineCards";
import { machines } from "@/lib/content";
import { MISSIONS_MACHINES } from "@/lib/missions/machines";

export const metadata: Metadata = { title: "Machines" };

const ORDER = ["lantern", "harbor", "keystone", "switchboard", "parrot"];

export default function Page() {
  const docs = ORDER.flatMap((s) => machines().filter((d) => d.meta.slug === s));
  const cards = docs.map((d) => ({ ...d.meta, stages: (MISSIONS_MACHINES[d.meta.slug]?.missions ?? []).map((m) => m.id) }));
  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Machines</p>
        <h1>Attack it, trace it, defend it</h1>
        <p className="lede">Each machine is a fictional target in your browser. You work through a whole story, from the first look to a fix you can prove, the way hands-on training platforms do. Nothing here touches a real system.</p>
      </header>
      <MachineCards cards={cards} />
      <div className="callout law">
        <span className="label">Stay legal</span>
        <p>These are simulations. To practise on real machines, use platforms built for it, such as <a href="https://tryhackme.com/" target="_blank" rel="noreferrer">TryHackMe</a> or <a href="https://www.hackthebox.com/" target="_blank" rel="noreferrer">Hack The Box</a>, or your own lab. Never test a system you don't own, or have no written permission to test.</p>
      </div>
    </div>
  );
}
