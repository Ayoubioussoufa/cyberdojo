/**
 * Writes public/textures.css: the background textures on offer in the appearance
 * settings (src/lib/appearance.ts, TEXTURES). Every texture is CSS gradients or an
 * SVG generated here and inlined as a data: URI, so nothing loads from anywhere
 * else (the CSP allows images from 'self' and data: only). Most are used as a
 * mask over a theme colour (--ink, --link, --accent, --ok), so they follow the
 * light and dark themes and the learner's own colours.
 *
 * The random parts use a seeded generator, so the output is the same on every run:
 * `pnpm textures` rewrites the file, `pnpm textures --check` fails if it's stale.
 */
import fs from "node:fs";
import { TEXTURES } from "../src/lib/appearance";

const OUT = "public/textures.css";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r1 = (n: number) => Math.round(n * 10) / 10;
const r0 = Math.round;
/** An SVG as a data: URI, escaping only what a quoted CSS url() needs (much smaller than encodeURIComponent). */
const svg = (w: number, h: number, body: string) => {
  const text = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`;
  return `url("data:image/svg+xml,${text.replace(/%/g, "%25").replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/"/g, "%22")}")`;
};
const noise = (w: number, type: string, freq: number, octaves: number, seed: number, matrix = "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0") =>
  svg(w, w, `<filter id='n' x='0' y='0'><feTurbulence type='${type}' baseFrequency='${freq}' numOctaves='${octaves}' seed='${seed}' stitchTiles='stitch'/><feColorMatrix type='matrix' values='${matrix}'/></filter><rect width='100%' height='100%' filter='url(#n)'/>`);
/** Noise turned into alpha from its red channel: dark where the noise is low. */
const alphaFromRed = (gain: number, bias: number) => `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${gain} 0 0 0 ${bias}`;

/** A smooth field from a few sine waves, for contours and ASCII shading. */
function field(seed: number) {
  const r = rng(seed);
  const waves = Array.from({ length: 5 }, () => ({ fx: 0.004 + r() * 0.014, fy: 0.004 + r() * 0.014, p: r() * 6.3, a: 0.4 + r() * 0.6 }));
  return (x: number, y: number) => waves.reduce((s, w) => s + w.a * Math.sin(x * w.fx + y * w.fy + w.p) * Math.cos(y * w.fx * 0.7 - x * w.fy * 0.5 + w.p * 1.3), 0);
}

/** Contour lines of the field, by marching squares, as one SVG path. */
function contours(w: number, step: number, levels: number[], f: (x: number, y: number) => number) {
  const seg: string[] = [];
  for (const lv of levels) {
    for (let y = 0; y < w; y += step) {
      for (let x = 0; x < w; x += step) {
        const v = [f(x, y), f(x + step, y), f(x + step, y + step), f(x, y + step)];
        const pts: [number, number][] = [];
        const edge = (a: number, b: number, ax: number, ay: number, bx: number, by: number) => {
          if ((v[a]! < lv) !== (v[b]! < lv)) {
            const t = (lv - v[a]!) / (v[b]! - v[a]!);
            pts.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
          }
        };
        edge(0, 1, x, y, x + step, y);
        edge(1, 2, x + step, y, x + step, y + step);
        edge(2, 3, x + step, y + step, x, y + step);
        edge(3, 0, x, y + step, x, y);
        for (let i = 0; i + 1 < pts.length; i += 2) seg.push(`M${r0(pts[i]![0])} ${r0(pts[i]![1])}L${r0(pts[i + 1]![0])} ${r0(pts[i + 1]![1])}`);
      }
    }
  }
  return seg.join("");
}

function topographic() {
  const f = field(7);
  const levels = Array.from({ length: 7 }, (_, i) => -1.8 + i * 0.6);
  return svg(500, 500, `<path d='${contours(500, 14, levels, f)}' fill='none' stroke='black' stroke-width='1.2' stroke-linejoin='round'/>`);
}

