import { NextResponse } from "next/server";
import { get, run } from "@/server/db";
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
  if (await limited(key, 8, 900_000)) return fail(429, "Too many attempts. Wait 15 minutes and try again.");
  const row = await get<{ hash: string }>("SELECT password_hash AS hash FROM users WHERE id = ?", user.id);
  if (!row || current.length > 128 || !(await verifyPassword(row.hash, current))) {
    await note(key);
    return fail(403, "Your current password isn't right.");
  }
  const problem = passwordProblem(next, user.username);
  if (problem) return fail(400, problem);
  await run("UPDATE users SET password_hash = ? WHERE id = ?", await hashPassword(next), user.id);
  await endAllSessions(user.id);
  await startSession(user.id);
  return NextResponse.json({ ok: true });
}
