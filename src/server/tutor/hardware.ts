/**
 * What this computer can run: memory, graphics card and free disk space. Read
 * once a minute at most, because the setup page asks often and `nvidia-smi`
 * takes a moment.
 */
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Hardware } from "@/lib/tutor-types";

const TTL_MS = 60_000;
const GB = 2 ** 30;

const slot = globalThis as { __cyberdojoHardware?: { at: number; value: Promise<Hardware> } };

function run(file: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(file, args, { timeout: 5000, windowsHide: true }, (err, stdout) => resolve(err ? null : stdout));
  });
}

/**
 * NVIDIA cards report themselves through `nvidia-smi`, installed with the driver on Windows and Linux.
 * Other cards are left out: Ollama runs on them only in some setups, so promising speed there would mislead.
 */
async function nvidia(): Promise<{ name: string; vramGb: number } | null> {
  const out = await run("nvidia-smi", ["--query-gpu=name,memory.total", "--format=csv,noheader,nounits"]);
  if (!out) return null;
  const cards = out
    .trim()
    .split("\n")
    .map((line) => line.split(",").map((s) => s.trim()))
    .map(([name, mib]) => ({ name: name ?? "", vramGb: Number(mib) / 1024 }))
    .filter((c) => c.name && c.vramGb > 0)
    .sort((a, b) => b.vramGb - a.vramGb);
  return cards[0] ?? null;
}

/**
 * Where Ollama keeps models unless told otherwise. The disk check reads the free
 * space there, or on the nearest folder that exists yet.
 */
export function modelsDir(): string {
  return process.env.OLLAMA_MODELS || path.join(os.homedir(), ".ollama", "models");
}

function freeBytes(dir: string): number | null {
  let at = dir;
  while (!fs.existsSync(at)) {
    const up = path.dirname(at);
    if (up === at) return null;
    at = up;
  }
  try {
    const s = fs.statfsSync(at);
    return s.bavail * s.bsize;
  } catch {
    return null;
  }
}

async function measure(): Promise<Hardware> {
  const ramGb = os.totalmem() / GB;
  const appleSilicon = process.platform === "darwin" && process.arch === "arm64";
  const card = appleSilicon ? null : await nvidia();
  const disk = freeBytes(modelsDir());
  return {
    ramGb: Math.round(ramGb),
    cores: os.availableParallelism(),
    // Apple silicon shares its memory with the graphics cores, and macOS lets them use about two thirds of it.
    gpu: appleSilicon
      ? { name: "Apple silicon", vramGb: Math.round(ramGb * (ramGb > 36 ? 0.75 : 0.66)), unified: true }
      : card
        ? { name: card.name, vramGb: Math.round(card.vramGb), unified: false }
        : null,
    diskFreeGb: disk === null ? null : Math.floor((disk / GB) * 10) / 10,
  };
}

export function hardware(): Promise<Hardware> {
  const cached = slot.__cyberdojoHardware;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const value = measure();
  slot.__cyberdojoHardware = { at: Date.now(), value };
  return value;
}
