/**
 * Hand review of the automatic verdicts, against the course as it stood on
 * 7 Nov 2026 (78 lessons, before any module existed).
 *
 * A word count can't judge depth. Every section heading in the course was read,
 * and every disputed row was checked in context. These overrides apply only to
 * the baseline: once a module teaches a topic, audit.ts finds it on its own.
 *
 * The bar:
 *   present  a section that explains the mechanism AND the defence
 *   partial  a table row, a definition, or a section with only one side
 *   missing  absent, or a passing mention that teaches nothing
 */
import type { Verdict } from "./taxonomy";

const P = "present" as const;
const H = "partial" as const;
const M = "missing" as const;

export const REVIEW: Record<string, { verdict: Verdict; why: string }> = {
  // The word count was fooled upward: the hits don't mean what the row means.
  "seccomp, namespaces, cgroups": { verdict: M, why: "Every hit is a Kubernetes namespace, or one seccompProfile line in a manifest. Linux namespaces and cgroups are never explained." },
  "IPv6 addressing, NDP, SLAAC": { verdict: H, why: "One section titled 'IPv6, briefly'. No NDP or SLAAC mechanics." },
  "IP header fields, TTL, fragmentation": { verdict: M, why: "All seven hits are DNS cache TTLs, not the IP header field." },
  "SSH local, remote and dynamic forwarding": { verdict: M, why: "Every hit is NAT port forwarding on a firewall. SSH forwarding is never taught." },
  "Azure: Entra ID, RBAC, managed identity": { verdict: H, why: "Entra ID has a section. Azure RBAC is one table cell, and managed identities are absent." },
  "CVE, CWE, CAPEC": { verdict: H, why: "CVE and CWE are taught. CAPEC appears nowhere." },
  "Kerberos delegation": { verdict: M, why: "Not taught." },

  // The word count was fooled downward: the topic has a section in other words.
  "OSI and TCP/IP layering, encapsulation": { verdict: P, why: "Lesson 17, 'Layers: envelopes inside envelopes'." },
  "VLANs and 802.1Q trunking": { verdict: H, why: "Lesson 17 has a VLANs section, with no tagging or trunk mechanics." },
  "DNS attacks: cache poisoning, hijacking": { verdict: H, why: "Lesson 19, 'How DNS is abused', gives one table row each." },
  "Display filters and following streams": { verdict: P, why: "Lesson 20, 'Reading Wireshark'." },
  "Detecting scans": { verdict: P, why: "Lesson 22, 'What a defender sees'." },
  "Email transport: SMTP, IMAP, POP3": { verdict: P, why: "Lesson 54, 'How email really travels'." },
  "Services and the Service Control Manager": { verdict: P, why: "Lesson 31, 'Services and scheduled tasks'." },
  "Scheduled tasks and WMI": { verdict: P, why: "Lessons 31 and 32." },
  "PowerShell logging and constrained language": { verdict: P, why: "Lesson 34, 'Script block logging'." },
  "Windows persistence: run keys, tasks, services": { verdict: P, why: "Lesson 32, 'The eight places to know'." },
  "AD hardening: tiering, LAPS, Protected Users": { verdict: P, why: "Lesson 43, 'Tiering', with LAPS in lesson 57." },
  "AES as a user": { verdict: P, why: "Lesson 38, 'Symmetric encryption'." },
  "MACs and HMAC": { verdict: P, why: "Lesson 38, 'HMAC: integrity with a key'." },
  "Hash properties: preimage, collision": { verdict: P, why: "Lesson 38, 'Hashes'." },
  "RSA": { verdict: H, why: "A glossary line and 'Two keys' in lesson 39. The mathematics isn't taught." },
  "Diffie-Hellman and forward secrecy": { verdict: P, why: "Lesson 39, 'Key exchange'." },
  "Digital signatures": { verdict: P, why: "Lesson 39, 'Digital signatures'." },
  "X.509, CAs and chains of trust": { verdict: P, why: "Lesson 39, 'Certificates and the chain of trust'." },
  "One-time pad and XOR": { verdict: H, why: "The Dojo practises XOR, but no prose explains the one-time pad." },
  "Password cracking: hashcat, John, rainbow tables": { verdict: H, why: "Lesson 40 explains rainbow tables. No cracking tool or method appears." },
  "Cookies and flags: Secure, HttpOnly, SameSite": { verdict: P, why: "Lesson 36, 'Cookie flags'." },
  "Session management": { verdict: P, why: "Lesson 36, 'Sessions'." },
  "A03 Software Supply Chain Failures": { verdict: P, why: "Lesson 69 is about exactly this, under other words." },
  "A04 Cryptographic Failures": { verdict: P, why: "Lessons 38 to 40." },
  "A06 Insecure Design": { verdict: P, why: "Lesson 68." },
  "A07 Authentication Failures": { verdict: P, why: "Lessons 40 to 42." },
  "A02 Security Misconfiguration": { verdict: H, why: "A table row in lesson 46, covered piecemeal elsewhere." },
  "A08 Software or Data Integrity Failures": { verdict: H, why: "A table row, with part of it in lesson 69." },
  "A09 Logging and Alerting Failures": { verdict: H, why: "A table row. Lessons 52 and 58 teach logging, not the failure." },
  "A10 Mishandling of Exceptional Conditions": { verdict: H, why: "A table row only." },
  "Parameterised queries": { verdict: P, why: "Lesson 37 has a section, and lesson 47 reuses it." },
  "Output encoding": { verdict: P, why: "Lesson 47, 'XSS: encoding on output'." },
  "Input validation": { verdict: P, why: "Lesson 47, 'One root cause'." },
  "SAST, DAST, IAST": { verdict: P, why: "Lesson 68, 'The pipeline of checks'." },
  Semgrep: { verdict: P, why: "Walked through in project P05." },
  "Mass assignment": { verdict: P, why: "Lesson 48, 'Saving what you shouldn't', with practice." },
  "Resource exhaustion and rate limiting (CWE-770)": { verdict: P, why: "Lesson 49, 'Limits'." },
  "OWASP API Security Top 10": { verdict: P, why: "Lesson 49, 'The API Top 10'." },
  "Malware taxonomy: virus, worm, trojan, RAT, loader": { verdict: P, why: "Lesson 67, 'What malware does'." },
  "Static triage: hashes, strings, imports, entropy": { verdict: P, why: "Lesson 67, 'Static triage'." },
  "capa, FLOSS, PEStudio, Detect It Easy": { verdict: P, why: "Walked through in project P13." },
  ufw: { verdict: P, why: "Lesson 25, 'The host firewall'." },
  "Zero Trust principles, NIST SP 800-207": { verdict: P, why: "Lesson 74, 'Zero trust'." },
  "Log sources and pipelines": { verdict: P, why: "Lesson 52, 'What each log proves'." },
  Sigma: { verdict: P, why: "Lesson 58, 'A Sigma rule, line by line'." },
  "osquery, Velociraptor": { verdict: P, why: "Walked through in project P08." },
  "IR lifecycle, NIST SP 800-61r3": { verdict: P, why: "Lesson 59." },
  "Containment decisions": { verdict: P, why: "Lesson 59, 'Containment is a trade-off'." },
  "Post-incident review": { verdict: P, why: "Lesson 59, 'After the incident'." },
  "Order of volatility, chain of custody": { verdict: P, why: "Lesson 65, 'The principles'." },
  "Disk imaging and write blocking": { verdict: P, why: "Lesson 65 and project P11." },
  "FTK Imager, KAPE, Eric Zimmerman tools": { verdict: P, why: "Walked through in project P11." },
  "Memory forensics": { verdict: H, why: "Lesson 65 has a short 'Memory' section. Volatility isn't practised in depth." },
  "Windows artifacts: Prefetch, Amcache, ShimCache, LNK": { verdict: P, why: "Lesson 65, 'Windows artifacts'." },
  "Pyramid of Pain": { verdict: P, why: "Lesson 53, 'The Pyramid of Pain'." },
  "Diamond Model": { verdict: P, why: "Lesson 66, 'The Diamond Model'." },
  "IOCs versus TTPs": { verdict: P, why: "Lesson 53, 'Clues and habits'." },
  "Intelligence lifecycle and levels": { verdict: P, why: "Lesson 66, 'The cycle' and 'Levels'." },
  "MISP, OpenCTI": { verdict: H, why: "MISP is used in P12. OpenCTI is absent." },
  "ATT&CK v20 tactics, including Stealth and Defense Impairment": { verdict: P, why: "Lesson 11 lists all 15 and explains the split." },
  "Shared responsibility": { verdict: P, why: "Lesson 63, 'Shared responsibility'." },
  "AWS IAM: policies, roles, evaluation": { verdict: P, why: "Lesson 63, 'Reading a policy' and 'How AWS decides'." },
  "Prowler, ScoutSuite": { verdict: P, why: "Walked through in project P10." },
  "Dockerfile and image hardening": { verdict: P, why: "Lesson 69, 'Hardened containers'." },
  "Trivy, Grype": { verdict: P, why: "Walked through in project P14." },
  "Checkov, tfsec, KICS": { verdict: P, why: "Walked through in project P14." },
  "Authentication versus authorisation": { verdict: P, why: "Lesson 41." },
  "Least privilege, separation of duties": { verdict: P, why: "Lesson 7, 'Least privilege', and lesson 41." },
  "Privileged access management, just-in-time": { verdict: P, why: "Lesson 41, 'Reducing standing privilege'." },
  "Identity governance: joiner-mover-leaver, SCIM": { verdict: P, why: "Lesson 41, 'The identity lifecycle'." },
  "MFA factors and strength": { verdict: P, why: "Lesson 41, 'Authentication factors'." },
  "Risk language: asset, threat, vulnerability, likelihood, impact": { verdict: P, why: "Lesson 10." },
  "Risk assessment methods": { verdict: P, why: "Lesson 60." },
  "Authorisation, scope and rules of engagement": { verdict: P, why: "Lessons 2 and 56." },
  "Secure SDLC, shift left": { verdict: P, why: "Lesson 68." },
  "Security code review": { verdict: P, why: "Lesson 68, 'Secure code review'." },
  "Security requirements and abuse cases": { verdict: P, why: "Lesson 68, 'Requirements, not opinions'." },
  "Syft, OSV-Scanner, dependabot": { verdict: P, why: "Syft is walked through in P14." },
  "Secrets scanning": { verdict: P, why: "Walked through in project P03." },
  "OWASP LLM Top 10": { verdict: P, why: "Guide d2 and lesson 71." },
  "Prompt injection, direct and indirect": { verdict: P, why: "Lesson 71, 'Direct and indirect'." },
  "Agent security and tool abuse": { verdict: P, why: "Lesson 72." },
  "Machine learning for detection": { verdict: P, why: "Lesson 76." },
  "AI-enabled offence: deepfakes, phishing at scale": { verdict: P, why: "Lesson 75, 'What attackers do with it'." },
  "Evasion: adversarial examples": { verdict: H, why: "Lesson 76, 'Attacks on models', is a short overview." },
  "Data poisoning": { verdict: H, why: "Lesson 76, 'Attacks on models', is a short overview." },
  "Model extraction and membership inference": { verdict: H, why: "Lesson 76, 'Attacks on models', is a short overview." },
  "Phishing analysis": { verdict: P, why: "Lesson 54." },
  "Measuring security: base rates, ROC curves": { verdict: P, why: "Lessons 76 and 77." },
  "Security culture and awareness": { verdict: H, why: "Lesson 62, 'Suppliers and awareness', touches it." },
};

