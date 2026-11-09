"use client";

import Link from "@/components/HoverLink";
import { useLang } from "@/i18n/LangProvider";

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="page">
      <header className="page-head">
        <h1>{t.common.notFoundTitle}</h1>
        <p className="lede">{t.common.notFoundText}</p>
      </header>
      <p><Link className="btn primary" href="/">{t.common.notFoundHome}</Link></p>
    </div>
  );
}
