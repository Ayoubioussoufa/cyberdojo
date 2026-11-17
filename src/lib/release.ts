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
  assets: { name: string; size: number; browser_download_url: string; download_count?: number }[];
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

/** GitHub's list of releases, newest first, or null when it can't be reached. */
async function releases(perPage: number, revalidate: number): Promise<GitHubRelease[] | null> {
  const api = REPO.replace("https://github.com/", "https://api.github.com/repos/");
  if (!api.startsWith("https://api.github.com/repos/")) return null;
  try {
    const res = await fetch(`${api}/releases?per_page=${perPage}`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "CyberDojo-site", ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
      next: { revalidate },
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? ((await res.json()) as GitHubRelease[]) : null;
  } catch {
    return null;
  }
}

/** Null when there's no release yet or GitHub can't be reached: the page then points to the releases page. */
export async function latestRelease(): Promise<Release | null> {
  const list = await releases(10, 600);
  return list ? pickRelease(list) : null;
}

export interface Downloads {
  total: number;
  byOs: Record<Os, number>;
  releases: { version: string; publishedAt: string; total: number; files: { name: string; os: Os; kind: string; count: number }[] }[];
}

/**
 * How many times each installer was downloaded, as GitHub counts it. Only the
 * installers count: the checksums and the update manifests are fetched by the
 * app itself. An installed app that updates itself downloads the new installer
 * too, so updates are part of these figures.
 */
export function countDownloads(list: GitHubRelease[]): Downloads {
  const out: Downloads = { total: 0, byOs: { windows: 0, mac: 0, linux: 0 }, releases: [] };
  for (const r of list) {
    if (r.draft || !/^desktop-v\d+\.\d+\.\d+$/.test(r.tag_name)) continue;
    const files = r.assets.flatMap((a) => {
      const kind = classify(a.name);
      return kind ? [{ name: a.name, ...kind, count: a.download_count ?? 0 }] : [];
    });
    const total = files.reduce((n, f) => n + f.count, 0);
    for (const f of files) out.byOs[f.os] += f.count;
    out.total += total;
    out.releases.push({ version: r.tag_name.replace(/^desktop-v/, ""), publishedAt: r.published_at, total, files });
  }
  return out;
}

/** Null when GitHub can't be reached. Kept for five minutes, so the admin page doesn't spend GitHub's hourly allowance. */
export async function downloadCounts(): Promise<Downloads | null> {
  const list = await releases(100, 300);
  return list ? countDownloads(list) : null;
}