/**
 * Module credit is a word count too. These modules name a topic several times
 * without teaching it, so they can't claim the row. Another module still can.
 */
export const NOT_TAUGHT_BY: Record<string, string> = {
  "Mimikatz, Rubeus, Impacket (awareness)": "02-07-windows-credential-stores",
  openssl: "01-01-netcat-and-socat",
  "WebSockets security": "01-10-proxies-pivoting-and-tunnels",
  "strings, file, objdump, readelf": "02-02-linux-boot-and-linking",
  "Obfuscation and anti-debugging": "02-09-windows-defences",
  "Ransomware and double extortion": "01-08-lan-and-legacy-protocols",
  Botnets: "01-13-denial-of-service",
  "Rootkits and bootkits": "02-05-linux-persistence-and-audit",
  "Code signing abuse, BYOVD": "02-08-windows-privilege-escalation",
  "EDR architecture: sensors, kernel callbacks, telemetry": "02-09-windows-defences",
  "Network access control, 802.1X": "01-04-layer-2-attacks",
  "Bastion hosts and jump boxes": "01-09-ssh-internals-and-forwarding",
};

/**
 * Hand review of the "now" column, after all the modules were written. Regexes
 * undercount: "NoSQL" alone misses the row for "NoSQL injection". So each entry
 * names the module and section that really teaches it. Topics that only appear
 * in a tools table stay partial. Attack-mechanics topics stay open on purpose:
 * see "Stopped, don't retry" in NOTES.md.
 */