/** Ordered (Bayer) dithering of a soft blob, as merged pixel runs. */
function dithered() {
  const B = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
  const n = 64;
  let d = "";
  for (let y = 0; y < n; y++) {
    let run = -1;
    for (let x = 0; x <= n; x++) {
      const dx = (x - n * 0.4) / n, dy = (y - n * 0.45) / n;
      const v = x < n ? Math.max(0, 1 - Math.hypot(dx * 1.3, dy) * 2.1) : 0;
      const on = x < n && v * 64 > (B[(y % 8) * 8 + (x % 8)] as number);
      if (on && run < 0) run = x;
      if (!on && run >= 0) {
        d += `M${run} ${y}h${x - run}v1h-${x - run}z`;
        run = -1;
      }
    }
  }
  return svg(n, n, `<path d='${d}'/>`);
}

function stippled() {
  const r = rng(11);
  let d = "";
  for (let i = 0; i < 1000; i++) {
    const x = r() * 400, y = r() * 400;
    if (r() < (x + y) / 800) continue; // denser towards the top left
    d += `M${r0(x)} ${r0(y)}h2v2h-2z`;
  }
  return svg(400, 400, `<path d='${d}'/>`);
}

function mosaic() {
  const r = rng(5);
  const shades = ["", "", "", "", ""];
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) shades[Math.floor(r() * 5)] += `M${x * 20} ${y * 20}h19v19h-19z`;
  return svg(240, 240, shades.map((d, i) => `<path fill-opacity='${0.2 + i * 0.2}' d='${d}'/>`).join(""));
}

function grass() {
  const r = rng(3);
  let d = "";
  for (let i = 0; i < 260; i++) {
    const x = r() * 400, h = 30 + r() * 110, lean = (r() - 0.5) * 40, base = 400;
    d += `M${r0(x)} ${base}Q${r0(x + lean * 0.3)} ${r0(base - h * 0.6)} ${r0(x + lean)} ${r0(base - h)}`;
  }
  return svg(400, 400, `<path d='${d}' fill='none' stroke='black' stroke-width='1.4' stroke-linecap='round'/>`);
}

function impressionist() {
  const r = rng(9);
  const hues = ["%e07a5f", "%f2cc8f", "%81b29a", "%3d85c6", "%9c89b8", "%f4a261", "%2a9d8f", "%e9c46a"].map((h) => h.replace("%", "#"));
  const groups = new Map<string, string>();
  for (let i = 0; i < 220; i++) {
    const x = r() * 500, y = r() * 500, len = 10 + r() * 22, a = r() * Math.PI;
    const key = `${hues[Math.floor(r() * hues.length)]}|${5 + Math.floor(r() * 3) * 3}`;
    groups.set(key, `${groups.get(key) ?? ""}M${r0(x)} ${r0(y)}l${r0(Math.cos(a) * len)} ${r0(Math.sin(a) * len)}`);
  }
  return svg(500, 500, [...groups].map(([k, d]) => {
    const [colour, width] = k.split("|");
    return `<path d='${d}' stroke='${colour}' stroke-width='${width}' stroke-linecap='round'/>`;
  }).join(""));
}

function ascii() {
  const f = field(21);
  const ramp = " .:-=+*#%@";
  let rows = "";
  for (let y = 0; y < 30; y++) {
    let line = "";
    for (let x = 0; x < 48; x++) {
      const v = (f(x * 12, y * 20) + 2.5) / 5;
      line += ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(v * ramp.length)))];
    }
    rows += `<text x='0' y='${y * 20 + 15}'>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>`;
  }
  return svg(576, 600, `<g font-family='monospace' font-size='16' xml:space='preserve'>${rows}</g>`);
}

