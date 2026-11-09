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

/** French names and blurbs for the tool folders. */
export const TOOL_CATS_FR: Record<string, { title: string; blurb: string }> = {
  "01-recon-osint": { title: "Reconnaissance et OSINT", blurb: "Ce qu'Internet dit déjà d'une cible, le plus souvent la vôtre." },
  "02-scanning": { title: "Scan et énumération", blurb: "Trouver les hôtes, les ports et les services." },
  "03-traffic": { title: "Analyse du trafic et du réseau", blurb: "Voir ce qui passe vraiment sur le câble." },
  "04-web": { title: "Tests d'applications web", blurb: "Proxys, découverte et scanners pour les applications web." },
  "05-vulnerability": { title: "Scan de vulnérabilités et audit", blurb: "Trouver les failles connues et les réglages faibles." },
  "06-passwords": { title: "Mots de passe et identifiants", blurb: "Comment les mots de passe sont attaqués, et comment auditer les vôtres." },
  "07-wireless": { title: "Sans-fil, Bluetooth et radio", blurb: "Surveiller et tester ce qui passe dans les airs." },
  "08-frameworks": { title: "Frameworks d'attaque et C2", blurb: "Des noms que vous croiserez dans les rapports, et comment les détecter." },
  "09-active-directory": { title: "Outils Active Directory", blurb: "Ce que sont ces outils, et les traces qu'ils laissent." },
  "10-built-in": { title: "Outils intégrés détournés par les attaquants", blurb: "Des programmes système ordinaires, et comment repérer leur mauvais usage." },
  "11-hardening": { title: "Durcissement et audit des hôtes", blurb: "Vérifier et verrouiller Linux et Windows." },
  "12-detection": { title: "Détection et supervision", blurb: "IDS, SIEM, EDR et outils de journaux." },
  "13-forensics": { title: "Investigation et réponse à incident", blurb: "Collecter et lire les preuves." },
  "14-reversing": { title: "Analyse de malwares et rétro-ingénierie", blurb: "Démonter des programmes sans risque." },
  "15-cloud": { title: "Cloud et conteneurs", blurb: "Auditer les comptes cloud, les images et les clusters." },
  "16-appsec": { title: "Code et chaîne d'approvisionnement", blurb: "Trouver les failles et les secrets dans ce que vous construisez." },
  "17-crypto": { title: "Cryptographie et secrets", blurb: "Des outils de tous les jours pour les clés, TLS et l'encodage." },
  "18-intel": { title: "Renseignement sur les menaces et leurres", blurb: "Partager ce que vous savez, et tendre des pièges." },
  "19-mobile-hardware": { title: "Mobile, firmware et matériel", blurb: "Téléphones, systèmes embarqués et radios." },
};

/** A tool folder's title and blurb in the page's language. */
export const catText = (c: ToolCat, lang: "en" | "fr") => (lang === "fr" ? (TOOL_CATS_FR[c.folder] ?? c) : c);
