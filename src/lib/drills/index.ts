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
