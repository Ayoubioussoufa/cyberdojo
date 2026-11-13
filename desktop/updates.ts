/**
 * Looks for a newer CyberDojo on the project's GitHub releases. It only reads
 * the public release list: nothing about the learner is sent, and the app never
 * installs anything by itself. The learner downloads the new installer from
 * the release page, so an unsigned build is never swapped in behind their back.
 */

export interface Update {
  version: string;
  url: string;
}

/** "desktop-v1.2.0" or "v1.2.0" to [1, 2, 0]. */
export function parseVersion(tag: string): number[] | null {
  const m = /^(?:desktop-)?v?(\d+)\.(\d+)\.(\d+)$/.exec(tag.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

export function newer(a: number[], b: number[]): boolean {
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return false;
}

/**
 * The newest desktop release above `current`, or null when this is the newest.
 * Throws when the list can't be read (offline, or the repository isn't public yet).
 */
export async function findUpdate(repo: string, current: string): Promise<Update | null> {
  const api = repo.replace("https://github.com/", "https://api.github.com/repos/");
  const res = await fetch(`${api}/releases?per_page=20`, { headers: { Accept: "application/vnd.github+json", "User-Agent": "CyberDojo-desktop" }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  const releases = (await res.json()) as { tag_name: string; html_url: string; draft: boolean; prerelease: boolean }[];
  const mine = parseVersion(current);
  if (!mine) return null;
  let best: { v: number[]; tag: string; url: string } | null = null;
  for (const r of releases) {
    const v = r.draft || r.prerelease || !r.tag_name.startsWith("desktop-") ? null : parseVersion(r.tag_name);
    if (v && newer(v, mine) && (!best || newer(v, best.v))) best = { v, tag: r.tag_name, url: r.html_url };
  }
  return best ? { version: best.v.join("."), url: best.url } : null;
}
