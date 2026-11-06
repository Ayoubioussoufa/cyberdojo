import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { clientIp, fail, forget, limited, note, sameOrigin, smallJson, text } from "@/server/http";
import { hashPassword, needsRehash, verifyPassword, wasteTime } from "@/server/password";
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
  const busy = limited(nameKey, 8, WINDOW) || (ipKey !== "login-ip:direct" && limited(ipKey, 40, WINDOW));
  if (busy) return fail(429, "Too many wrong attempts. Wait 15 minutes and try again.");

  const conn = db();
  const user = conn.prepare("SELECT id, username, password_hash AS hash, created_at AS createdAt FROM users WHERE username = ?").get(username) as
    | { id: string; username: string; hash: string; createdAt: number }
    | undefined;
  const ok = user ? await verifyPassword(user.hash, password) : (await wasteTime(password), false);
  if (!user || !ok) {
    note(nameKey);
    note(ipKey);
    return fail(401, WRONG);
  }
  forget(nameKey);
  if (needsRehash(user.hash)) conn.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await hashPassword(password), user.id);
  await startSession(user.id);
  return NextResponse.json({ user: { id: user.id, username: user.username, createdAt: user.createdAt } });
}
