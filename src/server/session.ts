/**
 * Sessions: a random token in an HttpOnly cookie, stored only as its SHA-256.
 * Reading the database therefore gives nobody a usable session.
 */
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { get, many, run } from "./db";

const DAY = 86_400_000;
const LIFETIME = 30 * DAY;

/**
 * Secure everywhere except on this computer: browsers refuse a Secure cookie
 * over plain http://localhost, and `pnpm start` has no certificate. A wrong Host
 * header can only weaken the sender's own cookie, so trusting it here is safe.
 */
async function secure() {
  const host = (await headers()).get("host") ?? "";
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  return process.env.NODE_ENV === "production" && !local;
}

/** __Host- makes the browser refuse the cookie unless it is Secure and bound to this exact host. */
const cookieName = async () => ((await secure()) ? "__Host-cyberdojo" : "cyberdojo");

const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export interface User {
  id: string;
  username: string;
  createdAt: number;
}

async function setCookie(token: string, expires: number) {
  (await cookies()).set(await cookieName(), token, { httpOnly: true, secure: await secure(), sameSite: "lax", path: "/", expires: new Date(expires) });
}

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  await many([
    ["DELETE FROM sessions WHERE expires_at < ?", now],
    ["INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)", digest(token), userId, now, now + LIFETIME],
  ]);
  await setCookie(token, now + LIFETIME);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(await cookieName())?.value;
  if (!token) return null;
  const now = Date.now();
  const row = await get<User & { expiresAt: number }>(
    "SELECT u.id, u.username, u.created_at AS createdAt, s.expires_at AS expiresAt FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?",
    digest(token),
    now,
  );
  if (!row) return null;
  // Someone using the site stays signed in. Renewing once a day avoids a write per request.
  if (row.expiresAt - now < LIFETIME - DAY) {
    await run("UPDATE sessions SET expires_at = ? WHERE token_hash = ?", now + LIFETIME, digest(token));
    await setCookie(token, now + LIFETIME);
  }
  return { id: row.id, username: row.username, createdAt: row.createdAt };
}

export async function endSession() {
  const jar = await cookies();
  const name = await cookieName();
  const token = jar.get(name)?.value;
  if (token) await run("DELETE FROM sessions WHERE token_hash = ?", digest(token));
  jar.delete(name);
}

/** After a password change: every session goes, including any on a stolen device. */
export const endAllSessions = (userId: string) => run("DELETE FROM sessions WHERE user_id = ?", userId);
