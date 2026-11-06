/** Helpers shared by the dojo's modules. */
import type { Rng } from "@/lib/rng";
import type { Shell, Program } from "@/lib/shell/shell";
import { machine, tool } from "@/lib/shell/world";
import type { Built } from "../kit";

export const say = (stdout = "") => ({ stdout, stderr: "", code: 0 });
export const fail = (stderr: string, code = 1) => ({ stdout: "", stderr, code });

export const ana = (extra: { name: string; uid: number; groups?: string[] }[] = [], groups: string[] = [], mine: string[] = []) =>
  machine("ana", [{ name: "ana", uid: 1000, groups: mine }, ...extra], groups);

/** A program at /challenge/<name>, the way each exercise gets its own tool. */
export function challenge(sh: Shell, name: string, fn: Program, mode = 0o755) {
  sh.fs.dir("/challenge", { mode: 0o755 });
  const id = `challenge-${name}`;
  sh.fs.put(`/challenge/${name}`, "\x7fELF\0", { mode, program: id });
  sh.programs[id] = fn;
}

export { tool };

const NOISE = ["sync ok", "heartbeat", "cache flush", "rotate logs", "disk 41%", "backup ok", "queue empty", "lease renewed", "update check", "worker idle"];

export const noise = (rng: Rng, n: number) => Array.from({ length: n }, (_, i) => `${String(i).padStart(5, "0")} ${rng.pick(NOISE)}\n`).join("");

/** The file as root sees it, so grading can't be blocked by permissions. */
export function content(w: Built, path: string): string | null {
  try {
    return w.shell.fs.lookup(path, "/", ROOT).content ?? null;
  } catch {
    return null;
  }
}

export function modeOf(w: Built, path: string): number | null {
  try {
    return w.shell.fs.lookup(path, "/", ROOT).mode & 0o7777;
  } catch {
    return null;
  }
}

const ROOT = { uid: 0, euid: 0, egid: 0, gids: [0] };

export const hex = (s: string) => [...new TextEncoder().encode(s)].map((b) => b.toString(16).padStart(2, "0")).join("");

export const fromHex = (h: string) => {
  const out = new Uint8Array(Math.floor(h.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return new TextDecoder().decode(out);
};

export const xorHex = (...parts: string[]) => {
  const len = Math.min(...parts.map((p) => p.length));
  let out = "";
  for (let i = 0; i < len; i += 2) {
    let b = 0;
    for (const p of parts) b ^= parseInt(p.slice(i, i + 2), 16);
    out += b.toString(16).padStart(2, "0");
  }
  return out;
};

export const randomHex = (rng: Rng, bytes: number) => Array.from({ length: bytes }, () => rng.int(0, 255).toString(16).padStart(2, "0")).join("");