function lens() {
  const w = 800, c = w / 2, k = 0.000002;
  const warp = (x: number, y: number): [number, number] => {
    const dx = x - c, dy = y - c, s = 1 + k * (dx * dx + dy * dy);
    return [c + dx * s, c + dy * s];
  };
  let d = "";
  for (let i = -7; i <= 7; i++) {
    const p = c + i * 56;
    let h = "", v = "";
    for (let t = -40; t <= w + 40; t += 40) {
      const [hx, hy] = warp(t, p), [vx, vy] = warp(p, t);
      h += `${h ? "L" : "M"}${r0(hx)} ${r0(hy)}`;
      v += `${v ? "L" : "M"}${r0(vx)} ${r0(vy)}`;
    }
    d += h + v;
  }
  return svg(w, w, `<path d='${d}' fill='none' stroke='black' stroke-width='1.2'/>`);
}

function landscape() {
  const r = rng(13);
  const ridge = (base: number, amp: number, opacity: number) => {
    let d = `M0 300`;
    for (let x = 0; x <= 1200; x += 40) d += `L${x} ${r1(base - Math.abs(Math.sin(x / (90 + r() * 60))) * amp - r() * amp * 0.3)}`;
    return `<path d='${d}L1200 300Z' fill-opacity='${opacity}'/>`;
  };
  return svg(1200, 300, ridge(150, 110, 0.35) + ridge(200, 80, 0.6) + ridge(250, 50, 1));
}

/** Each texture's rules, applied to the page's backdrop and to the preview swatches alike. */
const RULES: Record<string, string> = {
  "thermal-gradient": `background: radial-gradient(55% 45% at 15% 20%, #ff3d3d, transparent 70%), radial-gradient(45% 55% at 85% 25%, #ffb000, transparent 70%), radial-gradient(60% 55% at 65% 90%, #2f4bff, transparent 70%), radial-gradient(40% 40% at 25% 80%, #00d1ff, transparent 70%); filter: blur(30px); opacity: .22;`,
  "fluted-glass": `background: repeating-linear-gradient(90deg, transparent 0 4px, color-mix(in srgb, var(--surface) 90%, white) 7px, color-mix(in srgb, var(--ink) 55%, transparent) 13px, transparent 18px), linear-gradient(120deg, var(--link), var(--accent)); opacity: .14;`,
  "water-caustics": `background: var(--link); mask: ${noise(420, "turbulence", 0.011, 2, 4, alphaFromRed(-5, 1.7))} 0 0/420px 420px; opacity: .2;`,
  halftone: `background: radial-gradient(circle, var(--ink) 34%, transparent 36%) 0 0/11px 11px; mask: radial-gradient(120% 90% at 0% 0%, black, transparent 70%); opacity: .16;`,
  "monochrome-landscape": `background: var(--ink); mask: ${landscape()} bottom/100% auto no-repeat; opacity: .14;`,
  "blueprint-grid": `background: linear-gradient(var(--link) 2px, transparent 2px) 0 0/96px 96px, linear-gradient(90deg, var(--link) 2px, transparent 2px) 0 0/96px 96px, linear-gradient(color-mix(in srgb, var(--link) 45%, transparent) 1px, transparent 1px) 0 0/24px 24px, linear-gradient(90deg, color-mix(in srgb, var(--link) 45%, transparent) 1px, transparent 1px) 0 0/24px 24px; opacity: .2;`,
  "felt-texture": `background: var(--ink); mask: ${noise(260, "fractalNoise", 0.9, 4, 2, alphaFromRed(1.6, -0.55))} 0 0/260px 260px; opacity: .12;`,
  "dithered-image": `background: var(--accent); mask: ${dithered()} 0 0/384px 384px; image-rendering: pixelated; opacity: .16;`,
  "grainy-gradient": `background: linear-gradient(135deg, var(--accent), var(--link) 55%, var(--ok)); mask: ${noise(240, "fractalNoise", 0.85, 3, 8, alphaFromRed(2.2, -0.6))} 0 0/240px 240px; opacity: .26;`,
  "paper-texture": `background: var(--ink); mask: ${noise(360, "fractalNoise", 0.04, 5, 6, alphaFromRed(1.2, -0.35))} 0 0/360px 360px; opacity: .1;`,
  "topographic-lines": `background: var(--ink); mask: ${topographic()} 0 0/500px 500px; opacity: .14;`,
  "grass-texture": `background: var(--ok); mask: ${grass()} 0 100%/400px 400px repeat-x; opacity: .2;`,
  "noise-texture": `background: var(--ink); mask: ${noise(200, "fractalNoise", 0.75, 3, 1, alphaFromRed(1.8, -0.6))} 0 0/200px 200px; opacity: .1;`,
  "impressionist-painting": `background: ${impressionist()} 0 0/500px 500px; filter: blur(1.5px); opacity: .16;`,
  "dot-matrix": `background: radial-gradient(circle, var(--ink) 1.3px, transparent 1.8px) 0 0/10px 10px; opacity: .16;`,
  "cloudy-sky": `background: linear-gradient(var(--link), var(--surface)); mask: ${noise(700, "fractalNoise", 0.005, 5, 12, alphaFromRed(2.4, -0.9))} 0 0/700px 700px; opacity: .22;`,
  "pixel-mosaic": `background: var(--accent); mask: ${mosaic()} 0 0/240px 240px; opacity: .1;`,
  "blurred-photo": `background: radial-gradient(30% 35% at 20% 30%, #f4a261, transparent 70%), radial-gradient(35% 30% at 75% 20%, #2a9d8f, transparent 70%), radial-gradient(30% 40% at 60% 75%, #e76f51, transparent 70%), radial-gradient(25% 25% at 30% 85%, #8ab17d, transparent 70%); filter: blur(55px); opacity: .3;`,
  "stippled-gradient": `background: var(--ink); mask: ${stippled()} 0 0/400px 400px; opacity: .2;`,
  "lens-distortion": `background: var(--ink); mask: ${lens()} center/cover no-repeat; opacity: .12;`,
  "ascii-art": `background: var(--ink); mask: ${ascii()} 0 0/576px 600px; opacity: .08;`,
  "iridescent-3d": `background: radial-gradient(40% 40% at 30% 30%, rgb(255 255 255 / 55%), transparent 60%), conic-gradient(from 200deg at 60% 55%, #ff6ec7, #7873f5, #4ade80, #facc15, #ff6ec7); filter: blur(40px) saturate(1.3); opacity: .18;`,
};

