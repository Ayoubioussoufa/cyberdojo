"use client";

import { useLang } from "@/i18n/LangProvider";

/** Prints the page; the print styles strip everything but the sheet. */
export function PrintButton() {
  const { t } = useLang();
  return (
    <button type="button" className="btn primary sheet-print" onClick={() => window.print()}>
      {t.misc.print}
    </button>
  );
}
