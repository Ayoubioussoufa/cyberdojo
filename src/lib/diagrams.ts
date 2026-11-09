/**
 * Small diagrams written in plain text inside a document. Each returns HTML
 * or SVG drawn with the theme's colours, so it works in both themes and on a phone.
 *
 *   @seq Client | Server        a sequence of messages, one per line:
 *   Client > Server: SYN
 *
 *   @stack                      layers, top first: Name | detail | note
 *   Application | HTTP, DNS | your data
 *
 *   @pyramid                    a pyramid, top first: Name | note
 *
 *   @bits 26 192.168.10.140     an address split into network and host bits
 *   @perm rwxr-x---             a permission string, explained
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function seqSvg(head: string, rows: string[], fr = false): string {
  const names = head.split("|").map((s) => s.trim());
  const w = names.length > 2 ? 560 : 460;
  const pad = 62;
  const x = (i: number) => pad + (i * (w - pad * 2)) / Math.max(names.length - 1, 1);
  const top = 44;
  const gap = 46;
  const h = top + rows.length * gap + 16;
  const out: string[] = [];
  names.forEach((n, i) => {
    out.push(`<rect x="${x(i) - 56}" y="4" width="112" height="28" rx="6" class="d-box"/><text x="${x(i)}" y="23" class="d-name" text-anchor="middle">${esc(n)}</text>`);
    out.push(`<line x1="${x(i)}" y1="32" x2="${x(i)}" y2="${h - 6}" class="d-life"/>`);
  });
  const parsed = rows.map((r) => {
    const m = /^(.+?)\s*>\s*(.+?):\s*(.*)$/.exec(r);
    if (!m) throw new Error(`bad @seq line: ${r}`);
    const a = names.indexOf((m[1] as string).trim());
    const b = names.indexOf((m[2] as string).trim());
    if (a < 0 || b < 0) throw new Error(`@seq: unknown name in: ${r}`);
    return { a, b, text: m[3] as string };
  });
  parsed.forEach(({ a, b, text }, i) => {
    const y = top + i * gap + 26;
    const dir = b > a ? 1 : -1;
    const x1 = x(a);
    const x2 = x(b) - dir * 2;
    out.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" class="d-arrow"/><path d="M${x2} ${y} l${-dir * 9} -5 v10 z" class="d-head"/>`);
    out.push(`<text x="${(x(a) + x(b)) / 2}" y="${y - 8}" class="d-label" text-anchor="middle">${esc(text)}</text>`);
  });
  const label = parsed.map((p) => (fr ? `${names[p.a]} vers ${names[p.b]} : ${p.text}` : `${names[p.a]} to ${names[p.b]}: ${p.text}`)).join(". ");
  return `<figure class="diagram noterms"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${out.join("")}</svg></figure>`;
}

export function stackHtml(rows: string[]): string {
  const cells = rows.map((r) => {
    const [name, detail, note] = r.split("|").map((s) => s.trim());
    return `<div class="stack-row"><strong>${esc(name ?? "")}</strong><span>${esc(detail ?? "")}</span>${note ? `<em>${esc(note)}</em>` : ""}</div>`;
  });
  return `<div class="stack noterms">${cells.join("")}</div>`;
}

export function pyramidHtml(rows: string[]): string {
  const n = rows.length;
  const cells = rows.map((r, i) => {
    const [name, note] = r.split("|").map((s) => s.trim());
    const width = 34 + (66 * i) / Math.max(n - 1, 1);
    const tone = Math.round(90 - (65 * i) / Math.max(n - 1, 1));
    return `<div class="pyr-row"><div class="pyr-bar" style="width:${width}%;background:color-mix(in srgb, var(--accent) ${tone}%, var(--surface))"><strong class="${tone > 55 ? "on-accent" : ""}">${esc(name ?? "")}</strong></div>${note ? `<span>${esc(note)}</span>` : ""}</div>`;
  });
  return `<div class="pyramid noterms">${cells.join("")}</div>`;
}

export function bitsHtml(prefix: number, ip: string, fr = false): string {
  const octets = ip.split(".").map(Number);
  const bits = octets.map((o) => o.toString(2).padStart(8, "0")).join("");
  const cell = (b: string, i: number) => `<span class="${i < prefix ? "net" : "host"}">${b}</span>`;
  // Each byte stays whole, so that a narrow screen wraps between bytes.
  const cells = [0, 8, 16, 24].map((o) => `<span class="octet">${[...bits.slice(o, o + 8)].map((b, i) => cell(b, o + i)).join("")}</span>`);
  const label = fr ? `${esc(ip)} avec ${prefix} bits de réseau et ${32 - prefix} bits d'hôte` : `${esc(ip)} with ${prefix} network bits and ${32 - prefix} host bits`;
  const net = fr ? `Réseau : ${prefix} bits` : `Network: ${prefix} bits`;
  const host = fr ? `Hôte : ${32 - prefix} bits` : `Host: ${32 - prefix} bits`;
  return `<figure class="bits noterms" aria-label="${label}"><div class="bit-row">${cells.join("")}</div><figcaption><span class="net-key">${net}</span> <span class="host-key">${host}</span></figcaption></figure>`;
}

export function permHtml(mode: string, fr = false): string {
  if (!/^[rwx-]{9}$/.test(mode)) throw new Error(`bad @perm: ${mode}`);
  const w = fr ? { owner: "Propriétaire", group: "Groupe", others: "Autres", read: "lire", write: "écrire", run: "exécuter", nothing: "rien" } : { owner: "Owner", group: "Group", others: "Others", read: "read", write: "write", run: "run", nothing: "nothing" };
  const groups = [
    [w.owner, mode.slice(0, 3)],
    [w.group, mode.slice(3, 6)],
    [w.others, mode.slice(6, 9)],
  ] as const;
  const digit = (t: string) => (t[0] === "r" ? 4 : 0) + (t[1] === "w" ? 2 : 0) + (t[2] === "x" ? 1 : 0);
  const cells = groups.map(([who, t]) => {
    const parts = [t[0] === "r" ? w.read : "", t[1] === "w" ? w.write : "", t[2] === "x" ? w.run : ""].filter(Boolean).join(", ") || w.nothing;
    return `<div class="perm-cell"><span class="perm-who">${who}</span><code>${t}</code><span class="perm-num">${digit(t)}</span><span class="perm-can">${parts}</span></div>`;
  });
  return `<div class="perm noterms">${cells.join("")}</div>`;
}
