/** Generated exercises. Each round has new values, so answers can't be memorised. */
import type { Rng } from "@/lib/rng";
import { machine } from "@/lib/shell/world";

export type Exercise =
  | { kind: "choice"; prompt: string; options: string[]; correct: number; why: string }
  | { kind: "input"; prompt: string; answer: string; accept: (s: string) => boolean; placeholder: string; why: string };

export interface DrillDef {
  id: string;
  title: string;
  blurb: string;
  month: number;
  make: (rng: Rng) => Exercise;
}

const classify = (rng: Rng, prompt: string, options: readonly string[], right: string, why: string): Exercise => {
  // At most four options: the right one plus three random others.
  const others = rng.shuffle(options.filter((o) => o !== right)).slice(0, 3);
  const opts = rng.shuffle([right, ...others]);
  return { kind: "choice", prompt, options: opts, correct: opts.indexOf(right), why };
};

const input = (prompt: string, answer: string, why: string, placeholder = "Your answer", norm: (s: string) => string = (s) => s.trim().toLowerCase()): Exercise => ({
  kind: "input", prompt, answer, why, placeholder, accept: (s) => norm(s) === norm(answer),
});

/** A table of scenario → category, asked at random. */
function table(id: string, title: string, blurb: string, month: number, cats: readonly string[], rows: [string, string, string][]): DrillDef {
  return { id, title, blurb, month, make: (rng) => { const [p, c, w] = rng.pick(rows); return classify(rng, p, cats, c, w); } };
}

const rwx = (n: number) => `${n & 4 ? "r" : "-"}${n & 2 ? "w" : "-"}${n & 1 ? "x" : "-"}`;
const ipStr = (n: number) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
const COMMON_MODES = [0, 4, 5, 6, 7];

function subnetParts(rng: Rng) {
  const prefix = rng.int(8, 30);
  const ip = ((rng.pick([10, 172, 192, 100, 203]) << 24) | (rng.int(0, 255) << 16) | (rng.int(0, 255) << 8) | rng.int(1, 254)) >>> 0;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const net = (ip & mask) >>> 0;
  const bcast = (net | (~mask >>> 0)) >>> 0;
  return { prefix, ip, mask, net, bcast, hosts: 2 ** (32 - prefix) - 2 };
}

const PORTS: [string, string][] = [
  ["FTP control", "21"], ["SSH", "22"], ["Telnet", "23"], ["SMTP", "25"], ["DNS", "53"], ["HTTP", "80"], ["POP3", "110"], ["NTP", "123"], ["IMAP", "143"], ["SNMP", "161"],
  ["LDAP", "389"], ["HTTPS", "443"], ["SMB", "445"], ["LDAPS", "636"], ["MySQL", "3306"], ["RDP", "3389"], ["PostgreSQL", "5432"], ["Kerberos", "88"],
];

const EVENTS: [string, string][] = [
  ["4624", "A successful logon"], ["4625", "A failed logon"], ["4634", "An account logged off"], ["4648", "Logon with explicit credentials"], ["4672", "Special privileges assigned at logon"],
  ["4688", "A new process was created"], ["4697", "A service was installed"], ["4720", "A user account was created"], ["4732", "Member added to a local group"], ["1102", "The audit log was cleared"], ["7045", "A new service was installed (System log)"],
  ["4768", "Kerberos TGT requested"], ["4769", "Kerberos service ticket requested"], ["4771", "Kerberos pre-authentication failed"],
];

const SYSMON: [string, string][] = [
  ["1", "Process creation"], ["3", "Network connection"], ["7", "Image (DLL) loaded"], ["8", "CreateRemoteThread"], ["10", "Process accessed"], ["11", "File created"], ["13", "Registry value set"], ["22", "DNS query"],
];

const CIA = ["Confidentiality", "Integrity", "Availability"] as const;
const TVR = ["Threat", "Vulnerability", "Risk", "Control"] as const;
const CSF = ["Govern", "Identify", "Protect", "Detect", "Respond", "Recover"] as const;
const TACTICS = ["Reconnaissance", "Initial Access", "Execution", "Persistence", "Privilege Escalation", "Credential Access", "Discovery", "Lateral Movement", "Exfiltration", "Impact"] as const;
const WEB = ["SQL injection", "Cross-site scripting", "CSRF", "IDOR", "SSRF", "Path traversal", "Command injection"] as const;
const CRYPT = ["Encoding", "Hashing", "Encryption", "Signature"] as const;
const LOGS = ["Windows Security log", "Sysmon", "Firewall log", "DNS log", "Web proxy log", "Cloud audit log"] as const;
const LLM = ["Prompt injection", "Sensitive information disclosure", "Improper output handling", "Excessive agency", "Unbounded consumption"] as const;
const STRIDE = ["Spoofing", "Tampering", "Repudiation", "Information disclosure", "Denial of service", "Elevation of privilege"] as const;
const ALERTS = ["True positive", "False positive"] as const;

function predictPipeline(rng: Rng): Exercise {
  const ips = rng.shuffle(["10.0.0.5", "10.0.0.9", "10.0.0.7", "10.0.0.2"]).slice(0, 3);
  const words = rng.shuffle([...ips.flatMap((ip, i) => Array.from({ length: i + 1 + rng.int(0, 1) * (i === 2 ? 2 : 0) }, () => ip))]);
  const sh = machine("ana", [{ name: "ana", uid: 1000 }]);
  sh.fs.put("/home/ana/ips.txt", `${words.join("\n")}\n`, { owner: "ana" });
  const cmd = rng.pick([
    { c: "sort ips.txt | uniq -c | sort -rn | head -1", ask: "What does it print?" },
    { c: "sort -u ips.txt | wc -l", ask: "What number does it print?" },
    { c: "grep -c 10.0.0 ips.txt", ask: "What number does it print?" },
    { c: "sort ips.txt | uniq | head -1", ask: "What does it print?" },
    { c: "wc -l < ips.txt", ask: "What number does it print?" },
  ]);
  const out = sh.exec(cmd.c, "", sh.creds).stdout.trim();
  return input(`ips.txt contains:\n${words.join("\n")}\n\n$ ${cmd.c}\n\n${cmd.ask}`, out, `The tools run left to right, each reading the previous one's output. The exact output is: ${out}`, "Exact output", (s) => s.trim().replace(/\s+/g, " "));
}

