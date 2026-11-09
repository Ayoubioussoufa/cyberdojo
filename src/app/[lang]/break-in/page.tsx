import type { Metadata } from "next";
import { BreakInHub } from "@/components/BreakInHub";
import { breakClasses } from "@/data/breakin";
import { RANGES } from "@/lib/missions";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { t } = await strings(params);
  return { title: t.breakin.h1, description: t.breakin.description };
}

export default async function Page({ params }: LangParams) {
  const { lang } = await strings(params);
  const classes = breakClasses(lang).map((c) => ({
    id: c.id,
    title: c.title,
    tagline: c.tagline,
    owasp: c.owasp,
    flags: (RANGES[c.range]?.missions ?? []).map((m) => m.id),
  }));
  return <div className="page"><BreakInHub classes={classes} /></div>;
}
