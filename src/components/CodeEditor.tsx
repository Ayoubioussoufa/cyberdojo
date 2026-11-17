"use client";

import { useEffect, useRef, useState } from "react";
import type { EditorHandle } from "@/lib/editor";

/**
 * Where learners type code: an IDE-style editor (src/lib/editor.ts), loaded
 * only when a page has one. Until it arrives, or if it can't load, a plain text
 * box takes its place, so the challenge always works.
 */
export function CodeEditor({ value, onChange, onRun, label }: { value: string; onChange: (text: string) => void; onRun: () => void; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorHandle | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "plain">("loading");
  // The editor is created once; these keep its callbacks pointing at the latest props.
  const latest = useRef({ onChange, onRun });
  latest.current = { onChange, onRun };

  useEffect(() => {
    let gone = false;
    import("@/lib/editor")
      .then(({ createEditor }) => {
        if (gone || !host.current) return;
        editor.current = createEditor(host.current, value, { label, onChange: (t) => latest.current.onChange(t), onRun: () => latest.current.onRun() });
        setState("ready");
      })
      .catch(() => !gone && setState("plain"));
    return () => {
      gone = true;
      editor.current?.destroy();
      editor.current = null;
    };
    // Created once per mount; later text changes arrive through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => editor.current?.set(value), [value]);

  return (
    <>
      <div ref={host} className="code-editor" hidden={state !== "ready"} />
      {state !== "ready" && (
        <textarea
          className="pyrun-code"
          value={value}
          spellCheck={false}
          rows={Math.max(6, value.split("\n").length + 1)}
          onChange={(e) => onChange(e.target.value)}
          readOnly={state === "loading"}
          aria-label={label}
        />
      )}
    </>
  );
}
