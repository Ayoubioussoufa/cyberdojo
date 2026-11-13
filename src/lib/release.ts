/**
 * The desktop app's latest release, read from the project's GitHub releases,
 * where .github/workflows/desktop.yml publishes the installers for a tag such
 * as desktop-v0.2.0. The download page is rebuilt from it every few minutes.
 */
import pkg from "../../package.json";

export type Os = "windows" | "mac" | "linux";

export interface Installer {
  os: Os;
  /** What the learner picks between on one system: "exe", "dmg", "AppImage", "deb". */
  kind: string;
  name: string;
  url: string;
  bytes: number;
}

export interface Release {
  version: string;
  publishedAt: string;
  page: string;
  installers: Installer[];
  /** The file listing every installer's SHA-256. */
  checksums: string | null;
}

/** "https://github.com/owner/repo", from package.json. */
export const REPO = (pkg as { repository?: string }).repository ?? "";
export const RELEASES = `${REPO}/releases`;

/** Which installer each file is. The Mac's zip is for updates, not for a first install, so it isn't offered. */
export function classify(name: string): Pick<Installer, "os" | "kind"> | null {
  if (/\.exe$/i.test(name)) return { os: "windows", kind: "exe" };
  if (/\.dmg$/i.test(name)) return { os: "mac", kind: "dmg" };
  if (/\.AppImage$/.test(name)) return { os: "linux", kind: "AppImage" };
  if (/\.deb$/i.test(name)) return { os: "linux", kind: "deb" };
  return null;
}

interface GitHubRelease {
  tag_name: string;
  html_url: string;
  published_at: string;
  draft: boolean;
  prerelease: boolean;
  assets: { name: string; size: number; browser_download_url: string }[];
}

/** Picks the newest published desktop release from GitHub's list. */
export function pickRelease(list: GitHubRelease[]): Release | null {
  const r = list.find((x) => !x.draft && !x.prerelease && /^desktop-v\d+\.\d+\.\d+$/.test(x.tag_name));
  if (!r) return null;
  const installers = r.assets.flatMap((a) => {
    const kind = classify(a.name);
    return kind ? [{ ...kind, name: a.name, url: a.browser_download_url, bytes: a.size }] : [];
  });
  if (!installers.length) return null;
  return {
    version: r.tag_name.replace(/^desktop-v/, ""),
    publishedAt: r.published_at,
    page: r.html_url,
    installers,
    checksums: r.assets.find((a) => a.name === "SHA256SUMS.txt")?.browser_download_url ?? null,
  };
}

/** Null when there's no release yet or GitHub can't be reached: the page then points to the releases page. */
export async function latestRelease(): Promise<Release | null> {
  const api = REPO.replace("https://github.com/", "https://api.github.com/repos/");
  if (!api.startsWith("https://api.github.com/repos/")) return null;
  try {
    const res = await fetch(`${api}/releases?per_page=10`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "CyberDojo-site", ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? pickRelease((await res.json()) as GitHubRelease[]) : null;
  } catch {
    return null;
  }
}
