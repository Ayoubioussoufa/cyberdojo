"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LangProvider";

/** The parts of the Navigation API this needs. Chromium (and so the desktop app) has it; it's absent from some browsers. */
interface NavigationLike extends EventTarget {
  canGoBack: boolean;
  canGoForward: boolean;
}

/**
 * Back and forward, like a browser's toolbar. The desktop app has no toolbar of
 * its own, so these sit at the start of the command line. Each window keeps its
 * own history, and the app restores it at the next launch.
 */
export function HistoryButtons() {
  const pathname = usePathname();
  const { t } = useLang();
  const [can, setCan] = useState({ back: false, forward: false });
  const [mac, setMac] = useState(false);
  useEffect(() => {
    setMac(/Mac/i.test(navigator.userAgent));
    const nav = (window as { navigation?: NavigationLike }).navigation;
    // The desktop app tells the page what its window's history allows (desktop/main.ts), which also covers
    // pages reopened from the last launch; the Navigation API is the fallback, and can't see those.
    const fromApp = () => (window as { __cyberdojoHistory?: { back: boolean; forward: boolean } }).__cyberdojoHistory;
    const update = () => setCan(fromApp() ?? (nav ? { back: nav.canGoBack, forward: nav.canGoForward } : { back: history.length > 1, forward: true }));
    update();
    window.addEventListener("cyberdojo-history", update);
    nav?.addEventListener("currententrychange", update);
    return () => {
      window.removeEventListener("cyberdojo-history", update);
      nav?.removeEventListener("currententrychange", update);
    };
  }, [pathname]);
  const keys = mac ? ["⌘[", "⌘]"] : ["Alt+←", "Alt+→"];
  return (
    <span className="hist" role="group" aria-label={t.common.history}>
      <button type="button" className="hist-btn" disabled={!can.back} onClick={() => history.back()} aria-label={t.common.back} title={`${t.common.back} (${keys[0]})`}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
      </button>
      <button type="button" className="hist-btn" disabled={!can.forward} onClick={() => history.forward()} aria-label={t.common.forward} title={`${t.common.forward} (${keys[1]})`}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
      </button>
    </span>
  );
}
