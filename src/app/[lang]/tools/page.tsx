import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { ToolHub } from "@/components/ToolHub";
import { TOOL_CATS } from "@/data/toolcats";
import { toolDocs } from "@/lib/content";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.nav.tools };
}

export default async function Page({ params }: LangParams) {
  const { lang, t } = await strings(params);
  const tools = toolDocs(lang).map((d) => ({ slug: d.meta.slug, title: d.meta.title, summary: d.meta.summary, cat: d.meta.category ?? "", side: d.meta.side ?? "both", aka: d.meta.aka ?? [] }));
  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">{t.nav.tools}</p>
        <h1>{t.pages.toolsH1}</h1>
        <p className="lede">{t.pages.toolsLede} <Link href="/tools/all/">{t.pages.toolsAz}</Link>.</p>
      </header>
      <ToolHub tools={tools} cats={TOOL_CATS} />
    </div>
  );
}
