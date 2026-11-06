import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { fail, limited, note, sameOrigin, smallJson, text } from "@/server/http";
import { verifyPassword } from "@/server/password";
import { currentUser, endSession } from "@/server/session";

/** Deletes the account. Sessions and progress go with it through ON DELETE CASCADE. */
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return fail(403, "This request came from another site.");
  const user = await currentUser();
  if (!user) return fail(401, "Sign in first.");
  const body = await smallJson(req);
  if (!body) return fail(400, "That request wasn't valid.");
  const key = `delete:${user.id}`;
  if (limited(key, 8, 900_000)) return fail(429, "Too many attempts. Wait 15 minutes and try again.");
  const password = text(body.password);
  const row = db().prepare("SELECT password_hash AS hash FROM users WHERE id = ?").get(user.id) as { hash: string };
  if (password.length > 128 || !(await verifyPassword(row.hash, password))) {
    note(key);
    return fail(403, "That password isn't right.");
  }
  await endSession();
  db().prepare("DELETE FROM users WHERE id = ?").run(user.id);
  return NextResponse.json({ ok: true });
}
