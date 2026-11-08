/**
 * The field's domains: the folders in modules/. `lessons` lists the numbers of
 * the roadmap lessons that already teach the basics, so a domain's README can
 * give the whole picture without moving those lessons off the roadmap.
 */
export interface Domain {
  id: string;
  folder: string;
  title: string;
  blurb: string;
  /** Domain ids to study first. */
  needs: string[];
  lessons: number[];
}

export const DOMAINS: Domain[] = [
  { id: "01", folder: "01-networking", title: "Networking and protocols", blurb: "What really crosses the wire, and how to see it, shape it and abuse it.", needs: [], lessons: [15, 16, 17, 18, 19, 20, 22] },
  { id: "02", folder: "02-operating-systems", title: "Operating systems and privilege escalation", blurb: "Linux and Windows from the kernel up, how an account climbs, and Active Directory.", needs: ["01"], lessons: [3, 4, 7, 8, 9, 30, 31, 32, 33, 34, 43, 57] },
  { id: "03", folder: "03-cryptography", title: "Cryptography", blurb: "The maths, the constructions, and the many ways that sound primitives get misused.", needs: ["01"], lessons: [38, 39, 40] },
  { id: "04", folder: "04-web", title: "Web security", blurb: "The browser and server model, every injection class, and the fixes that hold.", needs: ["01", "03"], lessons: [35, 36, 37, 46, 47, 48, 49, 50] },
  { id: "05", folder: "05-binary", title: "Application and binary security", blurb: "How programs fail at the level of memory, how mitigations answer, and how bugs are found.", needs: ["02"], lessons: [30] },
  { id: "06", folder: "06-malware-edr", title: "Malware, evasion and EDR", blurb: "What malware does, how it hides, and how endpoint detection actually sees it.", needs: ["02", "05"], lessons: [33, 67] },
  { id: "07", folder: "07-network-security", title: "Network security and infrastructure", blurb: "Firewalls, sensors, VPNs and architectures that assume the attacker is already in.", needs: ["01"], lessons: [21, 23, 74] },
  { id: "08", folder: "08-blue-team", title: "Blue team and defensive operations", blurb: "Detection platforms, threat hunting, and forensics that holds up.", needs: ["02", "06", "07"], lessons: [51, 52, 54, 55, 58, 59, 65] },
  { id: "09", folder: "09-threat-intel", title: "Threat intelligence and frameworks", blurb: "Shared models of the adversary, threat modelling methods, and open-source reconnaissance.", needs: ["01"], lessons: [11, 53, 66, 68] },
  { id: "10", folder: "10-cloud", title: "Cloud and container security", blurb: "AWS, Azure and GCP attack paths, container isolation, Kubernetes and infrastructure as code.", needs: ["02", "11"], lessons: [29, 63, 64, 74] },
  { id: "11", folder: "11-identity", title: "Identity and access", blurb: "Formal models, authentication mechanics, and federation attacks.", needs: ["03", "04"], lessons: [41, 42, 44, 45] },
  { id: "12", folder: "12-grc", title: "Governance, risk, compliance, ethics and law", blurb: "Quantified risk, regulation, disclosure, and where the legal lines sit.", needs: [], lessons: [1, 2, 10, 56, 60, 61, 62] },
  { id: "13", folder: "13-supply-chain", title: "Software supply chain and secure SDLC", blurb: "Attacks on what you build with, and the maturity models that answer them.", needs: ["04"], lessons: [68, 69] },
  { id: "14", folder: "14-ai-security", title: "AI and machine-learning security", blurb: "Adversarial machine learning beyond the prompt.", needs: ["04"], lessons: [70, 71, 72, 73, 75, 76, 77] },
  { id: "15", folder: "15-wireless-mobile-hardware-ot", title: "Wireless, mobile, hardware, OT and physical", blurb: "Security below and beside the operating system, where bugs can't always be patched.", needs: ["01", "02", "05"], lessons: [] },
  { id: "16", folder: "16-human-privacy-research", title: "Human factors, privacy and research foundations", blurb: "People, privacy, and how a Master's student reads and does security research.", needs: [], lessons: [54] },
];
