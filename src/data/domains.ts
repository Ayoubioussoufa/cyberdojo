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

/** French names and blurbs for the domains, by id. */
export const DOMAINS_FR: Record<string, { title: string; blurb: string }> = {
  "01": { title: "Réseaux et protocoles", blurb: "Ce qui passe vraiment sur le câble, et comment le voir, le façonner et l'exploiter." },
  "02": { title: "Systèmes d'exploitation et élévation de privilèges", blurb: "Linux et Windows depuis le noyau, comment un compte gagne des droits, et Active Directory." },
  "03": { title: "Cryptographie", blurb: "Les mathématiques, les constructions, et les nombreuses façons de mal utiliser de bonnes primitives." },
  "04": { title: "Sécurité web", blurb: "Le modèle navigateur et serveur, chaque classe d'injection, et les correctifs qui tiennent." },
  "05": { title: "Sécurité applicative et binaire", blurb: "Comment les programmes échouent au niveau de la mémoire, comment les protections répondent, et comment on trouve les bugs." },
  "06": { title: "Malwares, évasion et EDR", blurb: "Ce que fait un malware, comment il se cache, et comment la détection sur poste le voit vraiment." },
  "07": { title: "Sécurité réseau et infrastructure", blurb: "Pare-feu, sondes, VPN et architectures qui supposent l'attaquant déjà à l'intérieur." },
  "08": { title: "Blue team et opérations défensives", blurb: "Plateformes de détection, chasse aux menaces, et investigation qui tient la route." },
  "09": { title: "Renseignement sur les menaces et référentiels", blurb: "Des modèles partagés de l'adversaire, des méthodes de modélisation des menaces, et la reconnaissance en sources ouvertes." },
  "10": { title: "Sécurité du cloud et des conteneurs", blurb: "Chemins d'attaque AWS, Azure et GCP, isolation des conteneurs, Kubernetes et infrastructure as code." },
  "11": { title: "Identités et accès", blurb: "Modèles formels, mécanismes d'authentification, et attaques sur la fédération." },
  "12": { title: "Gouvernance, risque, conformité, éthique et droit", blurb: "Le risque chiffré, la réglementation, la divulgation, et où passent les limites légales." },
  "13": { title: "Chaîne d'approvisionnement logicielle et cycle de développement sécurisé", blurb: "Les attaques sur ce avec quoi vous construisez, et les modèles de maturité qui y répondent." },
  "14": { title: "Sécurité de l'IA et de l'apprentissage automatique", blurb: "L'apprentissage automatique adverse, au-delà du prompt." },
  "15": { title: "Sans-fil, mobile, matériel, OT et physique", blurb: "La sécurité sous et à côté du système d'exploitation, là où les bugs ne se corrigent pas toujours." },
  "16": { title: "Facteur humain, vie privée et bases de la recherche", blurb: "Les personnes, la vie privée, et comment un étudiant de master lit et mène une recherche en sécurité." },
};

/** A domain's title and blurb in the page's language. */
export const domainText = (d: Domain, lang: "en" | "fr") => (lang === "fr" ? (DOMAINS_FR[d.id] ?? d) : d);
