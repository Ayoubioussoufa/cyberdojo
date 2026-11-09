import type { Metadata } from "next";
import { SignIn } from "@/components/SignIn";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.pages.signInTitle };
}

export default function Page() {
  return (
    <div className="page auth-page">
      <SignIn />
    </div>
  );
}
