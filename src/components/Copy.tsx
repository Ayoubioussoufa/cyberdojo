"use client";

import { useState } from "react";
import { copyText } from "@/lib/tutor";
import { useLang } from "@/i18n/LangProvider";

/** A button that copies a message built at click time, so it's always current. */
export function CopyButton({
  build,
  label,
  className = "btn",
  done,
}: {
  build: () => string;
  label: string;
  className?: string;
  done?: string;
}) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  const { t } = useLang();
  return (
    <button
      type="button"
      className={`${className}${state === "ok" ? " is-ok" : ""}`}
      onClick={async () => {
        const ok = await copyText(build());
        setState(ok ? "ok" : "fail");
        window.setTimeout(() => setState("idle"), 2200);
      }}
    >
      <span aria-live="polite">{state === "ok" ? (done ?? t.copy.done) : state === "fail" ? t.copy.fail : label}</span>
    </button>
  );
}
