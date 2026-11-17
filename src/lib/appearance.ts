/**
 * Appearance settings: the reading font, the code font, and the page and
 * section backgrounds, chosen on the account page and kept per account
 * (the database, through /api/prefs) with a copy in this browser so the page
 * paints in the right colours before anything loads.
 *
 * Shared by the browser and the server, which apply the same rules:
 * - fonts come from a fixed list of fonts the site serves itself, so no name
 *   typed by anyone ever reaches CSS;
 * - a colour is accepted only as #rrggbb and only if the theme's text stays
 *   readable on it (WCAG contrast), so nobody can lock themselves out of the page;
 * - colours are applied as CSS variables through style.setProperty, never as
 *   CSS text, so there is nothing to inject.
 */

export const FONTS = [
  { id: "atkinson", label: "Atkinson Hyperlegible", stack: '"Atkinson Hyperlegible Next Variable", "Atkinson Hyperlegible", "Segoe UI", system-ui, sans-serif' },
  { id: "inter", label: "Inter", stack: '"Inter Variable", "Segoe UI", system-ui, sans-serif' },
  { id: "lexend", label: "Lexend", stack: '"Lexend Variable", "Segoe UI", system-ui, sans-serif' },
  { id: "opendyslexic", label: "OpenDyslexic", stack: '"OpenDyslexic", "Segoe UI", system-ui, sans-serif' },
  { id: "serif", label: "Source Serif 4", stack: '"Source Serif 4 Variable", Georgia, "Times New Roman", serif' },
  { id: "system", label: "System", stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
] as const;

export const CODE_FONTS = [
  { id: "martian", label: "Martian Mono", stack: '"Martian Mono Variable", ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace' },
  { id: "jetbrains", label: "JetBrains Mono", stack: '"JetBrains Mono Variable", ui-monospace, Menlo, Consolas, monospace' },
  { id: "fira", label: "Fira Code", stack: '"Fira Code Variable", ui-monospace, Menlo, Consolas, monospace' },
  { id: "system", label: "System", stack: 'ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace' },
] as const;

export type FontId = (typeof FONTS)[number]["id"];
export type CodeFontId = (typeof CODE_FONTS)[number]["id"];
export type Theme = "dark" | "light";
export interface Colours {
  bg: string | null;
  surface: string | null;
}
export interface Prefs {
  font: FontId;
  code: CodeFontId;
  dark: Colours;
  light: Colours;
}

export const DEFAULT_PREFS: Prefs = { font: "atkinson", code: "martian", dark: { bg: null, surface: null }, light: { bg: null, surface: null } };

/**
 * The text colours each theme draws on a background, from globals.css
 * (scripts/check-appearance.ts fails if the two drift apart), with the contrast
 * each must keep: 4.5 for body text, 3 for the rest (WCAG AA).
 */
export const THEME_TEXT: Record<Theme, { name: string; colour: string; min: number }[]> = {
  dark: [
    { name: "ink", colour: "#e3e8ee", min: 4.5 },
    { name: "muted", colour: "#97a4b3", min: 3 },
    { name: "link", colour: "#6ccae3", min: 3 },
    { name: "accent", colour: "#f2a93b", min: 3 },
  ],
  light: [
    { name: "ink", colour: "#121a23", min: 4.5 },
    { name: "muted", colour: "#4b5968", min: 3 },
    { name: "link", colour: "#0a6782", min: 3 },
    { name: "accent", colour: "#9a5800", min: 3 },
  ],
};

/** The theme's own backgrounds, shown in the colour pickers when nothing is chosen. */
export const THEME_DEFAULTS: Record<Theme, { bg: string; surface: string }> = {
  dark: { bg: "#10171f", surface: "#151e28" },
  light: { bg: "#eef1f4", surface: "#fbfcfd" },
};

const HEX = /^#[0-9a-f]{6}$/;
export const STORAGE_KEY = "cyberdojo-appearance";

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (c[0] as number) + 0.7152 * (c[1] as number) + 0.0722 * (c[2] as number);
}

