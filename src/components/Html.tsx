"use client";

import { useRouter } from "next/navigation";
import { memo, useEffect, useRef } from "react";
import { useLang } from "@/i18n/LangProvider";
import { localizeHtml } from "@/i18n/lang";

/** Trusted course HTML: copy buttons on code, client navigation, in-page links. */
export const Html = memo(function Html({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { lang, t } = useLang();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".pre-copy")) return;
      const code = pre.textContent ?? "";
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pre-copy";
      b.textContent = t.common.copy;
      b.addEventListener("click", () => {
        void navigator.clipboard?.writeText(code.trimEnd()).then(() => {
          b.textContent = t.common.copied;
          window.setTimeout(() => (b.textContent = t.common.copy), 1200);
        });
      });
      pre.appendChild(b);
    });
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest("a");
      const href = a?.getAttribute("href");
      if (!a || !href?.startsWith("/") || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      router.push(href);
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [router, t]);

  return <div ref={ref} className="prose" dangerouslySetInnerHTML={{ __html: localizeHtml(html, lang) }} />;
});
