import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { fail, limited, note, sameOrigin, smallJson, text } from "@/server/http";
import { hashPassword, passwordProblem, verifyPassword } from "@/server/password";
import { currentUser, endAllSessions, startSession } from "@/server/session";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "This request came from another site.");
  const user = await currentUser();
  if (!user) return fail(401, "Sign in first.");
  const body = await smallJson(req);
  if (!body) return fail(400, "That request wasn't valid.");
  const current = text(body.current);
  const next = text(body.next);
  const key = `password:${user.id}`;
  if (limited(key, 8, 900_000)) return fail(429, "Too many attempts. Wait 15 minutes and try again.");
  const row = db().prepare("SELECT password_hash AS hash FROM users WHERE id = ?").get(user.id) as { hash: string };
  if (current.length > 128 || !(await verifyPassword(row.hash, current))) {
    note(key);
    return fail(403, "Your current password isn't right.");
  }
  const problem = passwordProblem(next, user.username);
  if (problem) return fail(400, problem);
  db().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await hashPassword(next), user.id);
  endAllSessions(user.id);
  await startSession(user.id);
  return NextResponse.json({ ok: true });
}
