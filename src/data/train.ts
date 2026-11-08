/**
 * Where to learn an attack hands-on. This site teaches attack topics from the
 * defender's side only (root cause, traces, fixes), so every attack subject
 * points out to legal platforms that teach the offensive half properly.
 *
 * Each URL was checked on 8 Nov 2026: HTB Academy slugs come from its catalogue
 * page, PortSwigger and pwn.college paths from their topic indexes, the rest are
 * the projects' own homes. TryHackMe answered every automated request with 429,
 * so none of its room links could be confirmed, and none are listed.
 * `pnpm test:content` checks the shape: known slugs, https or a lab's own http.
 */
export interface TrainLink {
  label: string;
  url: string;
}

const htb = (slug: string, label: string): TrainLink => ({ label: `${label} (HTB Academy)`, url: `https://academy.hackthebox.com/course/preview/${slug}` });
const ps = (path: string, label: string): TrainLink => ({ label: `${label} (Web Security Academy)`, url: `https://portswigger.net/web-security/${path}` });
const pwn = (path: string, label: string): TrainLink => ({ label: `${label} (pwn.college)`, url: `https://pwn.college/${path}/` });
const lab = (url: string, label: string): TrainLink => ({ label, url });

const GOAD = lab("https://github.com/Orange-Cyberdefense/GOAD", "GOAD, Game of Active Directory: a vulnerable AD lab you build at home");

