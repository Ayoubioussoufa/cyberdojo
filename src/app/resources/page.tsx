import type { Metadata } from "next";
import { Subnav } from "@/components/Subnav";
import { ResourceList } from "@/components/ResourceList";
import resources from "@/data/resources.json";

export const metadata: Metadata = { title: "Resources" };

export default function Page() {
  return (
    <div className="page narrow">
      <Subnav group="library" />
      <header className="page-head">
        <p className="kicker">Resources</p>
        <h1>Every link you'll need</h1>
        <p className="lede">Grouped by purpose, with the month each becomes useful. Free comes first. One platform at a time: a finished path beats four half-used subscriptions.</p>
      </header>
      <ResourceList groups={resources} />
    </div>
  );
}
