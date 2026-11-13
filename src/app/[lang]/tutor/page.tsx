import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TutorPage } from "@/components/tutor/TutorPage";
import { strings, type LangParams } from "@/i18n/server";
import { DESKTOP } from "@/lib/desktop";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.tutor.chatTitle };
}

/** The tutor on its own page, desktop app only. On the website this address doesn't exist. */
export default function Page() {
  if (!DESKTOP) notFound();
  return <TutorPage />;
}