/** Keyed by module slug (NN-MM-name) or lesson slug (NNNN-name). */
export const TRAIN: Record<string, TrainLink[]> = {
  // 01 networking
  "01-04-layer-2-attacks": [htb("intermediate-network-traffic-analysis", "Intermediate Network Traffic Analysis"), htb("switches-and-vlans", "Switches and VLANs")],
  "01-07-scanning-in-depth": [htb("network-enumeration-with-nmap", "Network Enumeration with Nmap"), htb("footprinting", "Footprinting")],
  "01-08-lan-and-legacy-protocols": [htb("attacking-common-services", "Attacking Common Services")],
  "01-10-proxies-pivoting-and-tunnels": [htb("pivoting-tunneling-and-port-forwarding", "Pivoting, Tunneling, and Port Forwarding")],
  "01-11-ipv6-security": [htb("ipv6", "IPv6")],
  // 02 operating systems
  "02-04-linux-privilege-escalation": [htb("linux-privilege-escalation", "Linux Privilege Escalation"), htb("gtfobins", "GTFOBins")],
  "02-06-windows-tokens-and-privileges": [htb("windows-privilege-escalation", "Windows Privilege Escalation"), htb("detecting-access-token-manipulation-attacks", "Detecting Access Token Manipulation Attacks")],
  "02-07-windows-credential-stores": [htb("password-attacks", "Password Attacks"), htb("credential-access-tradecraft-analysis", "Credential Access Tradecraft Analysis")],
  "02-08-windows-privilege-escalation": [htb("windows-privilege-escalation", "Windows Privilege Escalation")],
  // 03 cryptography
  "03-08-tls-internals": [htb("httpstls-attacks", "HTTPs/TLS Attacks")],
  "03-09-breaking-bad-crypto": [lab("https://cryptopals.com/", "The Cryptopals crypto challenges"), pwn("intro-to-cybersecurity/cryptography", "Cryptography")],
  "03-10-password-cracking": [htb("cracking-passwords-with-hashcat", "Cracking Passwords with Hashcat"), htb("password-attacks", "Password Attacks")],
  // 04 web
  "04-01-browser-defences-and-csp": [ps("cross-site-scripting/content-security-policy", "Content security policy"), ps("clickjacking", "Clickjacking")],
  "04-02-sql-injection-in-depth": [ps("sql-injection", "SQL injection"), htb("sql-injection-fundamentals", "SQL Injection Fundamentals"), htb("blind-sql-injection", "Blind SQL Injection"), htb("advanced-sql-injections", "Advanced SQL Injections")],
  "04-03-injection-beyond-sql": [ps("os-command-injection", "OS command injection"), ps("server-side-template-injection", "Server-side template injection"), ps("nosql-injection", "NoSQL injection"), ps("xxe", "XXE injection"), htb("command-injections", "Command Injections"), htb("introduction-to-nosql-injection", "Introduction to NoSQL Injection")],
  "04-04-xss-in-depth": [ps("cross-site-scripting", "Cross-site scripting"), ps("dom-based", "DOM-based vulnerabilities"), htb("cross-site-scripting-xss", "Cross-Site Scripting (XSS)"), htb("advanced-xss-and-csrf-exploitation", "Advanced XSS and CSRF Exploitation")],
  "04-05-client-side-attacks": [ps("csrf", "CSRF"), ps("cors", "CORS"), ps("clickjacking", "Clickjacking"), ps("websockets", "WebSockets"), ps("prototype-pollution", "Prototype pollution")],
  "04-06-authentication-and-jwt-attacks": [ps("authentication", "Authentication"), ps("jwt", "JWT attacks"), htb("broken-authentication", "Broken Authentication"), htb("jwt-attacks-and-detection", "JWT Attacks and Detection")],
  "04-07-ssrf-in-depth": [ps("ssrf", "SSRF"), htb("server-side-attacks", "Server-side Attacks")],
  "04-08-files-traversal-and-uploads": [ps("file-path-traversal", "Path traversal"), ps("file-upload", "File upload vulnerabilities"), htb("file-inclusion", "File Inclusion"), htb("file-upload-attacks", "File Upload Attacks")],
  "04-09-deserialization": [ps("deserialization", "Insecure deserialization"), htb("introduction-to-deserialization-attacks", "Introduction to Deserialization Attacks"), htb("advanced-deserialization-attacks", "Advanced Deserialization Attacks")],
  "04-10-desync-and-cache-attacks": [ps("request-smuggling", "HTTP request smuggling"), ps("web-cache-poisoning", "Web cache poisoning"), ps("web-cache-deception", "Web cache deception"), htb("http-attacks", "HTTP Attacks"), htb("abusing-http-misconfigurations", "Abusing HTTP Misconfigurations")],
  "04-11-logic-flaws-and-races": [ps("logic-flaws", "Business logic vulnerabilities"), ps("race-conditions", "Race conditions"), htb("parameter-logic-bugs", "Parameter Logic Bugs")],
  "04-12-api-security-graphql-grpc": [ps("api-testing", "API testing"), ps("graphql", "GraphQL API vulnerabilities"), htb("api-attacks", "API Attacks"), htb("attacking-graphql", "Attacking GraphQL"), htb("web-service--api-attacks", "Web Service & API Attacks")],
  "04-13-testing-workflow-burp": [ps("getting-started", "Getting started"), htb("using-web-proxies", "Using Web Proxies")],
  "04-14-owasp-2025-gaps": [ps("access-control", "Access control"), ps("information-disclosure", "Information disclosure"), ps("host-header", "HTTP Host header attacks")],
  // 05 binary
  "05-03-stack-memory-corruption": [pwn("intro-to-cybersecurity/binary-exploitation", "Binary Exploitation"), pwn("program-security/program-exploitation", "Program Exploitation"), lab("https://exploit.education/phoenix/", "Exploit Education: Phoenix"), htb("stack-based-buffer-overflows-on-linux-x86", "Stack-Based Buffer Overflows on Linux x86")],
  "05-04-heap-and-integer-bugs": [pwn("program-security/dynamic-allocator-misuse", "Dynamic Allocator Misuse"), pwn("software-exploitation/dynamic-allocator-exploitation", "Dynamic Allocator Exploitation")],
  "05-05-exploitation-concepts": [pwn("program-security/return-oriented-programming", "Return Oriented Programming"), pwn("software-exploitation/format-string-exploits", "Format String Exploits")],
  "05-07-static-reverse-engineering": [pwn("intro-to-cybersecurity/reverse-engineering", "Reverse Engineering"), lab("https://crackmes.one/", "crackmes.one, reversing puzzles shared by the community"), htb("introduction-to-ida", "Introduction to IDA")],
  "05-08-dynamic-analysis-and-debugging": [htb("introduction-to-dynamic-analysis-with-windbg", "Introduction to Dynamic Analysis with WinDbg"), lab("https://microcorruption.com/", "Microcorruption, a debugger-driven embedded CTF")],
  "05-09-fuzzing": [lab("https://github.com/antonio-morales/Fuzzing101", "Fuzzing101, ten exercises on real open-source targets"), htb("introduction-to-binary-fuzzing", "Introduction to Binary Fuzzing")],
  "05-10-symbolic-execution-and-kernels": [pwn("system-security/kernel-security", "Kernel Security"), pwn("software-exploitation/kernel-exploitation", "Kernel Exploitation")],
  // 06 malware and EDR
  "06-02-command-and-control": [htb("intro-to-c2-operations-with-sliver", "Intro to C2 Operations with Sliver"), htb("threat-hunting-for-c2-with-rita", "Threat Hunting for C2 with RITA")],
  "06-03-living-off-the-land": [htb("windows-lateral-movement", "Windows Lateral Movement"), htb("wmi-tradecraft-analysis", "WMI Tradecraft Analysis")],
  "06-05-evasion-concepts": [htb("introduction-to-windows-evasion-techniques", "Introduction to Windows Evasion Techniques")],
  "06-07-rootkits-and-bootkits": [pwn("system-security/kernel-security", "Kernel Security")],
  // 09 threat intel
  "09-05-osint-and-recon": [htb("osint-corporate-recon", "OSINT: Corporate Recon"), htb("information-gathering---web-edition", "Information Gathering - Web Edition")],
  // 10 cloud
  "10-01-aws-attack-paths": [lab("http://flaws.cloud/", "flaws.cloud, AWS mistakes as levels"), lab("http://flaws2.cloud/", "flaws2.cloud, attacker and defender paths"), lab("https://github.com/RhinoSecurityLabs/cloudgoat", "CloudGoat, vulnerable-by-design AWS in your own account")],
  "10-02-azure-security": [lab("https://github.com/ine-labs/AzureGoat", "AzureGoat, a vulnerable Azure lab in your own subscription")],
  "10-03-gcp-and-multi-cloud": [lab("https://github.com/ine-labs/GCPGoat", "GCPGoat, a vulnerable GCP lab in your own project")],
  "10-04-serverless-and-secrets": [lab("https://github.com/OWASP/Serverless-Goat", "OWASP ServerlessGoat"), lab("https://github.com/OWASP/wrongsecrets", "OWASP WrongSecrets, secrets-management challenges")],
  "10-05-container-escape-and-runtime": [lab("https://github.com/madhuakula/kubernetes-goat", "Kubernetes Goat, including container escape scenarios"), pwn("system-security/sandboxing", "Sandboxing")],
  "10-06-kubernetes-attack-paths": [lab("https://github.com/madhuakula/kubernetes-goat", "Kubernetes Goat, a vulnerable cluster you run locally")],
  // 11 identity
  "11-03-oauth-attacks": [ps("oauth", "OAuth 2.0 authentication vulnerabilities")],
  "11-04-saml-attacks": [htb("saml-vulnerabilities-and-detection", "SAML Vulnerabilities and Detection")],
  // 13 supply chain
  "13-01-dependency-attacks": [htb("supply-chain-attacks", "Supply Chain Attacks")],
  "13-02-cicd-attacks": [lab("https://github.com/cider-security-research/cicd-goat", "CI/CD Goat, a vulnerable pipeline you run locally"), htb("supply-chain-attacks", "Supply Chain Attacks")],
  // 14 AI
  "14-01-adversarial-ml": [ps("llm-attacks", "Web LLM attacks"), lab("https://gandalf.lakera.ai/", "Gandalf, a prompt injection game"), htb("prompt-injection-attacks", "Prompt Injection Attacks"), htb("ai-evasion---foundations", "AI Evasion - Foundations")],
  // 15 wireless, mobile, hardware, OT
  "15-01-wifi-security": [lab("https://wifichallengelab.com/", "WiFiChallenge Lab, a virtual Wi-Fi range"), htb("wi-fi-penetration-testing-basics", "Wi-Fi Penetration Testing Basics"), htb("attacking-wpawpa2-wi-fi-networks", "Attacking WPA/WPA2 Wi-Fi Networks")],
  "15-03-android-security": [lab("https://mas.owasp.org/crackmes/", "OWASP MAS Crackmes, Android and iOS"), htb("android-attacks", "Android Attacks"), htb("android-application-static-analysis", "Android Application Static Analysis")],
  "15-04-ios-and-mobile-testing": [lab("https://mas.owasp.org/crackmes/", "OWASP MAS Crackmes, Android and iOS")],
  "15-05-microarchitectural-attacks": [pwn("system-security/speculative-execution", "Speculative Execution")],
  "15-06-firmware-and-iot": [lab("https://github.com/OWASP/IoTGoat", "OWASP IoTGoat, a deliberately insecure router firmware")],
  "15-07-hardware-attacks-and-tees": [htb("brief-intro-to-hardware-attacks", "Brief Intro to Hardware Attacks"), lab("https://microcorruption.com/", "Microcorruption, a debugger-driven embedded CTF")],
  "15-08-ot-and-ics": [lab("https://github.com/Fortiphyd/GRFICSv2", "GRFICSv2, a simulated industrial plant to attack and defend")],
  // Lessons on the Roadmap that teach an attack from the defender's side
  "0045-attacking-and-defending-identity": [htb("active-directory-enumeration--attacks", "Active Directory Enumeration & Attacks"), htb("kerberos-attacks", "Kerberos Attacks"), GOAD],
  "0046-how-web-applications-fail": [ps("all-topics", "All topics"), htb("introduction-to-web-applications", "Introduction to Web Applications")],
  "0047-keeping-input-out-of-the-code": [ps("sql-injection", "SQL injection"), ps("os-command-injection", "OS command injection")],
  "0048-access-control-that-holds": [ps("access-control", "Access control")],
  "0049-apis-uploads-and-outbound-requests": [ps("api-testing", "API testing"), ps("file-upload", "File upload vulnerabilities"), ps("ssrf", "SSRF")],
  "0056-how-a-pentest-works": [htb("penetration-testing-process", "Penetration Testing Process"), htb("getting-started", "Getting Started")],
  "0057-auditing-for-privilege-escalation": [htb("linux-privilege-escalation", "Linux Privilege Escalation"), htb("windows-privilege-escalation", "Windows Privilege Escalation")],
};

