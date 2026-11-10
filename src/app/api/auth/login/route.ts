import { NextResponse } from "next/server";
import { get, run } from "@/server/db";
import { clientIp, fail, forget, limited, note, sameOrigin, smallJson, text } from "@/server/http";
import { hashPassword, needsRehash, verifyPassword, wasteTime } from "@/server/password";
import { isAdmin } from "@/server/metrics";
import { startSession } from "@/server/session";

const WINDOW = 15 * 60_000;
const WRONG = "That username and password don't match.";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "This request came from another site.");
  const body = await smallJson(req);
  if (!body) return fail(400, "That request wasn't valid.");
  const username = text(body.username).trim();
  const password = text(body.password);
  if (!username || !password || password.length > 128) return fail(401, WRONG);

  const nameKey = `login:${username.toLowerCase()}`;
  const ipKey = `login-ip:${clientIp(req)}`;
  const busy = (await limited(nameKey, 8, WINDOW)) || (ipKey !== "login-ip:direct" && (await limited(ipKey, 40, WINDOW)));
  if (busy) return fail(429, "Too many wrong attempts. Wait 15 minutes and try again.");

  const user = await get<{ id: string; username: string; hash: string; createdAt: number }>("SELECT id, username, password_hash AS hash, created_at AS createdAt FROM users WHERE username = ?", username);
  const ok = user ? await verifyPassword(user.hash, password) : (await wasteTime(password), false);
  if (!user || !ok) {
    await note(nameKey);
    await note(ipKey);
    return fail(401, WRONG);
  }
  await forget(nameKey);
  if (needsRehash(user.hash)) await run("UPDATE users SET password_hash = ? WHERE id = ?", await hashPassword(password), user.id);
  await startSession(user.id);
  return NextResponse.json({ user: { id: user.id, username: user.username, createdAt: user.createdAt }, ...(isAdmin(user) ? { admin: true } : {}) });
}
