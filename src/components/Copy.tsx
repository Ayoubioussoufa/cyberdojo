"use client";

import { useState } from "react";
import { DESKTOP } from "@/lib/desktop";
import { copyText } from "@/lib/tutor";
import { askTutor } from "@/lib/tutor-client";
import type { Mode } from "@/lib/tutor-types";
import { useLang } from "@/i18n/LangProvider";

/**
 * A button that copies a message built at click time, so it's always current.
 * In the desktop app the same message goes straight to the built-in tutor,
 * and `mode` says what kind of help it asks for.
 */
export function CopyButton({
  build,
  label,
  className = "btn",
  done,
  mode = "review",
}: {
  build: () => string;
  label: string;
  className?: string;
  done?: string;
  mode?: Mode;
}) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  const { t } = useLang();
  return (
    <button
      type="button"
      className={`${className}${state === "ok" ? " is-ok" : ""}`}
      onClick={async () => {
        if (DESKTOP) askTutor(build(), mode);
        const ok = DESKTOP || (await copyText(build()));
        setState(ok ? "ok" : "fail");
        window.setTimeout(() => setState("idle"), 2200);
      }}
    >
      <span aria-live="polite">{DESKTOP ? (state === "ok" ? t.tutor.sent : t.tutor.ask) : state === "ok" ? (done ?? t.copy.done) : state === "fail" ? t.copy.fail : label}</span>
    </button>
  );
}