/**
 * Attack subjects this site has no module for at all. They sit in the module
 * hub under their domain, as links out. Concepts are in the lessons listed.
 */
export interface Elsewhere {
  domain: string;
  title: string;
  summary: string;
  lessons: string[];
  links: TrainLink[];
}

export const ELSEWHERE: Elsewhere[] = [
  {
    domain: "02",
    title: "Active Directory enumeration",
    summary: "Mapping users, groups, ACLs and trust paths in a domain.",
    lessons: ["0043-active-directory", "0045-attacking-and-defending-identity"],
    links: [htb("introduction-to-active-directory", "Introduction to Active Directory"), htb("active-directory-enumeration--attacks", "Active Directory Enumeration & Attacks"), htb("active-directory-ldap", "Active Directory LDAP"), htb("active-directory-bloodhound", "Active Directory BloodHound"), htb("active-directory-powerview", "Active Directory PowerView"), GOAD],
  },
  {
    domain: "02",
    title: "Kerberos attacks",
    summary: "Roasting, delegation abuse and forged tickets.",
    lessons: ["0044-kerberos-and-ntlm", "0045-attacking-and-defending-identity"],
    links: [htb("kerberos-attacks", "Kerberos Attacks"), GOAD],
  },
  {
    domain: "02",
    title: "AD credential, relay and ACL attacks",
    summary: "NTLM relay, credential reuse, DACL abuse and lateral movement.",
    lessons: ["0044-kerberos-and-ntlm", "0045-attacking-and-defending-identity"],
    links: [htb("ntlm-relay-attacks", "NTLM Relay Attacks"), htb("dacl-attacks-i", "DACL Attacks I"), htb("dacl-attacks-ii", "DACL Attacks II"), htb("windows-lateral-movement", "Windows Lateral Movement"), htb("active-directory-trust-attacks", "Active Directory Trust Attacks"), GOAD],
  },
  {
    domain: "02",
    title: "AD Certificate Services abuse",
    summary: "Misconfigured certificate templates and enrolment rights.",
    lessons: ["0045-attacking-and-defending-identity"],
    links: [htb("adcs-attacks", "ADCS Attacks"), GOAD],
  },
];

/** Defender's counterpart for the AD topics above, shown with them. */
export const AD_DEFENCE: TrainLink[] = [htb("hunting-ad-attacks", "Hunting AD Attacks"), htb("active-directory-hardening---accounts--credentials", "Active Directory Hardening - Accounts & Credentials")];
