/** The roadmap's structured data, parsed from the PDF. */
import monthsJson from "@/data/months.json";
import projectsJson from "@/data/projects.json";

export interface Res {
  text: string;
  url: string | null;
}

export interface Month {
  n: number;
  phase: number;
  title: string;
  hours: string;
  goal: string;
  topics?: string[];
  trackSprint?: string[];
  skills?: string[];
  weeks?: string[];
  labs?: Res[];
  tools?: string;
  free?: Res[];
  paid?: Res[];
  ai?: string;
  portfolio?: string;
  career?: string[];
  gate?: string[];
  jobs?: string;
  note?: { title: string; text: string };
}

export interface Project {
  id: string;
  title: string;
  when: string;
  objective?: string;
  skills?: string;
  tools?: string;
  plan?: string[];
  deliverables?: string;
  presentation?: string;
  pitch?: string;
  bar?: string;
}

export const MONTHS = monthsJson as Month[];
export const PROJECTS = projectsJson as Project[];

export const PHASES = [
  { n: 0, title: "Day zero", months: "Before Month 1", question: "What is security, and what's inside a computer?" },
  { n: 1, title: "Foundations", months: "Months 1–6", question: "How do computers, networks, operating systems, the web and cryptography actually work?" },
  { n: 2, title: "Core security", months: "Months 7–12", question: "How are real environments attacked, detected, responded to and governed?" },
  { n: 3, title: "Advanced core + lean", months: "Months 13–18", question: "What do cloud, forensics, threat intel, malware, AppSec and AI security demand?" },
  { n: 4, title: "Specialize & launch", months: "Months 19–24", question: "How do I become the obvious hire for one role?" },
];

export const phaseOf = (month: number) => (month === 0 ? 0 : (MONTHS[month - 1]?.phase ?? 4));

/** Skill targets from the roadmap: level at M3, M6, M12, M18, M24 ("T" = your track reaches 3–4). */
export const SKILLS: { area: string; targets: string[] }[] = [
  { area: "Networking & protocols", targets: ["2", "3", "3", "3", "3–4"] },
  { area: "Linux", targets: ["2", "2", "3", "3", "3"] },
  { area: "Windows & Active Directory", targets: ["0", "2", "3", "3", "3–4"] },
  { area: "Scripting (Python, Bash, PowerShell)", targets: ["1", "2", "3", "3", "3–4"] },
  { area: "Web application security", targets: ["0", "1", "3", "3", "T"] },
  { area: "Cryptography (applied)", targets: ["0", "2", "2", "2", "2"] },
  { area: "SOC / SIEM operations", targets: ["0", "1", "3", "3", "T"] },
  { area: "Detection engineering", targets: ["0", "0", "2", "3", "T"] },
  { area: "Incident response & DFIR", targets: ["0", "0", "2", "3", "T"] },
  { area: "Threat intelligence", targets: ["0", "0", "1", "2", "T"] },
  { area: "Malware analysis", targets: ["0", "0", "0", "2", "2"] },
  { area: "Penetration testing", targets: ["0", "0", "2", "2", "T"] },
  { area: "Cloud security", targets: ["0", "0", "1", "3", "T"] },
  { area: "Containers & Kubernetes", targets: ["0", "1", "1", "2", "2–3"] },
  { area: "AppSec & DevSecOps", targets: ["0", "1", "2", "3", "T"] },
  { area: "GRC & risk", targets: ["1", "1", "2", "2", "T"] },
  { area: "Security architecture", targets: ["0", "0", "1", "2", "2–3"] },
  { area: "AI / LLM security", targets: ["1", "1", "2", "3", "T"] },
  { area: "Technical writing & reporting", targets: ["1", "2", "3", "3", "4"] },
  { area: "Communication & presenting", targets: ["1", "1", "2", "3", "3"] },
];

export const LEVELS = ["None", "Aware", "Working", "Proficient", "Advanced"];
