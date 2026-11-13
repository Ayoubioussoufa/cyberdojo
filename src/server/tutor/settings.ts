/** The tutor's settings, kept in the local database. */
import { all, many } from "@/server/db";
import type { TutorSettings } from "@/lib/tutor-types";
import { EMBED_MODEL, validModel } from "./models";
import { DEFAULT_HOST } from "./ollama";

const DEFAULTS: TutorSettings = { host: DEFAULT_HOST, chatModel: "", embedModel: EMBED_MODEL, welcomed: "" };

export async function readSettings(): Promise<TutorSettings> {
  const rows = await all<{ key: string; value: string }>("SELECT key, value FROM tutor_settings");
  return { ...DEFAULTS, ...Object.fromEntries(rows.filter((r) => r.key in DEFAULTS).map((r) => [r.key, r.value])) };
}

/** An http(s) address with no path, so a typo can't send chats somewhere odd. */
function cleanHost(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    return (url.protocol === "http:" || url.protocol === "https:") && url.pathname === "/" && !url.search && !url.username ? url.origin : null;
  } catch {
    return null;
  }
}

/** Saves the fields given. Returns what is wrong, or null. */
export async function writeSettings(patch: Partial<Record<keyof TutorSettings, unknown>>): Promise<string | null> {
  const next: Partial<TutorSettings> = {};
  if (patch.host !== undefined) {
    const host = typeof patch.host === "string" ? cleanHost(patch.host) : null;
    if (!host) return "That isn't a valid Ollama address.";
    next.host = host;
  }
  for (const key of ["chatModel", "embedModel"] as const) {
    const value = patch[key];
    if (value === undefined) continue;
    // An empty chat model means none: the one in use was deleted.
    if (typeof value !== "string" || !(validModel(value) || (key === "chatModel" && value === ""))) return "That isn't a valid model name.";
    next[key] = value;
  }
  if (patch.welcomed !== undefined) next.welcomed = patch.welcomed === "1" ? "1" : "";
  const entries = Object.entries(next);
  if (entries.length) await many(entries.map(([k, v]) => ["INSERT INTO tutor_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", k, v]));
  return null;
}