/** WCAG contrast ratio between two #rrggbb colours, from 1 to 21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Null when the theme's text stays readable on this background, otherwise the text that wouldn't. */
export function unreadable(theme: Theme, colour: string): string | null {
  const bad = THEME_TEXT[theme].find((t) => contrast(t.colour, colour) < t.min);
  return bad ? bad.name : null;
}

const hex = (v: unknown): string | null | undefined => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v !== "string") return undefined;
  const s = v.trim().toLowerCase();
  return HEX.test(s) ? s : undefined;
};

/**
 * Checks settings from anywhere: the browser's copy, a request, the database.
 * Returns the cleaned settings, or the reason they were refused.
 */
export function cleanPrefs(input: unknown): { prefs: Prefs } | { problem: string } {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return { problem: "bad" };
  const o = input as Record<string, unknown>;
  const font = o.font ?? DEFAULT_PREFS.font;
  const code = o.code ?? DEFAULT_PREFS.code;
  if (!FONTS.some((f) => f.id === font) || !CODE_FONTS.some((f) => f.id === code)) return { problem: "font" };
  const out: Prefs = { font: font as FontId, code: code as CodeFontId, dark: { bg: null, surface: null }, light: { bg: null, surface: null } };
  for (const theme of ["dark", "light"] as const) {
    const c = o[theme];
    if (c === undefined || c === null) continue;
    if (typeof c !== "object" || Array.isArray(c)) return { problem: "bad" };
    for (const key of ["bg", "surface"] as const) {
      const v = hex((c as Record<string, unknown>)[key]);
      if (v === undefined) return { problem: "colour" };
      if (v && unreadable(theme, v)) return { problem: "contrast" };
      out[theme][key] = v;
    }
  }
  return { prefs: out };
}

/** Puts the settings on the page. Only validated values reach here, and none as CSS text. */
export function applyPrefs(p: Prefs, root: HTMLElement = document.documentElement) {
  if (p.font === DEFAULT_PREFS.font) delete root.dataset.font;
  else root.dataset.font = p.font;
  if (p.code === DEFAULT_PREFS.code) delete root.dataset.codeFont;
  else root.dataset.codeFont = p.code;
  for (const theme of ["dark", "light"] as const) {
    for (const key of ["bg", "surface"] as const) {
      const prop = `--u-${key}-${theme}`;
      const v = p[theme][key];
      if (v && HEX.test(v)) root.style.setProperty(prop, v);
      else root.style.removeProperty(prop);
    }
  }
}

export function readLocal(): Prefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const r = cleanPrefs(JSON.parse(raw));
    return "prefs" in r ? r.prefs : null;
  } catch {
    return null;
  }
}

export function writeLocal(p: Prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // No storage: the settings still apply now, and come back from the account next time.
  }
}

export const isDefault = (p: Prefs) => JSON.stringify(p) === JSON.stringify(DEFAULT_PREFS);

/**
 * Runs in <head> before the page paints, so a chosen background never flashes the
 * default first. It re-checks every value with the same allowlists and pattern as
 * cleanPrefs; the contrast check isn't repeated because only cleaned settings are
 * ever stored, and this copy affects nobody but the person whose browser it's in.
 */
export const APPEARANCE_SCRIPT = `try{var a=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"null");if(a&&typeof a==="object"){var r=document.documentElement,H=/^#[0-9a-f]{6}$/,F=${JSON.stringify(FONTS.map((f) => f.id).slice(1))},C=${JSON.stringify(CODE_FONTS.map((f) => f.id).slice(1))};if(F.indexOf(a.font)>-1)r.dataset.font=a.font;if(C.indexOf(a.code)>-1)r.dataset.codeFont=a.code;["dark","light"].forEach(function(t){var x=a[t]||{};["bg","surface"].forEach(function(k){if(H.test(x[k]))r.style.setProperty("--u-"+k+"-"+t,x[k])})})}}catch(e){}`;
