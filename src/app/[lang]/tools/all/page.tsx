import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import TOOL_INDEX from "@/data/toolindex.json";
import { fill } from "@/i18n/lang";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.pages.azTitle };
}

interface Entry {
  name: string;
  slug: string;
  href: string;
  has?: boolean;
  from: string;
}

export default async function Page({ params }: LangParams) {
  const { t } = await strings(params);
  const list = TOOL_INDEX as Entry[];
  const guides = list.filter((x) => x.has).length;
  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">{t.nav.tools}</p>
        <h1>{t.pages.azTitle}</h1>
        <p className="lede">{fill(t.pages.azLede, { n: list.length, guides })}</p>
      </header>
      <ul className="tool-az">
        {list.map((x) => (
          <li key={x.slug} id={x.slug}>
            {x.has ? <Link href={x.href}><strong>{x.name}</strong></Link> : <a href={x.href} target="_blank" rel="noreferrer">{x.name}</a>}
          </li>
        ))}
      </ul>
    </div>
  );
}
