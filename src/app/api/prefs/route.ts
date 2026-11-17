import { NextResponse } from "next/server";
import { cleanPrefs, DEFAULT_PREFS } from "@/lib/appearance";
import { get, run } from "@/server/db";
import { fail, limited, note, sameOrigin, smallJson } from "@/server/http";
import { currentUser } from "@/server/session";

/**
 * The signed-in account's appearance settings (src/lib/appearance.ts).
 * `saved` says whether the account has any, so a browser can offer its own copy.
 */
export async function GET() {
  const user = await currentUser();
  if (!user) return fail(401, "Sign in first.");
  const row = await get<{ data: string }>("SELECT data FROM user_prefs WHERE user_id = ?", user.id);
  if (!row) return NextResponse.json({ prefs: DEFAULT_PREFS, saved: false });
  let stored: unknown = null;
  try {
    stored = JSON.parse(row.data);
  } catch {
    // An unreadable row falls back to the defaults below.
  }
  const r = cleanPrefs(stored);
  return NextResponse.json({ prefs: "prefs" in r ? r.prefs : DEFAULT_PREFS, saved: "prefs" in r });
}

const PROBLEMS: Record<string, string> = {
  font: "That font isn't one of the choices.",
  colour: "Colours must be written as #rrggbb.",
  contrast: "Text wouldn't be readable on that colour. Pick a darker or lighter one.",
  bad: "That request wasn't valid.",
};

/** Saves the settings after the same checks the browser makes. Anything else is refused, never stored. */
export async function PUT(req: Request) {
  if (!sameOrigin(req)) return fail(403, "This request came from another site.");
  const user = await currentUser();
  if (!user) return fail(401, "Sign in first.");
  const key = `prefs:${user.id}`;
  if (await limited(key, 60, 600_000)) return fail(429, "Too many changes. Wait a few minutes and try again.");
  await note(key);
  const body = await smallJson(req);
  if (!body) return fail(400, PROBLEMS.bad as string);
  const r = cleanPrefs(body.prefs);
  if ("problem" in r) return fail(400, PROBLEMS[r.problem] ?? (PROBLEMS.bad as string));
  await run(
    "INSERT INTO user_prefs (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
    user.id,
    JSON.stringify(r.prefs),
    Date.now(),
  );
  return NextResponse.json({ prefs: r.prefs });
}
