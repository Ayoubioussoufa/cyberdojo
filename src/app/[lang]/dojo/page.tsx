import type { Metadata } from "next";
import { DojoHub } from "@/components/DojoHub";
import { dojoModules } from "@/data/fr/dojo";
import { RANGES } from "@/lib/missions";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { t } = await strings(params);
  return { title: t.pages.dojoTitle, description: t.pages.dojoDescription };
}

export default async function Page({ params }: LangParams) {
  const { lang } = await strings(params);
  const modules = dojoModules(lang).map((m) => ({ ...m, missions: (RANGES[m.range]?.missions ?? []).map((x) => ({ id: x.id, title: x.title })) }));
  return <div className="page"><DojoHub modules={modules} /></div>;
}