const ids = TEXTURES.map((t) => t.id).filter((id) => id !== "none");
const missing = ids.filter((id) => !RULES[id]);
if (missing.length) throw new Error(`no rules for: ${missing.join(", ")}`);

const css = `/* Generated by scripts/textures.ts. Don't edit by hand: run \`pnpm textures\`. */
/* Loaded only when a texture is chosen (src/lib/appearance.ts). Drawn behind the page, never behind text boxes. */
:root[data-texture] body { isolation: isolate; }
:root[data-texture] body::before { content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none; }
.tex-swatch { position: relative; overflow: hidden; isolation: isolate; background: var(--bg); }
/* A preview draws twice the area, scaled down, so a small tile shows the pattern, not one corner of it. */
.tex-swatch::before { content: ""; position: absolute; top: 0; left: 0; width: 200%; height: 200%; transform: scale(.5); transform-origin: 0 0; z-index: -1; pointer-events: none; }
${ids.map((id) => `:root[data-texture="${id}"] body::before, .tex-swatch[data-tex="${id}"]::before { ${RULES[id]} }`).join("\n")}
@media (prefers-reduced-transparency: reduce) { :root[data-texture] body::before { display: none; } }
`;

if (process.argv.includes("--check")) {
  const now = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (now !== css) {
    console.error(`✗ ${OUT} is out of date: run pnpm textures`);
    process.exit(1);
  }
  console.log(`✓ textures: ${ids.length} textures, ${(css.length / 1024).toFixed(1)} KB, up to date`);
} else {
  fs.writeFileSync(OUT, css);
  console.log(`wrote ${OUT}: ${ids.length} textures, ${(css.length / 1024).toFixed(1)} KB`);
}
