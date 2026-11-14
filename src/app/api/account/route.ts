import { NextResponse } from "next/server";
import { get, many } from "@/server/db";
import { fail, limited, note, sameOrigin, smallJson, text } from "@/server/http";
import { verifyPassword } from "@/server/password";
import { currentUser, endSession } from "@/server/session";

/** Deletes the account with its sessions and progress. Its visits stay as anonymous counts. */
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return fail(403, "This request came from another site.");
  const user = await currentUser();
  if (!user) return fail(401, "Sign in first.");
  const body = await smallJson(req);
  if (!body) return fail(400, "That request wasn't valid.");
  const key = `delete:${user.id}`;
  if (await limited(key, 8, 900_000)) return fail(429, "Too many attempts. Wait 15 minutes and try again.");
  const password = text(body.password);
  const row = await get<{ hash: string }>("SELECT password_hash AS hash FROM users WHERE id = ?", user.id);
  if (!row || password.length > 128 || !(await verifyPassword(row.hash, password))) {
    await note(key);
    return fail(403, "That password isn't right.");
  }
  await endSession();
  await many([
    ["DELETE FROM sessions WHERE user_id = ?", user.id],
    ["DELETE FROM progress WHERE user_id = ?", user.id],
    ["UPDATE visits SET user_id = NULL WHERE user_id = ?", user.id],
    ["UPDATE feedback SET user_id = NULL WHERE user_id = ?", user.id],
    ["DELETE FROM users WHERE id = ?", user.id],
  ]);
  return NextResponse.json({ ok: true });
}
