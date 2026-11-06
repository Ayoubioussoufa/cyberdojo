/**
 * Password hashing with scrypt, at OWASP's recommended cost (N=2^17, r=8, p=1).
 * The parameters are stored with each hash, so the cost can rise later without
 * breaking existing accounts: see needsRehash.
 */
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const LOG_N = 17;
const R = 8;
const P = 1;
const KEY_LEN = 32;

const derive = (password: string, salt: Buffer, logN: number, r: number, p: number, len: number) =>
  new Promise<Buffer>((resolve, reject) => {
    const N = 2 ** logN;
    scrypt(password.normalize("NFKC"), salt, len, { N, r, p, maxmem: 256 * N * r }, (err, key) => (err ? reject(err) : resolve(key)));
  });

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, LOG_N, R, P, KEY_LEN);
  return `scrypt$${LOG_N}$${R}$${P}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  const [scheme, logN, r, p, salt, key] = stored.split("$");
  if (scheme !== "scrypt" || !logN || !r || !p || !salt || !key) return false;
  const want = Buffer.from(key, "base64url");
  const got = await derive(password, Buffer.from(salt, "base64url"), Number(logN), Number(r), Number(p), want.length);
  return timingSafeEqual(got, want);
}

export const needsRehash = (stored: string) => !stored.startsWith(`scrypt$${LOG_N}$${R}$${P}$`);

let decoy: Promise<string> | null = null;

/** Spends the same time as a real check, so a response can't reveal that a name doesn't exist. */
export async function wasteTime(password: string): Promise<void> {
  decoy ??= hashPassword("no account has this password");
  await verifyPassword(await decoy, password);
}

/** Null when acceptable, otherwise what to tell the person. */
export function passwordProblem(password: string, username: string): string | null {
  if (password.length < 12) return "Use at least 12 characters. A short sentence works well.";
  if (password.length > 128) return "Use at most 128 characters.";
  const low = password.toLowerCase();
  if (low.includes(username.toLowerCase())) return "Don't put your username in your password.";
  if (new Set(low).size < 5) return "That password repeats too much. Mix in more characters.";
  if (COMMON.some((c) => low.includes(c))) return "That password contains a very common pattern. Choose something less guessable.";
  return null;
}

const COMMON = ["password", "123456", "qwerty", "azerty", "letmein", "admin123", "iloveyou", "cyberdojo", "abcdef"];
