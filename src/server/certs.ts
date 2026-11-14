/**
 * Belt certificates. A certificate is earned, not claimed on trust: the server
 * reads the learner's own saved progress, rebuilds the roadmap, and checks that
 * every required step up to that belt is really done before it issues one. Each
 * certificate has a public id so its page can be shared and verified by anyone,
 * and shows a name the learner chose (their username by default).
 */
import { randomBytes } from "node:crypto";
import { BELTS } from "@/data/path";
import { buildPath } from "@/lib/path";
import { cleanProgress, EMPTY_STORE } from "@/lib/merge";
import { currentBelt } from "@/lib/pathState";
import type { Store } from "@/lib/progress-types";
import { all, get, run } from "./db";

const NAME_MAX = 60;

async function storeOf(userId: string): Promise<Store> {
  const row = await get<{ data: string }>("SELECT data FROM progress WHERE user_id = ?", userId);
  if (!row) return EMPTY_STORE;
  try {
    return cleanProgress(JSON.parse(row.data)) ?? EMPTY_STORE;
  } catch {
    return EMPTY_STORE;
  }
}

/** The belt numbers (1 = yellow … 7 = black) this learner has fully earned. White (0) is "you've started", so it carries no certificate. */
export async function earnedBelts(userId: string): Promise<number[]> {
  const { belt } = currentBelt(buildPath("en"), await storeOf(userId));
  const at = BELTS.indexOf(belt);
  return Array.from({ length: Math.max(0, at) }, (_, i) => i + 1);
}

export const cleanName = (v: unknown, fallback: string): string => {
  const s = (typeof v === "string" ? v : "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
  return s || fallback;
};

export interface Cert {
  id: string;
  belt: number;
  name: string;
  issuedAt: number;
  username: string;
}

export async function certById(id: string): Promise<Cert | undefined> {
  const r = await get<{ id: string; belt: number; name: string; issued_at: number; username: string }>(
    "SELECT c.id, c.belt, c.name, c.issued_at AS issued_at, u.username FROM certificates c JOIN users u ON u.id = c.user_id WHERE c.id = ?",
    id,
  );
  return r ? { id: r.id, belt: Number(r.belt), name: r.name, issuedAt: Number(r.issued_at), username: r.username } : undefined;
}

export async function certsForUser(userId: string): Promise<{ belt: number; id: string }[]> {
  const rows = await all<{ belt: number; id: string }>("SELECT belt, id FROM certificates WHERE user_id = ? ORDER BY belt", userId);
  return rows.map((r) => ({ belt: Number(r.belt), id: String(r.id) }));
}

/**
 * Issues the certificate for a belt the learner has earned, or returns the one
 * already issued. Null when the belt number is out of range or not yet earned.
 */
export async function issueCert(userId: string, username: string, belt: number, name: unknown): Promise<string | null> {
  if (!Number.isInteger(belt) || belt < 1 || belt >= BELTS.length) return null;
  if (!(await earnedBelts(userId)).includes(belt)) return null;
  const id = randomBytes(12).toString("base64url");
  // ON CONFLICT keeps the first certificate for a belt, so a repeat is safe and returns the same id.
  await run(
    "INSERT INTO certificates (id, user_id, belt, name, issued_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (user_id, belt) DO NOTHING",
    id, userId, belt, cleanName(name, username), Date.now(),
  );
  const row = await get<{ id: string }>("SELECT id FROM certificates WHERE user_id = ? AND belt = ?", userId, belt);
  return row?.id ?? null;
}
