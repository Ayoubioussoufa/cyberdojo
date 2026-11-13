import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TutorSetup } from "@/components/tutor/TutorSetup";
import { strings, type LangParams } from "@/i18n/server";
import { DESKTOP } from "@/lib/desktop";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.tutor.setupTitle };
}

/** Only the desktop app has a tutor to set up. On the website this address doesn't exist. */
export default function Page() {
  if (!DESKTOP) notFound();
  return <div className="page narrow"><TutorSetup /></div>;
}
