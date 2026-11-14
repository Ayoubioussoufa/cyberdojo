import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BELTS } from "@/data/path";
import { CertActions } from "@/components/CertActions";
import { certById } from "@/server/certs";
import { fill } from "@/i18n/lang";
import { strings, type LangParams } from "@/i18n/server";

// A certificate's id isn't known at build time, so this page is rendered on demand.
export const dynamic = "force-dynamic";

type Props = LangParams<{ id: string }>;

export const metadata: Metadata = { title: "Certificate", robots: { index: false, follow: false } };

export default async function Page({ params }: Props) {
  const { id } = await params;
  const { lang, t } = await strings(params);
  const cert = await certById(id);
  if (!cert || cert.belt < 1 || cert.belt >= BELTS.length) notFound();
  const belt = BELTS[cert.belt] as (typeof BELTS)[number];
  const date = new Date(cert.issuedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="page cert-page">
      <article className="cert" style={{ ["--belt" as string]: belt.colour }}>
        <div className="cert-top" aria-hidden />
        <p className="cert-brand">CyberDojo</p>
        <p className="cert-kicker">{t.cert.awards}</p>
        <h1 className="cert-name">{cert.name}</h1>
        <p className="cert-earned">{t.cert.hasEarned}</p>
        <p className="cert-belt" style={{ color: belt.colour }}>{belt.name}</p>
        <p className="cert-meaning">{belt.meaning}</p>
        <p className="cert-date">{date}</p>
        <p className="cert-verify">{fill(t.cert.verify, { id: cert.id })}</p>
      </article>
      <CertActions />
    </div>
  );
}
