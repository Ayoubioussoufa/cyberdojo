import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { fail, sameOrigin } from "@/server/http";
import { currentUser } from "@/server/session";
import { cleanProgress, MAX_PROGRESS_BYTES } from "@/lib/merge";

interface Row {
  data: string;
  version: number;
}

const load = (id: string) => db().prepare("SELECT data, version FROM progress WHERE user_id = ?").get(id) as unknown as Row;

export async function GET() {
  const user = await currentUser();
  if (!user) return fail(401, "Sign in first.");
  const row = load(user.id);
  return NextResponse.json({ data: JSON.parse(row.data) as unknown, version: row.version });
}

/** Saves only over the version the browser last saw. A 409 sends the newer copy back to merge. */
export async function PUT(req: Request) {
  if (!sameOrigin(req)) return fail(403, "This request came from another site.");
  const user = await currentUser();
  if (!user) return fail(401, "Sign in first.");
  const raw = await req.text();
  if (Buffer.byteLength(raw) > MAX_PROGRESS_BYTES) return fail(413, "Your progress is too large to save.");
  let body: { data?: unknown; version?: unknown };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return fail(400, "That request wasn't valid.");
  }
  const data = cleanProgress(body.data);
  if (!data || !Number.isInteger(body.version)) return fail(400, "That progress wasn't in the right format.");
  const done = db()
    .prepare("UPDATE progress SET data = ?, version = version + 1, updated_at = ? WHERE user_id = ? AND version = ?")
    .run(JSON.stringify(data), Date.now(), user.id, body.version as number);
  if (done.changes === 0) {
    const row = load(user.id);
    return fail(409, "A newer copy exists.", { data: JSON.parse(row.data) as unknown, version: row.version });
  }
  return NextResponse.json({ version: (body.version as number) + 1 });
}
