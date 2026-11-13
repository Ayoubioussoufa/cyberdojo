"use client";

import Link from "@/components/HoverLink";
import { fill, useLang } from "@/i18n/LangProvider";
import { jobShare } from "@/lib/tutor-client";
import type { TutorStatus } from "@/lib/tutor-types";

/** Why the tutor can't answer yet, and the way to the setup page. Shown in the panel and on the tutor's page. */
export function TutorOff({ status }: { status: TutorStatus }) {
  const { t } = useLang();
  const share = status.job?.state === "running" ? jobShare(status.job) : null;
  return (
    <div className="tutor-off">
      <p>{share !== null ? fill(t.tutor.navWorking, { pct: Math.floor(share * 100) }) : status.ollama.running ? t.tutor.offModel : t.tutor.offOllama}</p>
      <Link href="/tutor/setup/" className="btn primary sm">{share !== null ? t.tutor.seeProgress : t.tutor.openSetup}</Link>
    </div>
  );
}
