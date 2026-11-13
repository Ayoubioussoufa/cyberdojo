/** Every tutor route starts here: desktop build only, the app's own window only, and no writes from other origins. */
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { DESKTOP } from "@/lib/desktop";
import { DESKTOP_COOKIE, fromAppWindow } from "@/server/desktop";
import { fail, sameOrigin } from "@/server/http";

/** Null lets the request through. */
export async function refuse(req: Request): Promise<NextResponse | null> {
  if (!DESKTOP) return fail(404, "Not found.");
  if (!fromAppWindow((await cookies()).get(DESKTOP_COOKIE)?.value)) return fail(403, "This request came from another site.");
  if (req.method !== "GET" && !sameOrigin(req)) return fail(403, "This request came from another site.");
  return null;
}

/** A JSON object body up to `max` characters, or null. */
export async function body(req: Request, max: number): Promise<Record<string, unknown> | null> {
  const text = await req.text();
  if (text.length > max) return null;
  try {
    const v: unknown = JSON.parse(text);
    return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
