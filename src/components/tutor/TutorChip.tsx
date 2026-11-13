"use client";

import Link from "@/components/HoverLink";
import { fill, useLang } from "@/i18n/LangProvider";
import { jobShare, tutorReady, useTutorStatus } from "@/lib/tutor-client";

/**
 * The tutor's place in the desktop app's top bar, where the website shows the
 * account: a dot says whether it can answer, and a running setup shows its progress.
 */
export function TutorChip({ active }: { active: boolean }) {
  const { t } = useLang();
  const status = useTutorStatus();
  const job = status?.job?.state === "running" ? status.job : null;
  const ready = tutorReady(status);
  const pct = job ? Math.floor(jobShare(job) * 100) : null;
  const state = job ? "working" : ready ? "ready" : status ? "off" : "unknown";
  const label = job ? fill(t.tutor.navWorking, { pct: pct ?? 0 }) : ready ? t.tutor.navReady : t.tutor.navOff;
  return (
    <Link href={ready || job ? "/tutor/" : "/tutor/setup/"} className={`nav-user tutor-chip${active ? " on" : ""}`} data-state={state} title={label} aria-label={label} aria-current={active ? "page" : undefined}>
      <span className="tutor-dot" aria-hidden="true" />
      <span className="tutor-word">{t.tutor.launcher}</span>
      {job && pct !== null && <span className="tutor-pct">{pct}%</span>}
    </Link>
  );
}
