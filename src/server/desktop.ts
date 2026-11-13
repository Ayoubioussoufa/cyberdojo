/**
 * The desktop app's front door. The server listens on 127.0.0.1, where any
 * program or web page on the computer can reach it, so the window proves itself:
 * Electron makes a random token at launch, gives it to the server in the
 * environment and to its own window as a cookie. No token, no answer.
 */
import { timingSafeEqual } from "node:crypto";

export const DESKTOP_COOKIE = "cyberdojo-desktop";

export function fromAppWindow(cookie: string | undefined): boolean {
  const token = process.env.CYBERDOJO_DESKTOP_TOKEN;
  if (!token || !cookie) return false;
  const a = Buffer.from(cookie);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
