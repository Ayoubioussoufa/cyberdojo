"use client";

import { useState } from "react";
import { copyText } from "@/lib/tutor";

/** A button that copies a message built at click time, so it's always current. */
export function CopyButton({
  build,
  label,
  className = "btn",
  done = "Copied. Paste it into your AI",
}: {
  build: () => string;
  label: string;
  className?: string;
  done?: string;
}) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
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
      <span aria-live="polite">{state === "ok" ? done : state === "fail" ? "Couldn't copy" : label}</span>
    </button>
  );
}
