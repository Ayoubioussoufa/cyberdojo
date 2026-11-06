/** Loads one family of missions, so a lesson downloads only the machines it uses. */
import type { RangeSet } from "./kit";

type Family = Record<string, RangeSet>;

const FAMILIES: Record<string, () => Promise<Family>> = {
  zero: () => import("./linux").then((m) => m.MISSIONS_ZERO),
  later: () => import("./later").then((m) => m.MISSIONS_LATER),
  soc: () => import("./soc").then((m) => m.MISSIONS_SOC),
  advanced: () => import("./advanced").then((m) => m.MISSIONS_ADVANCED),
  machines: () => import("./machines").then((m) => m.MISSIONS_MACHINES),
};

/** Which family holds each ladder. scripts/check-missions.ts fails if this goes stale. */
export const RANGE_FAMILY: Record<string, keyof typeof FAMILIES> = {
  "first-steps": "zero", navigate: "zero", "find-things": "zero", pipes: "zero", perms: "zero", suid: "zero", procs: "zero",
  audit: "later", triage: "later", sandbox: "later",
  siem: "soc", behaviour: "soc", phish: "soc", detect: "soc", timeline: "soc", risk: "soc",
  iam: "advanced", trail: "advanced", forensics: "advanced", intel: "advanced", malware: "advanced", vuln: "advanced", appsec: "advanced", supply: "advanced", aiops: "advanced", k8s: "advanced", evals: "advanced",
  lantern: "machines", harbor: "machines", switchboard: "machines", parrot: "machines", keystone: "machines",
};

export async function loadRange(id: string): Promise<RangeSet | null> {
  const family = RANGE_FAMILY[id];
  const load = family ? FAMILIES[family] : undefined;
  if (!load) return null;
  return (await load())[id] ?? null;
}