export const NOW: Record<string, { verdict: Verdict; by?: string; why: string }> = {
  "DNS attacks: cache poisoning, hijacking": { verdict: "present", by: "01-05-dns-in-depth", why: "Section 'Poisoning'. The word count credited the web cache module by mistake." },
  "DNS tunnelling and exfiltration": { verdict: "present", by: "01-05-dns-in-depth", why: "Section 'Tunnelling', with detection features." },
  "openssl s_client": { verdict: "partial", by: "03-08-tls-internals", why: "Used in tools and exercises, not taught as a tool." },
  "NetFlow and connection metadata": { verdict: "present", by: "01-06-packet-analysis-in-depth", why: "Flow records section, and retention design." },
  "Protocol tunnelling and its detection": { verdict: "present", by: "01-10-proxies-pivoting-and-tunnels", why: "Section 'hiding in protocols' and the detection list." },
  "POSIX ACLs": { verdict: "present", by: "02-03-linux-confinement", why: "Section on discretionary access." },
  "The docker group as root": { verdict: "present", by: "02-04-linux-privilege-escalation", why: "Section 'Groups that equal root'." },
  "Service misconfiguration: unquoted paths, weak ACLs": { verdict: "present", by: "02-08-windows-privilege-escalation", why: "Section 'Services'." },
  "Password spraying": { verdict: "present", by: "11-02-authentication-mechanics", why: "Section on guessing at scale, from the detection side." },
  "CBC bit flipping and ECB cut-and-paste": { verdict: "present", by: "03-09-breaking-bad-crypto", why: "Section 'Unauthenticated encryption'." },
  "A02 Security Misconfiguration": { verdict: "present", by: "04-14-owasp-2025-gaps", why: "Its own section." },
  "A08 Software or Data Integrity Failures": { verdict: "present", by: "04-14-owasp-2025-gaps", why: "Its own section." },
  "NoSQL injection": { verdict: "present", by: "04-03-injection-beyond-sql", why: "Section 'NoSQL'." },
  "Code injection (CWE-94)": { verdict: "present", by: "04-03-injection-beyond-sql", why: "Section 'Code evaluation'." },
  "Server-side template injection": { verdict: "present", by: "04-03-injection-beyond-sql", why: "Section 'Templates'." },
  "LDAP and XPath injection": { verdict: "partial", by: "04-03-injection-beyond-sql", why: "One table row each." },
  "sqlmap": { verdict: "partial", by: "04-02-sql-injection-in-depth", why: "Named in the tools table, for labs. Not taught." },
  "Nikto, wpscan": { verdict: "partial", by: "04-13-testing-workflow-burp", why: "Named in a discovery table." },
  "Path traversal (CWE-22), LFI/RFI": { verdict: "present", by: "04-08-files-traversal-and-uploads", why: "Section on paths, from the code reviewer's side." },
  "File upload flaws (CWE-434)": { verdict: "present", by: "04-08-files-traversal-and-uploads", why: "Section 'Uploads'." },
  "Business logic flaws": { verdict: "present", by: "04-11-logic-flaws-and-races", why: "The module's main subject." },
  "Heap overflow (CWE-122)": { verdict: "partial", by: "05-04-heap-and-integer-bugs", why: "Spatial errors are classed, but the heap case isn't explained." },
  "NULL dereference (CWE-476)": { verdict: "partial", by: "05-05-exploitation-concepts", why: "A triage note only." },
  "Control-flow hijack: what it means": { verdict: "partial", by: "05-03-stack-memory-corruption", why: "Explained as why the bug matters, deliberately not how it's done." },
  "Return-oriented programming": { verdict: "partial", by: "05-06-exploit-mitigations", why: "Named as what CFI answers, deliberately not taught." },
  "Kernel attack surface": { verdict: "present", by: "05-10-symbolic-execution-and-kernels", why: "Section 'The kernel'." },
  "Fileless techniques": { verdict: "present", by: "06-03-living-off-the-land", why: "Explained with logging and memory defences." },
  "How antivirus decides: signature, heuristic, ML, reputation": { verdict: "present", by: "06-05-evasion-concepts", why: "Section 'how a product decides'." },
  "Behavioural detection versus signatures": { verdict: "present", by: "06-05-evasion-concepts", why: "Same section, and the EDR module's detection layers." },
  "Process injection and hollowing (concept)": { verdict: "partial", by: "08-06-memory-forensics", why: "Detection only, deliberately not how it's done." },
  "Network forensics": { verdict: "present", by: "08-08-network-and-cloud-forensics", why: "Section on working a capture." },
  "Cloud forensics": { verdict: "present", by: "08-08-network-and-cloud-forensics", why: "Sections on cloud evidence and response." },
  "Anti-forensics": { verdict: "present", by: "08-09-anti-forensics-and-reporting", why: "The module's first half." },
  "Threat actors: APTs, criminals, hacktivists, insiders": { verdict: "present", by: "09-03-threat-actors", why: "Its opening section." },
  "The underground economy: IABs, RaaS": { verdict: "present", by: "09-03-threat-actors", why: "Section 'Crime as a supply chain'." },
  "Google dorking": { verdict: "partial", by: "09-05-osint-and-recon", why: "One paragraph, with no examples." },
  "External attack surface management": { verdict: "present", by: "09-05-osint-and-recon", why: "Its advanced section." },
  "Container escape classes": { verdict: "present", by: "10-05-container-escape-and-runtime", why: "Causes and defences, deliberately not techniques." },
  "Kubernetes attack paths": { verdict: "present", by: "10-06-kubernetes-attack-paths", why: "From the defender's side." },
  "Credential stuffing and spraying": { verdict: "present", by: "11-02-authentication-mechanics", why: "Section on guessing at scale." },
  "SAML attacks: signature wrapping, Golden SAML": { verdict: "present", by: "11-04-saml-attacks", why: "Root causes and detection." },
  "French law: Godfrain": { verdict: "partial", by: "12-01-computer-crime-law", why: "One table row." },
  "Codes of ethics": { verdict: "present", by: "12-02-disclosure-and-ethics", why: "Section on ethics beyond the rules." },
  "Handling sensitive data during testing": { verdict: "present", by: "12-02-disclosure-and-ethics", why: "Section 'Handling what you find'." },
  "Data poisoning": { verdict: "present", by: "14-01-adversarial-ml", why: "Section 'Poisoning and backdoors'." },
  "aircrack-ng, Kismet": { verdict: "partial", by: "15-01-wifi-security", why: "Tools table only." },
  "Mobile attacks: overlay, intent abuse, pinning bypass": { verdict: "present", by: "15-03-android-security", why: "Sections on components and real mobile malware." },
  "IEC 62443": { verdict: "present", by: "15-08-ot-and-ics", why: "Named as the standard, with zones and conduits." },
  "Usable security": { verdict: "present", by: "16-02-usable-security", why: "The module's subject." },
  "Security culture and awareness": { verdict: "present", by: "16-02-usable-security", why: "Section on phishing tests and culture." },
  "Privacy engineering principles": { verdict: "present", by: "16-03-privacy-engineering", why: "The module's subject." },
  // A second pass: every row credited on three or fewer mentions, with no heading, was read in context.
  "scapy and hping: crafted packets": { verdict: "partial", by: "01-02-ip-layer-and-icmp", why: "Tools table and a reading link only." },
  "Enumeration tools: winPEAS, Seatbelt, PowerUp": { verdict: "partial", by: "02-08-windows-privilege-escalation", why: "One tools table row." },
  "IDA, radare2, Binary Ninja": { verdict: "partial", by: "05-07-static-reverse-engineering", why: "A comparison table only. Ghidra is what's taught." },
  "Information leaks defeating ASLR": { verdict: "partial", by: "05-05-exploitation-concepts", why: "Named as a requirement, deliberately not taught." },
  "MITRE ATLAS": { verdict: "partial", by: "14-01-adversarial-ml", why: "Named and linked, not taught." },
  "Certificate pinning": { verdict: "present", by: "03-07-pki-in-depth", why: "Explained with its risks. The word count credited dependency pinning by mistake." },
  "Social engineering principles": { verdict: "present", by: "16-01-social-engineering", why: "Section 'why it works'. The word count credited the physical security module." },
};
