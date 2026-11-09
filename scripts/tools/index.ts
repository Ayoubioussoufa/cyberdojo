/**
 * Builds the A to Z of tools and tools/README.md.
 *
 * sources.json is a dated snapshot of Kali's catalogue and of ATT&CK's tool list,
 * so anyone can see how much of the outside world has a guide here. Refresh it by
 * hand: nothing here touches the network. Run with --check to fail if files are stale.
 */
import fs from "node:fs";
import { TOOL_CATS } from "../../src/data/toolcats";
import { toolDocs } from "../../src/lib/content";
import SOURCES from "./sources.json";

interface Entry {
  name: string;
  slug: string;
  href: string;
  has?: boolean;
  from: string;
}

const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const guides = toolDocs();
const byName = new Map<string, (typeof guides)[number]>();
for (const d of guides) for (const n of [d.meta.title, d.meta.slug, d.meta.kali ?? "", ...(d.meta.aka ?? [])]) if (n) byName.set(key(n), d);

const entries = new Map<string, Entry>();
for (const d of guides) entries.set(d.meta.slug, { name: d.meta.title, slug: d.meta.slug, href: `/tools/${d.meta.slug}/`, has: true, from: "guide" });
const add = (name: string, href: string, from: string) => {
  const hit = byName.get(key(name));
  if (hit) return;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!entries.has(slug)) entries.set(slug, { name, slug, href, from });
};
for (const a of SOURCES.attack) add(a.name, `https://attack.mitre.org/software/${a.id}/`, "ATT&CK");
for (const k of SOURCES.kali) add(k, `https://www.kali.org/tools/${k}/`, "Kali");

const list = [...entries.values()].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
const has = (n: string) => byName.has(key(n));
const count = (names: string[]) => names.filter(has).length;
const top10 = SOURCES.kaliCategories.top10;
const seen = SOURCES.attack.filter((a) => a.groups >= 2);

const md = [
  "# Tools",
  "",
  "<!-- Written by scripts/tools/index.ts. Edit the tool pages, then run pnpm audit:tools. -->",
  "",
  `${guides.length} tool guides, plus an A to Z of ${list.length} names at [/tools/all/](../src/app/[lang]/tools/all/page.tsx).`,
  "",
  "Every guide says what the tool is for and how it works, then what defenders see. How much it shows depends on its `use` field:",
  "",
  "| Use | Meaning | Commands |",
  "|---|---|---|",
  "| `open` | Defensive or everyday tools | Full usage |",
  "| `own` | Recon, scanning and audit | Usage aimed at your own lab or domain |",
  "| `know` | Attack tools | None. How it works, how to detect it, and where to practise legally |",
  "",
  `## Measured against outside lists (snapshot ${SOURCES.fetched})`,
  "",
  "| List | Size | With a guide here |",
  "|---|---|---|",
  `| Kali top 10 | ${top10.length} | ${count(top10)} |`,
  `| ATT&CK tools seen with 2 or more groups or campaigns | ${seen.length} | ${count(seen.map((a) => a.name))} |`,
  ...Object.entries(SOURCES.kaliCategories)
    .filter(([c, v]) => v.length >= 8 && c !== "top10")
    .sort()
    .map(([c, v]) => `| Kali ${c} | ${v.length} | ${count(v)} |`),
  "",
  ...TOOL_CATS.flatMap((c) => {
    const mine = guides.filter((d) => d.meta.category === c.folder);
    return [`## ${c.title}`, "", c.blurb, "", ...mine.map((d) => `- [${d.meta.title}](${c.folder}/${d.meta.slug}.md) (${d.meta.use}): ${d.meta.summary}`), ""];
  }),
].join("\n");

const json = `${JSON.stringify(list)}\n`;
const targets: [string, string][] = [["src/data/toolindex.json", json], ["tools/README.md", md]];
if (process.argv.includes("--check")) {
  const stale = targets.filter(([f, text]) => !fs.existsSync(f) || fs.readFileSync(f, "utf8") !== text).map(([f]) => f);
  const missing = top10.filter((t) => !has(t));
  if (missing.length) console.error(`Kali top 10 with no guide: ${missing.join(", ")}`);
  if (stale.length) console.error(`Stale, run pnpm audit:tools: ${stale.join(", ")}`);
  if (stale.length || missing.length) process.exit(1);
  console.log(`${guides.length} tool guides, ${list.length} names in the A to Z.`);
} else {
  for (const [f, text] of targets) fs.writeFileSync(f, text);
  console.log(`${guides.length} guides. A to Z: ${list.length}. Kali top 10: ${count(top10)}/${top10.length}. ATT&CK seen twice or more: ${count(seen.map((a) => a.name))}/${seen.length}.`);
}
