/**
 * The models the setup page offers, and how each would run on this computer.
 * Sizes are the exact downloads, read from registry.ollama.ai on 13 Nov 2026
 * (the default 4-bit builds). Any other Ollama model can still be downloaded by name.
 */
import type { AdvisedModel, Fit, Hardware, ModelChoice } from "@/lib/tutor-types";

export const EMBED_MODEL = "nomic-embed-text";
export const EMBED_BYTES = 274_302_450;

/** Smallest first. */
export const CATALOG: ModelChoice[] = [
  { name: "llama3.2:3b", bytes: 2_019_393_189, params: "3B", family: "Llama 3.2" },
  { name: "qwen3.5:2b", bytes: 2_683_396_812, params: "2B", family: "Qwen 3.5" },
  { name: "qwen3.5:4b", bytes: 3_324_173_934, params: "4B", family: "Qwen 3.5" },
  { name: "qwen3.5:9b", bytes: 6_550_825_550, params: "9B", family: "Qwen 3.5" },
  { name: "gemma4:e4b", bytes: 6_583_656_505, params: "4B", family: "Gemma 4" },
  { name: "gemma4:12b", bytes: 8_021_618_941, params: "12B", family: "Gemma 4" },
  { name: "gpt-oss:20b", bytes: 13_793_441_566, params: "21B, 3.6B active", family: "gpt-oss" },
  { name: "qwen3.5:27b", bytes: 17_478_556_591, params: "27B", family: "Qwen 3.5" },
  { name: "gemma4:26b", bytes: 18_731_025_629, params: "26B", family: "Gemma 4" },
];

/**
 * The recommendation climbs this ladder as far as the computer allows: one
 * family where it can, so a learner who upgrades their computer gets the same
 * tutor, only sharper.
 */
const LADDER = ["qwen3.5:2b", "qwen3.5:4b", "qwen3.5:9b", "gemma4:12b", "qwen3.5:27b"];

/** Mixture-of-experts models read only part of their weights per word, so they stay usable on a processor alone. */
const SPARSE = new Set(["gpt-oss:20b"]);

const GB = 2 ** 30;
/** Memory the operating system and the app itself keep. */
const SYSTEM_GB = 3;
/** On a processor alone, a model up to this size still answers at reading speed. */
const CPU_OK_GB = 3.5;

/** Memory a model takes once loaded: its weights, plus the 8,192-token context and working buffers. */
export const needGb = (bytes: number) => (bytes / GB) * 1.15 + 1;

export function fit(bytes: number, hw: Hardware, sparse = false): Fit {
  const need = needGb(bytes);
  const ram = hw.ramGb - SYSTEM_GB;
  const gpu = hw.gpu;
  if (gpu?.unified) {
    if (need <= gpu.vramGb) return "fast";
    return need <= ram ? "slow" : "too-big";
  }
  if (gpu && need <= gpu.vramGb) return "fast";
  // Split between the card and main memory: speed follows the share on the card.
  if (gpu && need - gpu.vramGb <= ram) return need * 0.6 <= gpu.vramGb || sparse ? "ok" : "slow";
  if (need > ram) return "too-big";
  return bytes / GB <= CPU_OK_GB || sparse ? "ok" : "slow";
}

const noRoom = (bytes: number, hw: Hardware) => hw.diskFreeGb !== null && hw.diskFreeGb < bytes / GB + 1;

export function advise(hw: Hardware, catalog: ModelChoice[] = CATALOG): { models: AdvisedModel[]; recommended: string | null } {
  const models = catalog.map((m) => ({ ...m, fit: fit(m.bytes, hw, SPARSE.has(m.name)), noRoom: noRoom(m.bytes, hw) }));
  const on = (want: Fit) => [...LADDER].reverse().find((name) => models.some((m) => m.name === name && m.fit === want && !m.noRoom));
  const recommended = on("fast") ?? on("ok") ?? on("slow") ?? null;
  return { models, recommended };
}

export const catalogBytes = (name: string) => (name === EMBED_MODEL ? EMBED_BYTES : CATALOG.find((m) => m.name === name)?.bytes);

/**
 * A model name as Ollama takes them: "name", "name:tag", "namespace/name:tag",
 * or a GGUF model on Hugging Face, "hf.co/user/repo:quant".
 */
export const validModel = (name: string) =>
  name.length <= 160 && (/^[a-z0-9][\w.-]*(\/[\w.-]+)?(:[\w.-]+)?$/i.test(name) || /^(hf\.co|huggingface\.co)\/[\w.-]+\/[\w.-]+(:[\w.-]+)?$/i.test(name)) && !name.includes("..");

/** Where a model's manifest lives: Ollama's registry, or Hugging Face's, which speaks the same protocol. */
export function manifestUrl(name: string): string | null {
  if (!validModel(name)) return null;
  const [path = "", tag = "latest"] = name.split(":");
  const hf = /^(hf\.co|huggingface\.co)\//i.exec(path);
  if (hf) return `https://hf.co/v2/${path.slice(hf[0].length)}/manifests/${tag}`;
  return `https://registry.ollama.ai/v2/${path.includes("/") ? path : `library/${path}`}/manifests/${tag}`;
}

/**
 * The download size of any model, read from its registry before anything is
 * downloaded: null when it doesn't exist, undefined when the registry couldn't be reached.
 */
export async function lookUp(name: string): Promise<number | null | undefined> {
  const url = manifestUrl(name);
  if (!url) return null;
  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: "application/vnd.docker.distribution.manifest.v2+json" }, signal: AbortSignal.timeout(10_000), redirect: "follow" });
  } catch {
    return undefined;
  }
  if (res.status === 404 || res.status === 401 || res.status === 400) return null;
  if (!res.ok) return undefined;
  const manifest = (await res.json().catch(() => null)) as { layers?: { size?: number }[]; config?: { size?: number } } | null;
  const bytes = (manifest?.layers ?? []).reduce((n, l) => n + (l.size ?? 0), 0) + (manifest?.config?.size ?? 0);
  return bytes > 0 ? bytes : null;
}

/** How any model, not only the catalog's, would run here. */
export const adviseOne = (name: string, bytes: number, hw: Hardware): AdvisedModel => ({ name, bytes, params: "", family: "", fit: fit(bytes, hw, SPARSE.has(name)), noRoom: noRoom(bytes, hw) });
