import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { clientIp, fail, limited, note, sameOrigin, smallJson, text } from "@/server/http";
import { hashPassword, passwordProblem } from "@/server/password";
import { startSession } from "@/server/session";

const USERNAME = /^[A-Za-z0-9_.-]{3,32}$/;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "This request came from another site.");
  const body = await smallJson(req);
  if (!body) return fail(400, "That request wasn't valid.");
  const username = text(body.username).trim();
  const password = text(body.password);
  if (!USERNAME.test(username)) return fail(400, "Usernames use 3 to 32 letters, digits, dots, dashes or underscores.");
  const problem = passwordProblem(password, username);
  if (problem) return fail(400, problem);
  const key = `signup:${clientIp(req)}`;
  if (limited(key, Number(process.env.SIGNUP_LIMIT ?? 20), 3_600_000)) return fail(429, "Too many new accounts from here. Try again in an hour.");
  note(key);
  const hash = await hashPassword(password);
  const id = randomUUID();
  const now = Date.now();
  const conn = db();
  const taken = conn.prepare("SELECT 1 FROM users WHERE username = ?").get(username);
  if (taken) return fail(409, "That username is taken. Pick another.");
  conn.prepare("INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)").run(id, username, hash, now);
  conn.prepare("INSERT INTO progress (user_id, data, version, updated_at) VALUES (?, '{}', 0, ?)").run(id, now);
  await startSession(id);
  return NextResponse.json({ user: { id, username, createdAt: now } }, { status: 201 });
}
