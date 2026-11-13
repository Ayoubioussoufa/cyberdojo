import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { SignIn } from "@/components/SignIn";
import { strings, type LangParams } from "@/i18n/server";
import { DESKTOP } from "@/lib/desktop";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.pages.signInTitle };
}

export default async function Page({ params }: LangParams) {
  const { t } = await strings(params);
  return (
    <div className="page auth-page">
      <SignIn />
      {!DESKTOP && (
        <aside className="auth-app">
          <p>{t.download.signinPitch}</p>
          <Link href="/download/" className="btn">{t.download.navLabel}</Link>
        </aside>
      )}
    </div>
  );
}
