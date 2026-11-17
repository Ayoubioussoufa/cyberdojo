"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LangProvider";
import { localize } from "@/i18n/lang";
import { previousPage } from "@/lib/previous-page";

/**
 * Back to the page the learner came from. The desktop app has no back button of
 * its own, so a page reached from the middle of a lesson (the tutor's settings,
 * the tutor itself) always offers the way back. With nothing before it, it goes home.
 */
export function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { lang, t } = useLang();
  // Read after mount: the server can't know the tab's history, and both renders must match.
  const [prev, setPrev] = useState<string | null | undefined>(undefined);
  useEffect(() => setPrev(previousPage(pathname)), [pathname]);
  if (prev === undefined) return <span className={`back-btn ${className}`} aria-hidden="true" />;
  const go = () => {
    if (prev && window.history.length > 1) router.back();
    else router.push(prev ?? localize("/", lang));
  };
  return (
    <button type="button" className={`back-btn ${className}`} onClick={go} title={prev ?? undefined}>
      <span aria-hidden="true">←</span>{prev ? t.common.back : t.common.backHome}
    </button>
  );
}
