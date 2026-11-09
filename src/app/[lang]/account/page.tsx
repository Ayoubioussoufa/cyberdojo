import type { Metadata } from "next";
import { Account } from "@/components/Account";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.pages.accountTitle };
}

export default function Page() {
  return (
    <div className="page narrow">
      <Account />
    </div>
  );
}
