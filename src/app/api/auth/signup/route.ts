import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { DESKTOP } from "@/lib/desktop";
import { get, many } from "@/server/db";
import { clientIp, fail, limited, note, sameOrigin, smallJson, text } from "@/server/http";
import { hashPassword, passwordProblem } from "@/server/password";
import { isAdmin } from "@/server/metrics";
import { startSession } from "@/server/session";

const USERNAME = /^[A-Za-z0-9_.-]{3,32}$/;

export async function POST(req: Request) {
  // The desktop app has one local profile and nothing to sign in to. Answering here would let a web
  // page that reaches the app's local server (DNS rebinding) write accounts into its database.
  if (DESKTOP) return fail(404, "Not found.");
  if (!sameOrigin(req)) return fail(403, "This request came from another site.");
  const body = await smallJson(req);
  if (!body) return fail(400, "That request wasn't valid.");
  const username = text(body.username).trim();
  const password = text(body.password);
  if (!USERNAME.test(username)) return fail(400, "Usernames use 3 to 32 letters, digits, dots, dashes or underscores.");
  const problem = passwordProblem(password, username);
  if (problem) return fail(400, problem);
  const key = `signup:${clientIp(req)}`;
  if (await limited(key, Number(process.env.SIGNUP_LIMIT ?? 20), 3_600_000)) return fail(429, "Too many new accounts from here. Try again in an hour.");
  await note(key);
  const hash = await hashPassword(password);
  const id = randomUUID();
  const now = Date.now();
  const TAKEN = "That username is taken. Pick another.";
  if (await get("SELECT 1 FROM users WHERE username = ?", username)) return fail(409, TAKEN);
  try {
    await many([
      ["INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)", id, username, hash, now],
      ["INSERT INTO progress (user_id, data, version, updated_at) VALUES (?, '{}', 0, ?)", id, now],
    ]);
  } catch (e) {
    // Two sign-ups for one name at the same moment: the database lets only one through.
    if (await get("SELECT 1 FROM users WHERE username = ?", username)) return fail(409, TAKEN);
    throw e;
  }
  await startSession(id);
  return NextResponse.json({ user: { id, username, createdAt: now }, ...(isAdmin({ username }) ? { admin: true } : {}) }, { status: 201 });
}
