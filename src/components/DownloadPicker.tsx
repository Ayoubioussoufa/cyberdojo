"use client";

import { useEffect, useState } from "react";
import { fill, useLang } from "@/i18n/LangProvider";
import type { Lang } from "@/i18n/lang";
import type { Installer, Os, Release } from "@/lib/release";

const OS_NAME: Record<Os, string> = { windows: "Windows", mac: "macOS", linux: "Linux" };
/** The installer a system gets by default: the AppImage runs on any Linux. */
const FIRST: Record<Os, string> = { windows: "exe", mac: "dmg", linux: "AppImage" };

/** The visitor's system, from what the browser says about itself. Phones and tablets get no default. */
function detect(): Os | null {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string; mobile?: boolean } };
  if (nav.userAgentData?.mobile || /Android|iPhone|iPad|iPod/i.test(nav.userAgent)) return null;
  const p = `${nav.userAgentData?.platform ?? ""} ${nav.platform} ${nav.userAgent}`.toLowerCase();
  if (p.includes("win")) return "windows";
  if (p.includes("mac")) return "mac";
  if (p.includes("linux") || p.includes("x11")) return "linux";
  return null;
}

const mb = (lang: Lang, bytes: number) => `${new Intl.NumberFormat(lang).format(Math.round(bytes / 1e6))} ${lang === "fr" ? "Mo" : "MB"}`;

/** The big button for this computer's system, and every other installer below it. */
export function DownloadPicker({ release }: { release: Release }) {
  const { lang, t } = useLang();
  const [os, setOs] = useState<Os | null>(null);
  useEffect(() => setOs(detect()), []);
  const main: Installer | undefined = os ? release.installers.find((i) => i.os === os && i.kind === FIRST[os]) ?? release.installers.find((i) => i.os === os) : undefined;
  const rest = release.installers.filter((i) => i !== main);
  return (
    <div className="dl-pick">
      {main ? (
        <div className="dl-main">
          <a className="btn primary lg" href={main.url}>{fill(t.download.for, { os: OS_NAME[main.os] })}</a>
          <span className="muted">{fill(t.download.meta, { version: release.version, size: `.${main.kind}, ${mb(lang, main.bytes)}` })}</span>
        </div>
      ) : <p className="dl-choose">{t.download.pick}</p>}
      <ul className="dl-others" aria-label={main ? t.download.others : t.download.pick}>
        {rest.map((i) => (
          <li key={i.name}><a href={i.url}>{OS_NAME[i.os]} <span className="muted">.{i.kind}, {mb(lang, i.bytes)}</span></a></li>
        ))}
      </ul>
    </div>
  );
}
