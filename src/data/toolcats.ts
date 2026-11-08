/**
 * Folders in tools/, in reading order.
 *
 * Every tool page has a `use` tier, and check-content enforces it:
 *   open  defensive or everyday tools: full usage
 *   own   recon, scanning and audit: usage aimed at your own lab or domain
 *   know  attack tools: how they work and how to detect them, with no commands
 */
export interface ToolCat {
  folder: string;
  title: string;
  blurb: string;
}

export const TOOL_CATS: ToolCat[] = [
  { folder: "01-recon-osint", title: "Reconnaissance and OSINT", blurb: "What the Internet already says about a target, usually your own." },
  { folder: "02-scanning", title: "Scanning and enumeration", blurb: "Finding hosts, ports and services." },
  { folder: "03-traffic", title: "Traffic and network analysis", blurb: "Seeing what really crosses the wire." },
  { folder: "04-web", title: "Web application testing", blurb: "Proxies, discovery and scanners for web apps." },
  { folder: "05-vulnerability", title: "Vulnerability scanning and audit", blurb: "Finding known flaws and weak settings." },
  { folder: "06-passwords", title: "Passwords and credentials", blurb: "How passwords get attacked, and how to audit yours." },
  { folder: "07-wireless", title: "Wireless, Bluetooth and radio", blurb: "Monitoring and testing what's in the air." },
  { folder: "08-frameworks", title: "Attack frameworks and C2", blurb: "Names you'll meet in reports, and how to detect them." },
  { folder: "09-active-directory", title: "Active Directory tooling", blurb: "What these tools are, and what they leave behind." },
  { folder: "10-built-in", title: "Built-in tools attackers abuse", blurb: "Normal system programs, and how to spot misuse." },
  { folder: "11-hardening", title: "Host hardening and audit", blurb: "Checking and locking down Linux and Windows." },
  { folder: "12-detection", title: "Detection and monitoring", blurb: "IDS, SIEM, EDR and log tooling." },
  { folder: "13-forensics", title: "Forensics and incident response", blurb: "Collecting and reading evidence." },
  { folder: "14-reversing", title: "Malware analysis and reversing", blurb: "Taking programs apart safely." },
  { folder: "15-cloud", title: "Cloud and containers", blurb: "Auditing cloud accounts, images and clusters." },
  { folder: "16-appsec", title: "Code and supply chain", blurb: "Finding flaws and secrets in what you build." },
  { folder: "17-crypto", title: "Cryptography and secrets", blurb: "Everyday tools for keys, TLS and encoding." },
  { folder: "18-intel", title: "Threat intelligence and deception", blurb: "Sharing what you know, and setting traps." },
  { folder: "19-mobile-hardware", title: "Mobile, firmware and hardware", blurb: "Phones, embedded devices and radios." },
];
