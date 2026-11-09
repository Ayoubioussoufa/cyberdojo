/**
 * Shared helpers for "Try to break in": deliberately vulnerable web apps,
 * simulated entirely in the browser. The learner attacks them with `curl`, the
 * same simulated client the Dojo uses. Nothing here reaches a real network, and
 * every payload only works against the toy server in the closure. Each challenge
 * teaches the fix in its debrief, so breaking in is how you learn to defend.
 */
import { curl, type Site } from "@/lib/shell/http";
import type { Shell } from "@/lib/shell/shell";
import type { Rng } from "@/lib/rng";
import { ana, tool } from "../dojo/kit";
import { type Res } from "@/lib/shell/http";

export const ok = (body: string, headers: [string, string][] = []): Res => ({ status: 200, headers, body });
export const bad = (status: number, body: string, headers: [string, string][] = []): Res => ({ status, headers, body });
export const notFound: Res = { status: 404, body: "<h1>404 Not Found</h1>\n" };

/** A shell with curl mounted for the given vulnerable hosts, and nothing else reachable. */
export function attackBox(sites: Record<string, Site>): Shell {
  const shell = ana();
  tool(shell, "curl", curl(sites));
  return shell;
}

/** A short random token, so a flag or secret changes every round. */
export const token = (rng: Rng, n = 10) => Array.from({ length: n }, () => "abcdefghjkmnpqrstuvwxyz23456789"[rng.int(0, 30)]).join("");
