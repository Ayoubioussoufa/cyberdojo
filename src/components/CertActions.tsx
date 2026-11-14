"use client";

import { useState } from "react";
import { useLang } from "@/i18n/LangProvider";

/** Print (or save as PDF) and copy-the-link, for a certificate page. */
export function CertActions() {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // No clipboard: the address bar still holds the link.
    }
  };
  return (
    <p className="cert-actions">
      <button type="button" className="btn primary" onClick={() => window.print()}>{t.cert.print}</button>
      <button type="button" className="btn" onClick={() => void copy()}>{copied ? t.common.copiedCap : t.cert.copyLink}</button>
    </p>
  );
}