const list: DrillDef[] = [
  table("cia", "Which promise was broken?", "A real incident in one line. Name the CIA property it broke.", 0, CIA, [
    ["A hospital's patient records are published online.", "Confidentiality", "Private data reached people who weren't authorised."],
    ["Ransomware locks every file on a clinic's server.", "Availability", "The data still exists, but nobody can use it when needed. Stolen copies would also make it a breach of confidentiality."],
    ["An attacker changes the bank account number on an invoice.", "Integrity", "Data was altered without authorisation."],
    ["A flood of traffic takes a shop's website offline.", "Availability", "The service can't be reached by legitimate users."],
    ["A student edits their grade in the university database.", "Integrity", "Information was improperly modified."],
    ["An employee emails a customer list to a competitor.", "Confidentiality", "Information was disclosed to someone not allowed to see it."],
    ["A power failure stops the payment system for six hours.", "Availability", "No attacker needed: availability covers accidents too."],
    ["A web page is defaced with a political message.", "Integrity", "Content was changed without authorisation."],
    ["A laptop with unencrypted client files is stolen.", "Confidentiality", "Whoever holds the laptop can read the files."],
    ["A backup is silently corrupted by malware.", "Integrity", "The data can no longer be trusted to be correct."],
  ]),
  table("tvr", "Threat, vulnerability, risk or control?", "Four words people mix up. Name the right one.", 1, TVR, [
    ["A criminal group that targets hospitals.", "Threat", "A threat is whoever or whatever could cause harm."],
    ["A server that hasn't been patched for a known flaw.", "Vulnerability", "A vulnerability is a weakness that could be exploited."],
    ["A 30% chance per year of losing €200,000 to ransomware.", "Risk", "Risk combines likelihood and impact."],
    ["Multi-factor authentication on all accounts.", "Control", "A control is a measure that reduces risk."],
    ["An earthquake near the data centre.", "Threat", "Threats aren't always people."],
    ["A password reused across ten sites.", "Vulnerability", "It's a weakness waiting for someone to exploit it."],
    ["Daily offline backups.", "Control", "It lowers the impact of data loss."],
    ["A web form that doesn't validate its input.", "Vulnerability", "A weakness in the implementation."],
    ["A disgruntled administrator.", "Threat", "An insider is a threat source."],
    ["Expected loss if the customer database leaks.", "Risk", "That's the size of potential harm, so it's about risk."],
  ]),
  { id: "rwx-octal", title: "Permissions to number", blurb: "Convert a permission string to octal.", month: 1, make: (rng) => {
    const [a, b, c] = [rng.pick(COMMON_MODES), rng.pick(COMMON_MODES), rng.pick(COMMON_MODES)];
    return input(`Convert to a number:  ${rwx(a)}${rwx(b)}${rwx(c)}`, `${a}${b}${c}`, `r=4, w=2, x=1. Add within each group of three: ${rwx(a)} = ${a}, ${rwx(b)} = ${b}, ${rwx(c)} = ${c}.`, "e.g. 755");
  } },
  { id: "octal-rwx", title: "Number to permissions", blurb: "Convert an octal mode to a permission string.", month: 1, make: (rng) => {
    const [a, b, c] = [rng.pick(COMMON_MODES), rng.pick(COMMON_MODES), rng.pick(COMMON_MODES)];
    return input(`Write mode ${a}${b}${c} as nine characters:`, `${rwx(a)}${rwx(b)}${rwx(c)}`, `Each digit is one class: owner, group, others. ${a} = ${rwx(a)}, ${b} = ${rwx(b)}, ${c} = ${rwx(c)}.`, "e.g. rwxr-xr-x");
  } },
  { id: "perm-who", title: "Can they do it?", blurb: "Apply the kernel's check: owner, else group, else others.", month: 1, make: (rng) => {
    const mode = rng.pick([0o640, 0o600, 0o644, 0o660, 0o604, 0o460, 0o755]);
    const who = rng.pick(["ana", "sam", "tom"]);
    const act = rng.pick(["read", "write"]);
    const shift = who === "ana" ? 6 : who === "sam" ? 3 : 0;
    const allowed = ((mode >> shift) & (act === "read" ? 4 : 2)) !== 0;
    const opts = rng.shuffle(["Allowed", "Denied"]);
    return { kind: "choice", prompt: `File owned by ana, group sec. Mode ${rwx((mode >> 6) & 7)}${rwx((mode >> 3) & 7)}${rwx(mode & 7)}.\nsam is in sec. tom isn't.\n\nCan ${who} ${act} it?`, options: opts, correct: opts.indexOf(allowed ? "Allowed" : "Denied"), why: `${who} is the ${who === "ana" ? "owner" : who === "sam" ? "group member" : "other"} class, so the kernel looks only at ${rwx((mode >> shift) & 7)}. It never falls through to another class.` };
  } },
  { id: "paths", title: "Where do you end up?", blurb: "Resolve `cd` paths in your head.", month: 1, make: (rng) => {
    const start = rng.pick(["/home/ana/projects", "/var/log/nginx", "/etc/ssh", "/home/ana"]);
    const step = rng.pick(["..", "../..", "../tmp", "./reports", "/tmp", "../../etc", "/var/log"]);
    const parts = (step.startsWith("/") ? step : `${start}/${step}`).split("/");
    const out: string[] = [];
    for (const p of parts) { if (!p || p === ".") continue; if (p === "..") out.pop(); else out.push(p); }
    const res = `/${out.join("/")}`;
    return input(`You are in ${start}.\n\n$ cd ${step}\n$ pwd\n\nWhat does pwd print?`, res, step.startsWith("/") ? "A leading / means absolute: where you stood doesn't matter." : ".. removes one level, . stays put, and names go down.", "/path");
  } },
  { id: "pipeline", title: "Predict the pipeline", blurb: "Read a pipeline and predict its output. These run through the same simulator as your terminal.", month: 1, make: predictPipeline },
  table("csf", "Which CSF function?", "Sort everyday security work into NIST CSF 2.0's six functions.", 1, CSF, [
    ["The board approves a security strategy and assigns roles.", "Govern", "Govern sets strategy, expectations and policy."],
    ["You list every server and who owns it.", "Identify", "You can't protect what you haven't inventoried."],
    ["You turn on multi-factor authentication.", "Protect", "A safeguard that prevents or limits harm."],
    ["An alert fires on a suspicious login.", "Detect", "Finding possible attacks."],
    ["You isolate an infected laptop from the network.", "Respond", "Action taken on a detected incident."],
    ["You rebuild servers from clean backups.", "Recover", "Restoring normal operations."],
    ["You write the policy for vendor security reviews.", "Govern", "Supply-chain risk strategy is part of Govern."],
    ["You run a risk assessment of the payment system.", "Identify", "Understanding risk to assets."],
    ["You patch the web server.", "Protect", "Maintenance that reduces exposure."],
    ["A SOC analyst reviews logs for anomalies.", "Detect", "Continuous monitoring."],
    ["You tell the regulator about a breach.", "Respond", "Incident communication."],
    ["After the outage you test that restored data is intact.", "Recover", "Verifying restored assets."],
  ]),
  table("tactic", "Which ATT&CK tactic?", "What is the attacker trying to achieve at this step? Tactics are goals.", 1, TACTICS, [
    ["Scanning a company's public websites before attacking.", "Reconnaissance", "Gathering information to plan."],
    ["A phishing email tricks someone into opening an attachment.", "Initial Access", "The first foothold."],
    ["A malicious script runs on the victim's laptop.", "Execution", "Running attacker code."],
    ["Malware adds itself to run at every startup.", "Persistence", "Surviving reboots."],
    ["A normal user exploits a flaw to become root.", "Privilege Escalation", "Gaining higher permissions."],
    ["Dumping password hashes from memory.", "Credential Access", "Stealing credentials."],
    ["Listing users and shares on the network.", "Discovery", "Learning the environment from inside."],
    ["Using stolen credentials to log in to another server.", "Lateral Movement", "Moving between systems."],
    ["Uploading stolen files to an external server.", "Exfiltration", "Getting data out."],
    ["Encrypting all files and demanding payment.", "Impact", "Disrupting or destroying."],
  ]),
  { id: "binary", title: "Binary and decimal", blurb: "Read and write the 8-bit numbers IP addresses are made of.", month: 2, make: (rng) => {
    const n = rng.int(1, 255);
    const bin = n.toString(2).padStart(8, "0");
    if (rng.int(0, 1)) return input(`Convert to decimal:  ${bin}`, String(n), `Add the place values that hold a 1: ${[128, 64, 32, 16, 8, 4, 2, 1].filter((v) => n & v).join(" + ")} = ${n}.`, "0-255");
    return input(`Convert ${n} to 8 bits:`, bin, `Take the biggest place value that fits and repeat: ${[128, 64, 32, 16, 8, 4, 2, 1].filter((v) => n & v).join(" + ")}.`, "8 bits");
  } },
  { id: "subnet", title: "Subnetting", blurb: "The Month 2 exit gate: 20 in a row, each under 60 seconds.", month: 2, make: (rng) => {
    const s = subnetParts(rng);
    const addr = `${ipStr(s.ip)}/${s.prefix}`;
    const block = 2 ** (32 - s.prefix);
    const q = rng.int(0, 3);
    if (q === 0) return input(`Network address of ${addr}?`, ipStr(s.net), `Block size is 2^${32 - s.prefix} = ${block.toLocaleString("en")} addresses. Round down to a multiple of the block: ${ipStr(s.net)}.`, "a.b.c.d");
    if (q === 1) return input(`Broadcast address of ${addr}?`, ipStr(s.bcast), `The last address of the block: ${ipStr(s.bcast)}.`, "a.b.c.d");
    if (q === 2) return input(`Usable hosts in a /${s.prefix}?`, String(s.hosts), `2^(32−${s.prefix}) − 2 = ${s.hosts}. Subtract 2 for the network and broadcast addresses.`, "number", (x) => x.replace(/[\s,]/g, ""));
    return input(`Subnet mask of a /${s.prefix}?`, ipStr(s.mask), `${s.prefix} ones followed by ${32 - s.prefix} zeros, written as four decimal numbers.`, "a.b.c.d");
  } },
  { id: "ports", title: "Well-known ports", blurb: "The ports every analyst recognises on sight.", month: 2, make: (rng) => {
    const [name, port] = rng.pick(PORTS);
    if (rng.int(0, 1)) return input(`Which port does ${name} use by default?`, port, `${name} is ${port}. Registered with IANA.`, "port number");
    const wrong = rng.shuffle(PORTS.filter((p) => p[1] !== port)).slice(0, 3).map((p) => p[0]);
    const opts = rng.shuffle([name, ...wrong]);
    return { kind: "choice", prompt: `Traffic to port ${port} is usually:`, options: opts, correct: opts.indexOf(name), why: `Port ${port} is ${name} by default. Default doesn't mean guaranteed: services can run on any port.` };
  } },
  table("layers", "Which layer?", "Place a protocol or device in the TCP/IP model.", 2, ["Link", "Internet", "Transport", "Application"], [
    ["ARP resolves an IP to a MAC address.", "Link", "ARP works on the local network segment."],
    ["A switch forwards frames by MAC address.", "Link", "Switches work with frames."],
    ["A router forwards packets by IP address.", "Internet", "Routing is the Internet layer's job."],
    ["ICMP reports that a host is unreachable.", "Internet", "ICMP travels directly in IP."],
    ["TCP numbers bytes and retransmits losses.", "Transport", "Reliable delivery between two ports."],
    ["UDP sends a datagram to port 53.", "Transport", "Ports live at the transport layer."],
    ["DNS translates a name into an address.", "Application", "DNS is an application that runs over UDP and TCP."],
    ["HTTP asks for a web page.", "Application", "Requests and responses between programs."],
  ]),
  table("http-status", "Read the status code", "What does the server's three-digit answer mean?", 6, ["2xx Success", "3xx Redirection", "4xx Client error", "5xx Server error"], [
    ["200 OK", "2xx Success", "It worked."], ["201 Created", "2xx Success", "A new resource exists."], ["301 Moved Permanently", "3xx Redirection", "Go to another URL."], ["302 Found", "3xx Redirection", "A temporary redirect, often after a login."],
    ["401 Unauthorized", "4xx Client error", "You haven't proved who you are."], ["403 Forbidden", "4xx Client error", "It knows who you are and says no."], ["404 Not Found", "4xx Client error", "No such resource."], ["429 Too Many Requests", "4xx Client error", "Rate limiting."], ["500 Internal Server Error", "5xx Server error", "The server crashed handling it: interesting when testing."], ["503 Service Unavailable", "5xx Server error", "Overloaded or down."],
  ]),
  table("crypto-kind", "Encoding, hashing, encryption or signature?", "The interview classic. Name what's happening.", 6, CRYPT, [
    ["Base64 turns bytes into printable text.", "Encoding", "No key: anyone can reverse it."],
    ["SHA-256 produces a fixed-size fingerprint of a file.", "Hashing", "One-way, no key."],
    ["AES-GCM protects a file with a secret key.", "Encryption", "Reversible with the key."],
    ["A vendor proves a software update came from them.", "Signature", "The private key signs, and anyone with the public key verifies."],
    ["URL-encoding turns a space into %20.", "Encoding", "A format change, not protection."],
    ["Argon2id stores a password verifier.", "Hashing", "A slow, salted hash."],
    ["TLS protects a web session's data.", "Encryption", "Symmetric encryption after the handshake."],
    ["A certificate authority vouches for a domain's key.", "Signature", "The CA signs the certificate."],
    ["Hex shows bytes as 0-9 and a-f.", "Encoding", "Just another way to write bytes."],
  ]),
  { id: "event-ids", title: "Windows event IDs", blurb: "The numbers you'll read every day in a SOC.", month: 5, make: (rng) => {
    const [id, name] = rng.pick(EVENTS);
    const wrong = rng.shuffle(EVENTS.filter((e) => e[0] !== id)).slice(0, 3).map((e) => e[1]);
    const opts = rng.shuffle([name, ...wrong]);
    return { kind: "choice", prompt: `Windows event ${id} means:`, options: opts, correct: opts.indexOf(name), why: `${id}: ${name}. Check Microsoft's documentation whenever a tool or AI gives you an event ID.` };
  } },
  { id: "sysmon-ids", title: "Sysmon event IDs", blurb: "The extra telemetry Sysmon adds.", month: 5, make: (rng) => {
    const [id, name] = rng.pick(SYSMON);
    const wrong = rng.shuffle(SYSMON.filter((e) => e[0] !== id)).slice(0, 3).map((e) => e[1]);
    const opts = rng.shuffle([name, ...wrong]);
    return { kind: "choice", prompt: `Sysmon event ID ${id} records:`, options: opts, correct: opts.indexOf(name), why: `Sysmon ${id}: ${name}.` };
  } },
  table("web-vuln", "Name the vulnerability", "Read what happened and name the class.", 8, WEB, [
    ["The input `' OR 1=1 --` logs you in without a password.", "SQL injection", "Input became part of the query."],
    ["A comment containing a script runs in every visitor's browser.", "Cross-site scripting", "Stored XSS: input became page code."],
    ["A hidden form on evil.example makes your bank transfer money while you're logged in.", "CSRF", "The browser attached your cookie to a forged request."],
    ["Changing `/invoice/1001` to `/invoice/1002` shows someone else's invoice.", "IDOR", "No ownership check on the object."],
    ["A URL-preview feature fetches `http://169.254.169.254/`.", "SSRF", "The server made a request on the attacker's behalf."],
    ["`?file=../../etc/passwd` returns a system file.", "Path traversal", "Input escaped the intended folder."],
    ["A ping tool accepts `8.8.8.8; cat /etc/passwd`.", "Command injection", "Input reached a shell."],
    ["A search box shows `<img src=x onerror=alert(1)>` as a live image.", "Cross-site scripting", "Reflected XSS."],
    ["An API returns any user's profile when you change the id.", "IDOR", "OWASP's API list calls this BOLA."],
    ["A PDF generator reads internal admin pages through a URL field.", "SSRF", "The internal network trusts the server."],
  ]),
  table("log-source", "Which log answers this?", "Each log proves different things.", 9, LOGS, [
    ["Who logged on to this Windows server at 03:00?", "Windows Security log", "Event 4624."],
    ["What command line did this process start with?", "Sysmon", "Sysmon ID 1 records command lines and parent processes."],
    ["Was the outbound connection to this IP blocked?", "Firewall log", "Allow and deny decisions."],
    ["Which laptop looked up this malicious domain?", "DNS log", "Resolver logs tie queries to clients."],
    ["Which URL did the user visit over HTTP?", "Web proxy log", "URLs and categories."],
    ["Who deleted this S3 bucket?", "Cloud audit log", "CloudTrail records API calls."],
    ["Which DLLs were loaded by this process?", "Sysmon", "Sysmon ID 7."],
    ["Who created this new IAM user?", "Cloud audit log", "An API call, so it's in the audit log."],
  ]),
  table("triage", "True or false positive?", "Decide from the evidence.", 9, ALERTS, [
    ["\"Brute force\" alert, and the source is your own vulnerability scanner during its approved window.", "False positive", "Expected, authorised activity: tune with care and document it."],
    ["50 failed logins from one foreign IP, then a success, then a new admin account.", "True positive", "The chain shows compromise."],
    ["\"Encoded PowerShell\" from your software-deployment tool, signed and on schedule.", "False positive", "Known good: the context explains it."],
    ["Word spawned PowerShell, which downloaded a file from a new domain.", "True positive", "Office apps shouldn't spawn shells."],
    ["\"Impossible travel\", but the user is on the company VPN that exits abroad.", "False positive", "Check the VPN egress IP."],
    ["An unknown service was installed and event log 1102 followed.", "True positive", "Persistence plus covering tracks."],
  ]),
  { id: "risk-calc", title: "Score the risk", blurb: "Likelihood × impact on a 1–5 scale.", month: 12, make: (rng) => {
    const l = rng.int(1, 5); const i = rng.int(1, 5); const v = l * i;
    const label = v >= 15 ? "High" : v >= 8 ? "Medium" : "Low";
    const opts = rng.shuffle(["Low", "Medium", "High"]);
    return { kind: "choice", prompt: `Likelihood ${l}, impact ${i}. Scale: under 8 is Low, 8–14 Medium, 15 or more High.\n\nWhat's the rating?`, options: opts, correct: opts.indexOf(label), why: `${l} × ${i} = ${v}, so ${label}. Real scales are defined by each organisation: what matters is defining them first.` };
  } },
  table("ioc-rank", "Climb the pyramid", "Name the level of the Pyramid of Pain.", 9, ["Hash value", "IP address", "Domain name", "Artifact", "Tool", "TTP"], [
    ["`4f2a…91c0`, the SHA-256 of a dropped file", "Hash value", "Change one byte and it's a new hash."],
    ["`203.0.113.7`, seen connecting to a server", "IP address", "Attackers rent new addresses cheaply."],
    ["`update-check.example`, seen in DNS logs", "Domain name", "Registering a new one takes minutes."],
    ["A file always dropped at `C:\\ProgramData\\svc\\cfg.dat`", "Artifact", "A distinctive trace on a host: annoying to change."],
    ["An unusual User-Agent string in proxy logs", "Artifact", "A network artifact that needs a code or config change."],
    ["Mimikatz was run on a server", "Tool", "They would need a different tool, or to build one."],
    ["They always dump credentials from memory, then move using admin shares", "TTP", "That's how they work, whatever tool they use."],
    ["They send invoice-themed mail, then run an Office macro that starts a script", "TTP", "A repeated way of operating."],
    ["A scheduled task name, `WinSysUpd`, used in three incidents", "Artifact", "A host artifact: specific, but it can be renamed."],
    ["A remote access tool that their group always uses", "Tool", "Replacing a tool costs effort, but less than changing behaviour."],
  ]),
  { id: "phish-auth", title: "Does DMARC pass?", blurb: "Read the results, compare the domains, decide.", month: 9, make: (rng) => {
    const seen = rng.pick(["oasis.example", "bank-north.example", "shop-atlas.example"]);
    const other = rng.pick(["mailer-77.example", "bulk-send.example", "cheap-host.example"]);
    const spfDom = rng.pick([seen, other]);
    const dkimDom = rng.pick([seen, other]);
    const spf = rng.pick(["pass", "fail"]);
    const dkim = rng.pick(["pass", "fail"]);
    const passes = (spf === "pass" && spfDom === seen) || (dkim === "pass" && dkimDom === seen);
    const opts = rng.shuffle(["DMARC passes", "DMARC fails"]);
    return { kind: "choice", prompt: `From: billing@${seen}\n\nspf=${spf} (mail-from domain ${spfDom})\ndkim=${dkim} (signing domain ${dkimDom})`, options: opts, correct: opts.indexOf(passes ? "DMARC passes" : "DMARC fails"), why: passes ? "At least one check passed for the domain in the From line, so it's aligned." : "DMARC needs a check that both passes and matches the From domain. Neither did both." };
  } },
  table("ir-phase", "Which incident phase?", "Place the action in the response lifecycle.", 11, ["Prepare", "Detect and analyse", "Contain", "Eradicate", "Recover", "Learn"], [
    ["Writing a ransomware playbook and testing your backups", "Prepare", "Done before anything goes wrong."],
    ["Working out whether an alert is real, and how far it has spread", "Detect and analyse", "Understanding comes before acting."],
    ["Moving an infected laptop to an isolated network", "Contain", "Stops the spread."],
    ["Disabling a stolen account so it can't be used", "Contain", "Stops further harm right away."],
    ["Removing the attacker's scheduled task and web shell", "Eradicate", "Removes their foothold."],
    ["Patching the flaw they came in through", "Eradicate", "Removes the way back in."],
    ["Restoring servers from clean backups and watching them closely", "Recover", "Getting back to normal, safely."],
    ["Holding a blameless review and assigning actions with dates", "Learn", "Turns the incident into improvements."],
  ]),
  table("risk-treat", "Which risk treatment?", "Mitigate, transfer, avoid or accept.", 12, ["Mitigate", "Transfer", "Avoid", "Accept"], [
    ["Adding MFA to the customer portal", "Mitigate", "It reduces the likelihood."],
    ["Buying cyber insurance for ransomware losses", "Transfer", "Part of the financial impact moves to the insurer."],
    ["Retiring the old file-transfer service entirely", "Avoid", "With no activity there's no risk."],
    ["The CFO signs off an unpatched kiosk until a review date", "Accept", "Recorded by someone with the authority."],
    ["Moving hosting to a provider with a contractual liability clause", "Transfer", "The contract shares the impact."],
    ["Adding offline backups to reduce ransomware downtime", "Mitigate", "It reduces the impact."],
    ["Deciding not to launch in a country with data rules you can't meet", "Avoid", "You stop the activity."],
  ]),
  table("framework-pick", "Which framework fits?", "Match the need to the framework.", 12, ["ISO/IEC 27001", "NIST CSF 2.0", "CIS Controls", "SOC 2", "GDPR"], [
    ["A European customer wants a certificate from an accredited body.", "ISO/IEC 27001", "It's certifiable, and it covers your whole management system."],
    ["You want to describe your current and target posture to the board.", "NIST CSF 2.0", "Its profiles exist for exactly that."],
    ["A small company asks what to do first, in a prioritised order.", "CIS Controls", "Implementation Group 1 is a practical baseline."],
    ["A US customer of your SaaS asks for an auditor's report on your controls.", "SOC 2", "It's an attestation report by a CPA firm."],
    ["You process personal data of people living in France.", "GDPR", "It's law, not a voluntary framework."],
  ]),
  { id: "rto-rpo", title: "RPO and RTO", blurb: "Does the plan meet the business target?", month: 12, make: (rng) => {
    const every = rng.pick([1, 4, 6, 12, 24]);
    const rpo = rng.pick([1, 2, 4, 8, 12, 24, 48]);
    const restore = rng.pick([2, 4, 8, 12]);
    const rto = rng.pick([1, 4, 6, 8, 24]);
    const q = rng.pick(["rpo", "rto"]);
    const opts = rng.shuffle(["Meets the target", "Misses the target"]);
    const good = q === "rpo" ? every <= rpo : restore <= rto;
    return { kind: "choice", prompt: q === "rpo" ? `Backups run every ${every} h. The business says it can lose at most ${rpo} h of data.\n\nDoes the backup schedule meet the RPO?` : `A full restore takes ${restore} h. The business needs the service back within ${rto} h.\n\nDoes this meet the RTO?`, options: opts, correct: opts.indexOf(good ? "Meets the target" : "Misses the target"), why: q === "rpo" ? `In the worst case you lose ${every} h of data, just before the next backup. The limit is ${rpo} h.` : `Recovery takes ${restore} h against a limit of ${rto} h. Only a tested restore proves this number.` };
  } },
  { id: "volatility", title: "Collect this first", blurb: "Order of volatility: which evidence disappears sooner?", month: 15, make: (rng) => {
    const order = ["CPU registers and cache", "RAM contents", "Current network connections", "Running processes", "Temporary files", "Files on the hard disk", "Remote logs", "Backups on archive media"];
    const a = rng.int(0, order.length - 3);
    const b = rng.int(a + 1, order.length - 1);
    const first = order[a] as string;
    const opts = rng.shuffle([first, order[b] as string]);
    return { kind: "choice", prompt: "You can only collect one before the machine loses power. Which one goes first?", options: opts, correct: opts.indexOf(first), why: `RFC 3227: collect what vanishes fastest first. ${first} changes or disappears sooner than ${(order[b] as string).toLowerCase()}.` };
  } },
  table("fact-inference", "Fact or inference?", "Does the sentence state evidence, or a conclusion?", 15, ["Fact", "Inference"], [
    ["Event 4624 shows a logon by svc_web at 03:14 UTC.", "Fact", "It reports what a log records."],
    ["The attacker wanted to reach the finance server.", "Inference", "Motive is a judgement, not a record."],
    ["Prefetch shows that tool.exe last ran at 03:20 UTC.", "Fact", "A statement of what the artifact shows."],
    ["The password was probably stolen through phishing.", "Inference", "\"Probably\" gives it away: a likely cause, not an observation."],
    ["The SHA-256 of the file matches the collected hash.", "Fact", "A check that anyone can repeat."],
    ["Sam must have run the script.", "Inference", "The account did. Who was at the keyboard is another question."],
    ["The firewall logged 4 GB sent to 203.0.113.7 at 04:02 UTC.", "Fact", "It's a measurement in a log."],
    ["The 4 GB transfer was customer data.", "Inference", "Unless you can see the contents, this is a judgement."],
  ]),
  table("tlp", "May I share this?", "Apply the Traffic Light Protocol 2.0.", 15, ["Yes, sharing is allowed", "No, it isn't allowed"], [
    ["`TLP:CLEAR`, and you want to post it on a public blog.", "Yes, sharing is allowed", "CLEAR has no limit on disclosure."],
    ["`TLP:GREEN`, and you want to share it with your national security community.", "Yes, sharing is allowed", "GREEN may travel within the community."],
    ["`TLP:GREEN`, and you want to post it publicly on social media.", "No, it isn't allowed", "Community isn't the same as the public."],
    ["`TLP:AMBER`, and you want to tell a colleague who needs it to protect your organisation.", "Yes, sharing is allowed", "Need-to-know inside the organisation is fine."],
    ["`TLP:AMBER+STRICT`, and you want to tell a client.", "No, it isn't allowed", "STRICT stays inside your organisation."],
    ["`TLP:RED`, and you want to forward it to your whole team.", "No, it isn't allowed", "RED stays with the named recipients."],
  ]),
  table("pipeline-check", "Which check catches it?", "Match the finding to the pipeline tool.", 17, ["SAST", "SCA", "DAST", "Secret scanning", "IaC scanning"], [
    ["A dependency has a published critical CVE.", "SCA", "SCA compares what you use with known flaws."],
    ["A Python file builds a SQL query with an f-string.", "SAST", "SAST reads your own source code for risky patterns."],
    ["The running login page sends no security headers.", "DAST", "DAST tests the application while it runs."],
    ["An API key was committed to a config file.", "Secret scanning", "It looks for key-shaped strings, ideally before commit."],
    ["A Terraform file makes a storage bucket public.", "IaC scanning", "It checks infrastructure definitions before deployment."],
    ["A Kubernetes manifest sets privileged: true.", "IaC scanning", "Manifests are infrastructure as code."],
    ["A package in your lock file is known to be vulnerable.", "SCA", "That's about a component, not your code."],
  ]),
  table("k8s-control", "Which Kubernetes control?", "Match the need to the control.", 19, ["RBAC", "NetworkPolicy", "Pod Security Standards", "Admission policy", "Falco"], [
    ["Stop the frontend pods reaching the database directly.", "NetworkPolicy", "It controls traffic between pods."],
    ["Let a CI account update one Deployment, and nothing else.", "RBAC", "It's who can do what through the API."],
    ["Forbid privileged containers across a namespace.", "Pod Security Standards", "The Restricted and Baseline profiles cover this."],
    ["Reject any image that doesn't come from your own registry.", "Admission policy", "A custom rule checked at creation time."],
    ["Alert when a shell starts inside a running web container.", "Falco", "That's runtime detection."],
  ]),
  { id: "pr-calc", title: "Precision and recall", blurb: "Work them out from the raw counts, with new numbers each time.", month: 20, make: (rng) => {
    const [tp, fp, fn] = rng.pick([[40, 10, 10], [36, 4, 12], [30, 10, 20], [45, 5, 15], [24, 6, 16], [18, 2, 6], [27, 3, 9], [16, 4, 4], [8, 2, 8], [12, 3, 4]] as [number, number, number][]);
    const which = rng.pick(["precision", "recall"]);
    const v = Math.round(((which === "precision" ? tp / (tp + fp) : tp / (tp + fn)) * 100));
    return { kind: "input", prompt: `True positives: ${tp}\nFalse positives: ${fp}\nFalse negatives: ${fn}\n\nWhat's the ${which}, as a whole percentage?`, answer: String(v), placeholder: "Number only", why: which === "precision" ? `Precision = TP ÷ (TP + FP) = ${tp} ÷ ${tp + fp} = ${v}%.` : `Recall = TP ÷ (TP + FN) = ${tp} ÷ ${tp + fn} = ${v}%.`, accept: (s) => s.trim().replace("%", "") === String(v) };
  } },
  { id: "base-rate", title: "The base-rate trap", blurb: "Why a 99% detector can still mostly raise false alarms.", month: 20, make: (rng) => {
    const total = 100000;
    const bad = rng.pick([10, 50, 100, 500, 1000]);
    const recall = rng.pick([90, 100]);
    const fpr = rng.pick([1, 2, 5]);
    const tp = (bad * recall) / 100;
    const fp = ((total - bad) * fpr) / 100;
    const v = Math.round((tp / (tp + fp)) * 100);
    return { kind: "input", prompt: `${total.toLocaleString("en-GB")} events a day, and ${bad} are really attacks.\nThe detector catches ${recall}% of attacks, and wrongly flags ${fpr}% of normal events.\n\nOf the alerts it raises, what percentage are real? Round to a whole number.`, answer: String(v), placeholder: "Number only", why: `True alerts: ${tp}. False alerts: ${fp}. ${tp} ÷ ${tp + fp} = ${v}%. When attacks are rare, even a small false-positive rate swamps the real ones.`, accept: (s) => s.trim().replace("%", "") === String(v) };
  } },
  { id: "trifecta", title: "Spot the trifecta", blurb: "Private data, untrusted content, a way out: which systems have all three?", month: 18, make: (rng) => {
    const data = rng.pick([true, false]);
    const content = rng.pick([true, false]);
    const out = rng.pick([true, false]);
    const all = data && content && out;
    const opts = rng.shuffle(["All three present", "A leg is missing"]);
    const line = [data ? "Can read all customer records." : "Reads only a public product manual.", content ? "Summarises emails from anyone." : "Only ever sees text from your own staff.", out ? "Can send email to any address." : "Its replies stay in a private chat with no links or images."];
    return { kind: "choice", prompt: `An assistant:\n• ${line.join("\n• ")}\n\nIs the lethal trifecta present?`, options: opts, correct: opts.indexOf(all ? "All three present" : "A leg is missing"), why: all ? "Private data, untrusted content and a way out: an attacker's email could steal your data." : "Without all three, this particular theft path breaks. Removing one leg is the design goal." };
  } },
  table("web-class", "Name the web flaw", "Map the scenario to its class.", 8, ["SQL injection", "XSS", "IDOR", "CSRF", "SSRF", "Path traversal", "Mass assignment"], [
    ["A search box's text is glued into a database query.", "SQL injection", "Input changes the meaning of the query."],
    ["A stored comment runs as script in other users' browsers.", "XSS", "Input became code in the page."],
    ["Changing the number in `/orders/991` shows someone else's order.", "IDOR", "The server never checked who owns that record."],
    ["A page on another site makes your browser submit a transfer to your bank.", "CSRF", "It abuses cookies being sent automatically."],
    ["A link preview feature makes the server fetch an internal admin page.", "SSRF", "The server is sending the request for the user."],
    ["A download feature uses the file name from the URL, and reaches files outside its folder.", "Path traversal", "Input decided which file was opened."],
    ["A profile update also saves a `role` field that the user added.", "Mass assignment", "The server saved a field the client shouldn't control."],
  ]),
  table("web-fix", "Pick the real fix", "Which fix addresses the root cause?", 8, ["Parameterised queries", "Output encoding", "Ownership check on the server", "SameSite cookies and tokens", "Destination allow-list", "Field allow-list"], [
    ["SQL injection in a report filter.", "Parameterised queries", "Query structure and values travel separately."],
    ["Stored XSS in user comments.", "Output encoding", "The browser then treats the comment as text."],
    ["Users can read others' invoices by changing an ID.", "Ownership check on the server", "Every object request must check who owns it."],
    ["Another website can trigger actions in a logged-in session.", "SameSite cookies and tokens", "The browser stops sending the cookie, and other sites can't read the token."],
    ["The server fetches any URL a user gives it.", "Destination allow-list", "Only known hosts may be reached."],
    ["Users can set `is_admin` through a profile update.", "Field allow-list", "Only named fields can be changed."],
  ]),
  { id: "cvss-band", title: "CVSS rating bands", blurb: "Turn a score into its qualitative rating.", month: 8, make: (rng) => {
    const v = rng.int(0, 100) / 10;
    const label = v === 0 ? "None" : v < 4 ? "Low" : v < 7 ? "Medium" : v < 9 ? "High" : "Critical";
    const opts = rng.shuffle(["None", "Low", "Medium", "High", "Critical"]);
    return { kind: "choice", prompt: `A flaw scores ${v.toFixed(1)}. What's its CVSS rating?`, options: opts, correct: opts.indexOf(label), why: "None 0.0, Low 0.1–3.9, Medium 4.0–6.9, High 7.0–8.9, Critical 9.0–10.0." };
  } },
  { id: "vuln-prio", title: "What gets fixed first?", blurb: "Apply a simple priority rule to a new finding each round.", month: 10, make: (rng) => {
    const kev = rng.pick([true, false]);
    const exposed = rng.pick([true, false]);
    const epss = rng.pick([1, 4, 12, 35, 61, 88]);
    const cvss = rng.pick([5.3, 6.5, 7.5, 8.8, 9.8]);
    const label = kev && exposed ? "Today" : kev || (epss >= 50 && exposed) ? "This week" : "Normal cycle";
    const opts = rng.shuffle(["Today", "This week", "Normal cycle"]);
    return { kind: "choice", prompt: `Rule: in KEV and internet-facing is Today. In KEV, or EPSS at least 50% and internet-facing, is This week. Anything else is Normal cycle.\n\nCVSS ${cvss} · EPSS ${epss}% · ${kev ? "in KEV" : "not in KEV"} · ${exposed ? "internet-facing" : "internal only"}`, options: opts, correct: opts.indexOf(label), why: `${label}. CVSS played no part: it says how bad a flaw could be, not how likely it is to hit you. Each organisation writes its own version of this rule.` };
  } },
  table("ai-task", "Who should do this?", "Automate, use AI with a human check, or keep it human?", 20, ["AI can do it alone", "AI drafts, human checks", "Human decides"], [
    ["Summarising a long alert into three lines for the analyst.", "AI can do it alone", "Low harm: the analyst still reads the evidence."],
    ["Drafting a detection rule.", "AI drafts, human checks", "Useful speed, but it must be tested before it's deployed."],
    ["Deciding to tell a regulator about a breach.", "Human decides", "It's a legal and business decision with real consequences."],
    ["Mapping an alert to ATT&CK techniques.", "AI drafts, human checks", "Models over-map, so check each one against the evidence."],
    ["Disabling a director's account during an incident.", "Human decides", "It's disruptive and hard to undo, so a person owns the call."],
    ["Translating a report into French.", "AI drafts, human checks", "Quick to do, and worth reading, as terms can shift."],
    ["Enriching an IP address with public reputation data.", "AI can do it alone", "A lookup with little harm if it's slightly off."],
  ]),
  table("ml-problem", "What went wrong with the model?", "Name the machine learning problem.", 20, ["Overfitting", "Data leakage", "Concept drift", "Poisoning", "Evasion"], [
    ["99% on training data, and 60% on new data.", "Overfitting", "It memorised examples instead of learning a pattern."],
    ["A feature was the analyst's verdict, so the test score was perfect.", "Data leakage", "The answer slipped into the inputs."],
    ["A phishing model decays over a year as attackers change their wording.", "Concept drift", "The world changed, and the model didn't."],
    ["Attackers submit many crafted samples, so that future retraining trusts them.", "Poisoning", "The training data itself was attacked."],
    ["A sample is changed slightly so the model calls it safe.", "Evasion", "The attack happens at prediction time."],
  ]),
  table("ai-control", "Which control fits?", "Match the risk to the design control.", 18, ["Per-user authorization", "Human approval", "Egress allow-list", "Output encoding", "Step and budget limits"], [
    ["An agent could read any customer's records.", "Per-user authorization", "Each tool call runs with the asking user's rights."],
    ["An agent could delete production data.", "Human approval", "Consequential actions wait for a person."],
    ["A fooled agent could post data to any web address.", "Egress allow-list", "Only known destinations are reachable."],
    ["Model output containing HTML could run in a user's browser.", "Output encoding", "Treat output as untrusted input."],
    ["A looping agent could run up a huge bill overnight.", "Step and budget limits", "Bounded loops stop runaway use."],
  ]),
  table("iam-eval", "Allow or deny?", "AWS evaluation: explicit deny wins, and otherwise you need an allow.", 13, ["Allowed", "Denied"], [
    ["An identity policy allows s3:GetObject. Nothing denies it.", "Allowed", "An explicit allow with no deny."],
    ["No policy mentions the action at all.", "Denied", "The default is deny."],
    ["An identity policy allows it, and an SCP denies it.", "Denied", "An explicit deny always wins."],
    ["An allow with Action \"*\", plus a deny on iam:*, and the call is iam:CreateUser.", "Denied", "Explicit deny beats a wildcard allow."],
    ["The identity policy allows it, but the SCP doesn't include that service.", "Denied", "An SCP sets the maximum: what it doesn't allow isn't available."],
    ["The identity allows it and the SCP allows it.", "Allowed", "Every applicable layer allows, and nothing denies."],
  ]),
  table("stride", "Which STRIDE threat?", "Name the threat category.", 17, STRIDE, [
    ["An attacker logs in with a stolen session cookie as another user.", "Spoofing", "Pretending to be someone else."],
    ["A request's price field is changed in transit.", "Tampering", "Modifying data."],
    ["A user denies placing an order and there are no logs.", "Repudiation", "No proof of who did what."],
    ["An error page reveals the database password.", "Information disclosure", "Data reaches the wrong people."],
    ["A huge file upload exhausts the server's disk.", "Denial of service", "Blocking legitimate use."],
    ["A normal user reaches the admin API.", "Elevation of privilege", "Gaining rights they shouldn't have."],
  ]),
  table("llm-risk", "Which LLM risk?", "Map a scenario to the OWASP LLM list.", 18, LLM, [
    ["A web page tells the assistant to ignore its rules and email the user's data.", "Prompt injection", "Untrusted content acted as instructions."],
    ["The chatbot reveals another customer's address.", "Sensitive information disclosure", "Private data reached the wrong person."],
    ["Model output is inserted into a page as raw HTML, and a script runs.", "Improper output handling", "Treat output as untrusted input."],
    ["A support bot can delete accounts without human approval.", "Excessive agency", "Too much power for the task."],
    ["An attacker sends huge prompts until the API bill explodes.", "Unbounded consumption", "No limits on usage."],
  ]),
];

export const DRILLS: Record<string, DrillDef> = Object.fromEntries(list.map((d) => [d.id, d]));
export const DRILL_LIST = list;
