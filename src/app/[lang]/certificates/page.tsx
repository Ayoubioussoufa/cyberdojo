import type { Metadata } from "next";
import { Certificates } from "@/components/Certificates";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { t } = await strings(params);
  return { title: t.cert.pageTitle };
}

export default async function Page({ params }: LangParams) {
  const { t } = await strings(params);
  return (
    <div className="page">
      <h1>{t.cert.pageTitle}</h1>
      <p className="lede">{t.cert.pageLede}</p>
      <Certificates />
    </div>
  );
}
