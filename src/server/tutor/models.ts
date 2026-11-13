/** Which models to suggest for this computer. Sizes are the default (4-bit) downloads. */
import os from "node:os";
import type { ModelChoice, Tier } from "@/lib/tutor-types";

export const EMBED_MODEL = "nomic-embed-text";

export const CATALOG: ModelChoice[] = [
  { name: "llama3.2:3b", gb: 2, tier: "light", use: "chat" },
  { name: "qwen2.5:3b", gb: 1.9, tier: "light", use: "chat" },
  { name: "qwen2.5:7b", gb: 4.7, tier: "standard", use: "chat" },
  { name: "llama3.1:8b", gb: 4.9, tier: "standard", use: "chat" },
  { name: "mistral:7b", gb: 4.4, tier: "standard", use: "chat" },
  { name: "qwen2.5-coder:7b", gb: 4.7, tier: "standard", use: "code" },
  { name: "qwen2.5:14b", gb: 9, tier: "strong", use: "chat" },
  { name: "qwen2.5-coder:14b", gb: 9, tier: "strong", use: "code" },
];

/**
 * Memory decides what runs at a usable speed. A model needs its download size
 * plus a few GB for context, and the system needs the rest.
 */
export function hardware(): { ramGb: number; tier: Tier } {
  const ramGb = Math.round(os.totalmem() / 2 ** 30);
  return { ramGb, tier: ramGb < 12 ? "light" : ramGb < 24 ? "standard" : "strong" };
}

/** A model name as Ollama writes them: "name", "name:tag" or "namespace/name:tag". */
export const validModel = (name: string) => /^[a-z0-9][\w.-]*(\/[\w.-]+)?(:[\w.-]+)?$/i.test(name) && name.length <= 120;
