/** What every API route needs: same-origin checks, JSON bodies, rate limits. */
import { NextResponse } from "next/server";
import { many, run } from "./db";

export const fail = (status: number, error: string, extra: Record<string, unknown> = {}) => NextResponse.json({ error, ...extra }, { status });

/** Only behind a proxy you run: otherwise anyone can forge this header. */
const proxied = () => process.env.TRUST_PROXY === "1";

export function clientIp(req: Request): string {
  if (!proxied()) return "direct";
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * Stops other sites sending requests with this visitor's cookie. SameSite=Lax
 * already blocks them in current browsers; this covers the rest.
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = (proxied() && req.headers.get("x-forwarded-host")) || req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const MAX_BODY = 4_096;

/** Reads a small JSON object. Null means reject the request. */
export async function smallJson(req: Request): Promise<Record<string, unknown> | null> {
  if (!req.headers.get("content-type")?.startsWith("application/json")) return null;
  const text = await req.text();
  if (text.length > MAX_BODY) return null;
  try {
    const v: unknown = JSON.parse(text);
    return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const text = (v: unknown): string => (typeof v === "string" ? v : "");

/** True when `key` has already had `limit` events in the last `windowMs`. */
export async function limited(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const [, counted] = await many([
    ["DELETE FROM attempts WHERE at < ?", now - 86_400_000],
    ["SELECT COUNT(*) AS n FROM attempts WHERE key = ? AND at > ?", key, now - windowMs],
  ]);
  return Number(counted?.[0]?.n ?? 0) >= limit;
}

export const note = (key: string) => run("INSERT INTO attempts (key, at) VALUES (?, ?)", key, Date.now());

export const forget = (key: string) => run("DELETE FROM attempts WHERE key = ?", key);
