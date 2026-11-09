import type { Metadata } from "next";
import { Subnav } from "@/components/Subnav";
import { ResourceList } from "@/components/ResourceList";
import resources from "@/data/resources.json";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.subnav.resources };
}

export default async function Page({ params }: LangParams) {
  const { t } = await strings(params);
  return (
    <div className="page narrow">
      <Subnav group="library" />
      <header className="page-head">
        <p className="kicker">{t.subnav.resources}</p>
        <h1>{t.pages.resourcesH1}</h1>
        <p className="lede">{t.pages.resourcesLede}</p>
      </header>
      <ResourceList groups={resources} />
    </div>
  );
}
