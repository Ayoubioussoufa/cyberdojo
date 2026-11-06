/**
 * The richer practice modes. Hunts hide one line in realistic noise, flaws show
 * real code, orders test how a process really runs, and builds run in the simulator.
 */
import type { Rng } from "@/lib/rng";
import { machine } from "@/lib/shell/world";
import type { DrillDef, Exercise } from "./index";

const two = (n: number) => String(n).padStart(2, "0");
const IPS = ["203.0.113.7", "198.51.100.77", "192.0.2.150", "203.0.113.90"];
const USERS = ["sara", "omar", "lina", "karim", "nadia"];
const HOSTS = ["HR-LAP-12", "FIN-LAP-03", "ENG-LAP-41", "OPS-LAP-07"];

interface Hunt {
  prompt: string;
  bad: (rng: Rng) => string;
  noise: (rng: Rng) => { line: string; note: string };
  why: string;
}

const clock = (rng: Rng) => `${two(rng.int(8, 18))}:${two(rng.int(0, 59))}:${two(rng.int(0, 59))}`;

const HUNTS: Hunt[] = [
  {
    prompt: "This is `auth.log`. Someone has been guessing passwords. Click the line that shows they got in.",
    bad: (r) => `Oct 27 ${clock(r)} web1 sshd[991]: Accepted password for ${r.pick(["deploy", "backup"])} from ${r.pick(IPS)} port ${r.int(40000, 60000)} ssh2`,
    noise: (r) => (r.int(0, 3) ? { line: `Oct 27 ${clock(r)} web1 sshd[811]: Failed password for ${r.pick(["root", "admin", "test"])} from ${r.pick(IPS)} port ${r.int(40000, 60000)} ssh2`, note: "A failed login is noise on any internet-facing server. It only matters if one succeeds." } : { line: `Oct 27 ${clock(r)} web1 sshd[812]: Accepted publickey for ana from 10.0.0.5 port ${r.int(40000, 60000)} ssh2`, note: "A key login from an internal address: normal administration." }),
    why: "`Accepted password` from an outside address, among the failures, is the difference between noise and an incident. It turns an alert into a true positive.",
  },
  {
    prompt: "This is a web server's `access.log`. One request ran a command on the server. Click it.",
    bad: (r) => `${r.pick(IPS)} - - [27/Oct/2026:${clock(r)} +0000] "GET /uploads/${r.pick(["up", "cmd", "shell"])}.php?c=id HTTP/1.1" 200 41`,
    noise: (r) => (r.int(0, 2) ? { line: `10.0.${r.int(1, 9)}.${r.int(2, 200)} - - [27/Oct/2026:${clock(r)} +0000] "GET /uploads/img${r.int(1, 90)}.png HTTP/1.1" 200 ${r.int(900, 9000)}`, note: "An image in the uploads folder: exactly what that folder is for." } : { line: `${r.pick(IPS)} - - [27/Oct/2026:${clock(r)} +0000] "GET /admin/${r.pick(["config", "backup", "login"])}.bak HTTP/1.1" 404 196`, note: "A scanner guessing at paths. The 404 means that it found nothing." }),
    why: "A `.php` file in an uploads folder shouldn't exist, and `?c=id` passes a command to it. Status 200 means that it ran. That's a web shell.",
  },
  {
    prompt: "These are Sysmon process events, as `parent → child`. Which one should you investigate?",
    bad: (r) => `${clock(r)}  ${r.pick(HOSTS)}  ${r.pick(["WINWORD.EXE", "EXCEL.EXE"])} → powershell.exe -nop -w hidden -enc JABzAD0A…`,
    noise: (r) => r.pick([
      { line: `${clock(r)}  ${r.pick(HOSTS)}  explorer.exe → chrome.exe`, note: "A person opening a browser: normal." },
      { line: `${clock(r)}  ${r.pick(HOSTS)}  services.exe → svchost.exe -k netsvcs`, note: "Windows starting a service: normal." },
      { line: `${clock(r)}  ${r.pick(HOSTS)}  deployagent.exe → powershell.exe -File C:\\Deploy\\inventory.ps1`, note: "PowerShell, but from the signed deployment tool, running a known script." },
      { line: `${clock(r)}  ${r.pick(HOSTS)}  explorer.exe → OUTLOOK.EXE`, note: "A person opening their email: normal." },
    ]),
    why: "Office apps shouldn't start shells. A hidden window (`-w hidden`) and an encoded command (`-enc`) are both ways of hiding what's being run.",
  },
  {
    prompt: "This is `/etc/crontab` on a server. One job doesn't belong. Click it.",
    bad: (r) => `* * * * * root ${r.pick(["/var/tmp/.cache/update.sh", "/dev/shm/.x/run", "/tmp/.sys/helper.sh"])}`,
    noise: (r) => r.pick([
      { line: `17 * * * * root cd / && run-parts --report /etc/cron.hourly`, note: "A standard Ubuntu line." },
      { line: `25 6 * * * root test -x /usr/sbin/anacron || run-parts /etc/cron.daily`, note: "A standard Ubuntu line." },
      { line: `0 2 * * * root /usr/local/bin/backup.sh`, note: "A nightly backup from a sensible folder." },
      { line: `30 3 * * 0 root /usr/sbin/logrotate /etc/logrotate.conf`, note: "Weekly log rotation: normal." },
    ]),
    why: "It runs every minute, as root, from a hidden folder in a world-writable place. Real jobs live in proper folders, and rarely need to run each minute.",
  },
  {
    prompt: "This is `/etc/passwd`. One account is a backdoor. Click it.",
    bad: (r) => `${r.pick(["sysadm2", "toor", "svc_maint"])}:x:0:0::/root:/bin/bash`,
    noise: (r) => r.pick([
      { line: `daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin`, note: "A normal system account that can't log in." },
      { line: `www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin`, note: "The web server's account, which can't log in." },
      { line: `ana:x:1000:1000:Ana:/home/ana:/bin/bash`, note: "An ordinary user: UID 1000." },
      { line: `sam:x:1001:1001:Sam:/home/sam:/bin/bash`, note: "An ordinary user: UID 1001." },
      { line: `root:x:0:0:root:/root:/bin/bash`, note: "The real root account." },
    ]),
    why: "The third field is the UID, and any account with UID 0 is root, whatever it's called. There should be only one.",
  },
  {
    prompt: "These are DNS queries. One host is using DNS to sneak data out. Click the query.",
    bad: (r) => `${clock(r)}  ${r.pick(HOSTS)}  A  ${Array.from({ length: 3 }, () => Math.floor(r.int(1, 1e9) * 1e6).toString(36)).join("")}.${r.pick(["cdn-sync", "t3lem"])}.example`,
    noise: (r) => r.pick([
      { line: `${clock(r)}  ${r.pick(HOSTS)}  A  outlook.office.com`, note: "A normal mail lookup." },
      { line: `${clock(r)}  ${r.pick(HOSTS)}  A  www.google.com`, note: "A normal lookup." },
      { line: `${clock(r)}  ${r.pick(HOSTS)}  AAAA  updates.vendor.example`, note: "A vendor's update server." },
      { line: `${clock(r)}  ${r.pick(HOSTS)}  A  intranet.oasis.example`, note: "Your own intranet." },
    ]),
    why: "Very long, random-looking subdomains are the sign of DNS tunnelling: data gets encoded into the names, and sent out through a channel that many firewalls allow.",
  },
  {
    prompt: "These are CloudTrail events. One tells you that someone is hiding. Click it.",
    bad: (r) => `${clock(r)}  StopLogging  ${r.pick(["ci-bot", "svc-reports"])}  ${r.pick(IPS)}`,
    noise: (r) => r.pick([
      { line: `${clock(r)}  DescribeInstances  ana  10.0.${r.int(1, 9)}.${r.int(2, 200)}`, note: "Reading a list of servers: routine." },
      { line: `${clock(r)}  GetObject  app-role  10.0.${r.int(1, 9)}.${r.int(2, 200)}`, note: "The app reading a file, from inside." },
      { line: `${clock(r)}  ListBuckets  omar  10.0.${r.int(1, 9)}.${r.int(2, 200)}`, note: "An engineer listing buckets from inside." },
      { line: `${clock(r)}  PutObject  backup-agent  10.0.${r.int(1, 9)}.${r.int(2, 200)}`, note: "A backup writing a file: expected." },
    ]),
    why: "`StopLogging` turns off the record itself. It almost never happens for a good reason, least of all from an outside address.",
  },
  {
    prompt: "These are Kerberos events (4769) from a domain controller. One looks like Kerberoasting. Click it.",
    bad: (r) => `${clock(r)}  4769  ${r.pick(USERS)}  service=${r.pick(["svc_sql", "svc_backup"])}  encryption=0x17`,
    noise: (r) => ({ line: `${clock(r)}  4769  ${r.pick(USERS)}  service=${r.pick(["cifs/SRV-FILE-01", "ldap/DC-01", "HTTP/intranet"])}  encryption=0x12`, note: "`0x12` is AES256, which is normal in a modern domain." }),
    why: "`0x17` means RC4. It's weak enough to crack offline, so attackers ask for it on purpose, against service accounts.",
  },
  {
    prompt: "These are a user's sign-ins, in order. One can't be genuine. Click it.",
    bad: (r) => `${two(r.int(10, 11))}:${two(r.int(21, 25))}  sara  Lagos, NG  ${r.pick(IPS)}  Success  new device`,
    noise: (r) => ({ line: `${two(r.int(10, 11))}:${two(r.int(0, 19))}  sara  Rabat, MA  196.200.${r.int(1, 90)}.${r.int(2, 200)}  Success  known device`, note: "Her usual city, on her usual device." }),
    why: "She signed in from Rabat minutes earlier, and nobody crosses a continent in that time. A new device makes it worse. Check for a VPN first, then treat it as a stolen session.",
  },
  {
    prompt: "This is `find / -perm -4000`, listing SUID programs. One shouldn't be here. Click it.",
    bad: (r) => r.pick(["/tmp/.helper", "/var/tmp/backupd", "/home/deploy/.cache/su2"]),
    noise: (r) => r.pick([
      { line: "/usr/bin/passwd", note: "It needs SUID, so that users can change their own password." },
      { line: "/usr/bin/sudo", note: "SUID is how sudo works." },
      { line: "/usr/bin/su", note: "A standard SUID program." },
      { line: "/usr/bin/mount", note: "A standard SUID program." },
      { line: "/usr/bin/chsh", note: "A standard SUID program." },
    ]),
    why: "A SUID program runs with its owner's rights. One in a temporary or hidden folder is a classic way to keep root access.",
  },
  {
    prompt: "These are firewall log lines. One outbound connection should worry you. Click it.",
    bad: (r) => `${clock(r)} ALLOW OUT ${r.pick(HOSTS)} → ${r.pick(IPS)}:${r.pick(["445", "3389"])}`,
    noise: (r) => r.pick([
      { line: `${clock(r)} ALLOW OUT ${r.pick(HOSTS)} → 142.250.${r.int(1, 200)}.${r.int(2, 200)}:443`, note: "HTTPS to a large provider: everyday traffic." },
      { line: `${clock(r)} ALLOW OUT ${r.pick(HOSTS)} → 10.0.1.5:53`, note: "DNS to your own server." },
      { line: `${clock(r)} DENY IN ${r.pick(IPS)} → 10.0.2.8:22`, note: "A blocked scan from outside: the firewall did its job." },
      { line: `${clock(r)} ALLOW OUT ${r.pick(HOSTS)} → 13.107.${r.int(1, 200)}.${r.int(2, 200)}:443`, note: "HTTPS to Microsoft: everyday traffic." },
    ]),
    why: "SMB (445) and RDP (3389) are internal protocols, and neither should ever leave for the internet. It's a likely sign of data leaving, or of remote control.",
  },
  {
    prompt: "This is an AI assistant's tool log. One call shouldn't have happened. Click it.",
    bad: (r) => `${clock(r)}  send_email  to=${r.pick(["drop@files-archive.example", "export@cloud-mailer.example"])}  records=all`,
    noise: (r) => r.pick([
      { line: `${clock(r)}  search_kb  q="refund policy"`, note: "Reading the knowledge base: its normal job." },
      { line: `${clock(r)}  lookup_order  id=A${r.int(100, 999)}`, note: "Looking up one order: expected." },
      { line: `${clock(r)}  send_email  to=support@oasis.example  records=one`, note: "A normal reply, to your own domain." },
    ]),
    why: "An outside address, with every record attached, is data leaving. A ticket probably told it to, which is indirect prompt injection. Log every tool call, or you'd never see this.",
  },
];

function huntAt(rng: Rng, h: Hunt): Exercise {
  const lines: string[] = [];
  const notes: Record<number, string> = {};
  const want = rng.int(6, 8);
  for (let tries = 0; lines.length < want && tries < 60; tries++) {
    const n = h.noise(rng);
    if (lines.includes(n.line)) continue;
    notes[lines.length] = n.note;
    lines.push(n.line);
  }
  const at = rng.int(1, lines.length);
  const shifted: Record<number, string> = {};
  for (const [k, v] of Object.entries(notes)) shifted[Number(k) >= at ? Number(k) + 1 : Number(k)] = v;
  lines.splice(at, 0, h.bad(rng));
  return { kind: "spot", prompt: h.prompt, lines, correct: at, why: h.why, notes: shifted };
}

interface Flaw {
  prompt: string;
  lines: string[];
  bad: number;
  why: string;
  fine: string;
}

const FLAWS: Flaw[] = [
  { prompt: "Python: which line lets input change a database query?", lines: ["def find_user(cur, email):", "    query = f\"SELECT * FROM users WHERE email = '{email}'\"", "    cur.execute(query)", "    return cur.fetchone()"], bad: 1, why: "The email is pasted into the SQL text. Fix: `cur.execute(\"SELECT * FROM users WHERE email = %s\", (email,))`.", fine: "This line is fine on its own. The problem is how the query text was built." },
  { prompt: "Flask: this route lets someone read other people's invoices. Which line is the problem?", lines: ["@app.get(\"/invoices/<int:id>\")", "@login_required", "def invoice(id):", "    row = Invoice.get(id=id)", "    return render_template(\"invoice.html\", row=row)"], bad: 3, why: "It's looking up by ID alone, and never asks who owns it. Fix: `Invoice.get(id=id, owner_id=current_user.id)`.", fine: "Login is checked, but being logged in isn't the same as owning this invoice." },
  { prompt: "A Jinja template: which line turns off the browser's protection?", lines: ["<h1>{{ post.title }}</h1>", "<p>By {{ post.author }}</p>", "<div>{{ post.body|safe }}</div>", "<a href=\"/posts\">Back</a>"], bad: 2, why: "`|safe` turns off escaping, so a post can inject HTML into the page. Fix: remove it, or clean the HTML with a tested sanitiser.", fine: "Jinja escapes this by default, so it's safe." },
  { prompt: "Python: which line could let input run as a shell command?", lines: ["import subprocess", "def convert(name):", "    cmd = f\"convert {name} out.png\"", "    subprocess.run(cmd, shell=True, check=True)"], bad: 3, why: "`shell=True` hands the whole string to a shell, which would obey any command in it. Fix: `subprocess.run([\"convert\", \"--\", name, \"out.png\"], check=True)`.", fine: "This line only sets things up. The danger is where it reaches a shell." },
  { prompt: "Which line would leak a secret to everyone who can read this repository?", lines: ["import os, requests", "URL = \"https://api.example.com/v1/scan\"", "API_KEY = \"sk_live_4f8a1c9e2b7d\"", "reply = requests.get(URL, headers={\"Key\": API_KEY})"], bad: 2, why: "A key in code is in Git history forever. Fix: `API_KEY = os.environ[\"API_KEY\"]`, and revoke the old key.", fine: "This is fine: it's the key's value that shouldn't be here." },
  { prompt: "Python: which line accepts a forged login token?", lines: ["import jwt", "def user_from(token):", "    data = jwt.decode(token, options={\"verify_signature\": False})", "    return data[\"user\"]"], bad: 2, why: "With verification off, anyone can write their own token. Fix: `jwt.decode(token, KEY, algorithms=[\"HS256\"])`.", fine: "This is fine: the problem is how the token is decoded." },
  { prompt: "This IAM policy is far too powerful. Which line is the main problem?", lines: ["{", "  \"Effect\": \"Allow\",", "  \"Action\": \"*\",", "  \"Resource\": \"*\"", "}"], bad: 2, why: "`\"Action\": \"*\"` allows every action. With `Resource: *` it's full admin. Fix: name only what's needed, such as `s3:GetObject`. (`Resource` should be narrowed too.)", fine: "This line is standard JSON, or a smaller part of the problem." },
  { prompt: "Dockerfile: which line leaves the container running with too much power?", lines: ["FROM python:3.13-slim", "COPY . /app", "RUN pip install -r /app/requirements.txt", "USER root", "CMD [\"python\", \"/app/main.py\"]"], bad: 3, why: "Running as root means that a flaw in the app gives root in the container. Fix: `RUN useradd app`, then `USER app`.", fine: "This is a normal build step." },
  { prompt: "Kubernetes: which line gives a container nearly full access to its node?", lines: ["containers:", "  - name: web", "    image: registry.example/web:1.9.2", "    securityContext:", "      privileged: true"], bad: 4, why: "A privileged container can reach the host's devices. Fix: remove it, and drop capabilities.", fine: "This line is fine." },
  { prompt: "GitHub Actions: which line trusts a tag that could be moved?", lines: ["steps:", "  - uses: actions/checkout@8e5e7e5ab8b370d6c329ec480221332ada57f0ab", "  - uses: acme-tools/setup-env@v3", "  - run: npm test"], bad: 2, why: "`@v3` is a tag, and its owner can repoint it, as happened to tj-actions in 2025. Fix: pin to a full commit SHA.", fine: "This line is fine: a full commit hash can't be moved." },
  { prompt: "Python: which line stores passwords unsafely?", lines: ["import hashlib", "def save(user, password):", "    digest = hashlib.md5(password.encode()).hexdigest()", "    db.save(user, digest)"], bad: 2, why: "MD5 is fast and unsalted, so it's cracked in moments. Fix: use a slow password hash, such as Argon2id.", fine: "This line is fine." },
  { prompt: "Python: which line lets a user make your server fetch any address?", lines: ["@app.post(\"/preview\")", "def preview():", "    url = request.form[\"url\"]", "    html = requests.get(url, timeout=5).text", "    return summarise(html)"], bad: 3, why: "That's SSRF: the server requests whatever it's told, including internal addresses. Fix: check the host against an allow-list, and refuse private addresses.", fine: "Reading the value is fine. The danger is what's done with it." },
  { prompt: "Python: which line reaches files outside the intended folder?", lines: ["@app.get(\"/download\")", "def download():", "    name = request.args[\"file\"]", "    return send_file(\"/srv/files/\" + name)"], bad: 3, why: "A name like `../../etc/passwd` walks out of the folder. Fix: resolve the path, and check that it's still inside `/srv/files`. Flask's `send_from_directory` does this for you.", fine: "Reading the value is fine. The danger is how it's used." },
  { prompt: "Python: which line makes a guessable reset token?", lines: ["import random", "def reset_token():", "    return str(random.randint(100000, 999999))", "# emailed to the user"], bad: 2, why: "`random` is predictable, and six digits can be tried quickly. Fix: `secrets.token_urlsafe(32)`.", fine: "This line is fine." },
  { prompt: "Python: which line can run code hidden in the uploaded data?", lines: ["import pickle", "@app.post(\"/import\")", "def do_import():", "    data = pickle.loads(request.data)", "    return save(data)"], bad: 3, why: "Unpickling can run code. Fix: accept JSON, and validate its shape.", fine: "This line is fine." },
  { prompt: "Terraform: which line makes your data readable by everyone?", lines: ["resource \"aws_s3_bucket_acl\" \"reports\" {", "  bucket = aws_s3_bucket.reports.id", "  acl    = \"public-read\"", "}"], bad: 2, why: "`public-read` lets anyone on the internet read it. Fix: remove the ACL, and turn on Block Public Access.", fine: "This line is fine." },
  { prompt: "Express: which line accepts every field that the client sends?", lines: ["app.post('/profile', auth, async (req, res) => {", "  const user = await User.findById(req.user.id);", "  Object.assign(user, req.body);", "  await user.save();", "});"], bad: 2, why: "That's mass assignment: a client could add `isAdmin: true`. Fix: copy only named fields, such as `user.name = req.body.name`.", fine: "This line is fine: it finds the logged-in user." },
  { prompt: "Python: an AI tool. Which line gives a fooled model far too much power?", lines: ["def run_tool(name, args, user):", "    if name == \"run_sql\":", "        return db.execute(args[\"query\"]).fetchall()", "    if name == \"get_order\":", "        return orders.get(id=args[\"id\"], owner=user)"], bad: 2, why: "The model's text goes straight to the database. A fooled model can read anything. Fix: small tools, such as `get_order`, which check ownership.", fine: "This line is fine: it's small, and it checks the owner." },
];

const ORDERS: { prompt: string; items: string[]; why: string; notes: string[] }[] = [
  { prompt: "Put the TCP handshake in order.", items: ["Client sends SYN", "Server replies SYN-ACK", "Client sends ACK", "Data flows"], notes: ["\"I'd like to connect.\"", "\"Fine, and I'd like to as well.\"", "\"Agreed.\"", "Only now does any data travel."], why: "Three messages set up a TCP connection before any data moves. That's why a SYN scan works: an open port answers." },
  { prompt: "A browser wants `example.com`. Put these in order.", items: ["Check the local cache", "Ask the resolver", "Resolver asks root, TLD, then the domain's server", "Browser gets the IP", "Browser opens a TCP connection"], notes: ["If it's known, you're done.", "Your DNS server takes over.", "It walks down the hierarchy.", "Now it knows where to go.", "Only then can it connect."], why: "Names come first, then a connection. That's why DNS logs show intent before any traffic." },
  { prompt: "Put a Kerberos login and service access in order.", items: ["User proves identity to the KDC", "KDC gives a TGT", "User presents the TGT, and asks for a service ticket", "KDC gives a service ticket", "User presents it to the service"], notes: ["The AS exchange.", "The ticket-granting ticket.", "The TGS exchange.", "Event 4769 is logged here.", "The service never sees the password."], why: "Tickets replace passwords on the network. The KDC issues them, and the service only checks them." },
  { prompt: "Put the OAuth authorization code flow in order.", items: ["App sends the user to the login server, with a PKCE challenge", "User logs in, and consents", "Login server redirects back with a code", "App swaps the code and its PKCE verifier for tokens", "App calls the API with the access token"], notes: ["The app never sees the password.", "It happens on the identity provider.", "A code, not a token.", "PKCE proves it's the same app.", "Now it can act for the user."], why: "The code is useless without the verifier, so a stolen code alone gets nothing." },
  { prompt: "Put incident response in order.", items: ["Prepare", "Detect and analyse", "Contain", "Eradicate", "Recover", "Learn"], notes: ["Before anything happens.", "Is it real, and how far has it gone?", "Stop it getting worse.", "Remove the foothold.", "Return to normal, carefully.", "Turn it into improvements."], why: "Containing before eradicating matters: otherwise, you tip off an attacker who still has other ways in." },
  { prompt: "A machine may lose power. Collect evidence in order of volatility.", items: ["Memory", "Network connections", "Running processes", "Disk", "Backups"], notes: ["Gone the moment power goes.", "Change within seconds.", "Change quickly.", "Survives a reboot.", "Barely changes."], why: "RFC 3227: collect what disappears fastest first." },
  { prompt: "Put this typical intrusion in order.", items: ["Phishing email arrives", "User opens the attachment", "Malware adds a startup entry", "Attacker dumps credentials", "Attacker moves to a server", "Data is sent out"], notes: ["Initial Access.", "Execution.", "Persistence.", "Credential Access.", "Lateral Movement.", "Exfiltration."], why: "That's the ATT&CK story. Each step is a chance to detect it, and breaking any link helps." },
  { prompt: "Put a phishing response in order.", items: ["Keep the original email", "Check the headers", "Inspect links safely", "Search for other recipients", "Remove it and block the sender", "Write it up"], notes: ["Evidence first.", "Who really sent it?", "Never by clicking.", "The step that people forget.", "Protect everyone.", "So that it improves next time."], why: "Scoping comes before clean-up, because you can't remove what you haven't found." },
  { prompt: "Put the detection engineering lifecycle in order.", items: ["Hypothesis", "Data source", "Logic", "Test", "Tune", "Deploy", "Measure"], notes: ["What behaviour?", "Do we collect it?", "Write the rule.", "Does it fire?", "Cut the noise.", "Ship it.", "Is it still right?"], why: "Starting from a behaviour, not from a tool, is what keeps detections useful." },
  { prompt: "A leaked cloud key: put the response in order.", items: ["Disable the key", "Review CloudTrail", "Scope what it could reach", "Hunt for persistence", "Rotate what it touched", "Fix how it leaked"], notes: ["Stop the access first.", "What did it do?", "What might it have reached?", "Did they make a second key?", "Assume that it's been seen.", "So that it can't happen again."], why: "Disabling first keeps the evidence, and stops the damage." },
  { prompt: "Put a secure pipeline in order.", items: ["Secret scan before commit", "Tests and SAST", "SCA and SBOM", "Build a minimal image", "Sign it", "Verify at deploy"], notes: ["Stops keys early.", "Your own code.", "Your dependencies.", "Less to attack.", "Proves where it came from.", "Refuses anything unsigned."], why: "Each gate catches a different class of problem, and the earlier the cheaper." },
  { prompt: "Put a risk assessment in order.", items: ["Set the scope", "List assets", "Identify threats and weaknesses", "Rate likelihood and impact", "Decide the treatment", "Assign an owner", "Review it"], notes: ["What's included?", "What matters?", "What could go wrong?", "How bad, how likely?", "Mitigate, transfer, avoid or accept.", "Who's accountable?", "Risks change."], why: "Scales and scope come first, or ratings are only opinions." },
];

const LOG = Array.from({ length: 24 }, (_, i) => {
  const ip = ["203.0.113.7", "198.51.100.23", "203.0.113.7", "192.0.2.44", "203.0.113.7"][i % 5];
  return `Oct 27 09:${two(i)}:11 web1 sshd[811]: Failed password for root from ${ip} port 4${two(i)}10 ssh2`;
}).join("\n");
const CSV = "name,dept,uid\nali,sec,1001\nsara,ops,1002\nomar,sec,1003\nlina,it,1004\n";

const world = () => {
  const sh = machine("ana", [{ name: "ana", uid: 1000 }]);
  sh.fs.put("/home/ana/auth.log", `${LOG}\n`, { owner: "ana" });
  sh.fs.put("/home/ana/users.csv", CSV, { owner: "ana" });
  sh.fs.put("/etc/cron.d/backup", "# nightly job\n", { mode: 0o666 });
  return sh;
};

const BUILDS: { prompt: string; tokens: string[]; extra: string[]; why: string }[] = [
  { prompt: "Count how many lines of `auth.log` mention `Failed`.", tokens: ["grep", "-c", "Failed", "auth.log"], extra: ["-v", "sort"], why: "`grep -c` counts matching lines. `-v` would count the lines that don't match." },
  { prompt: "Show the first line of `users.csv`.", tokens: ["head", "-1", "users.csv"], extra: ["tail", "-v"], why: "`head -1` prints the first line. It's how you check a file's columns." },
  { prompt: "Show only the second column of `users.csv`.", tokens: ["cut", "-d,", "-f2", "users.csv"], extra: ["-f1", "sort"], why: "`-d,` sets the separator to a comma, and `-f2` picks field 2." },
  { prompt: "Show the different departments in `users.csv`, skipping the header, with no repeats.", tokens: ["tail", "-n", "+2", "users.csv", "|", "cut", "-d,", "-f2", "|", "sort", "-u"], extra: ["uniq", "-c"], why: "`tail -n +2` starts at line 2, which skips the header. `sort -u` sorts and removes repeats." },
  { prompt: "From `auth.log`, list each source IP with how many failures it had, biggest first.", tokens: ["grep", "Failed", "auth.log", "|", "awk", "'{print $11}'", "|", "sort", "|", "uniq", "-c", "|", "sort", "-rn"], extra: ["head"], why: "This is the shape you'll use all your career: filter, keep a field, sort, count, sort again. Sorting first matters, because `uniq` only merges neighbours." },
  { prompt: "Print the names of people in the `sec` department from `users.csv`.", tokens: ["awk", "-F,", "'$2 == \"sec\" {print $1}'", "users.csv"], extra: ["sort", "-v"], why: "`-F,` splits on commas, the filter keeps matching rows, and `print $1` shows the name." },
  { prompt: "Find which user has UID 0 in `/etc/passwd`.", tokens: ["awk", "-F:", "'$3 == 0 {print $1}'", "/etc/passwd"], extra: ["-F,", "sort"], why: "`/etc/passwd` is split by colons, and field 3 is the UID. This is your second-root check." },
  { prompt: "Count how many different IPs appear in `auth.log`.", tokens: ["grep", "-Eo", "'[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+'", "auth.log", "|", "sort", "-u", "|", "wc", "-l"], extra: ["-c", "uniq"], why: "`-Eo` prints only the part that matched. `sort -u` removes repeats, and `wc -l` counts lines." },
  { prompt: "Show the last 3 lines of `auth.log`.", tokens: ["tail", "-n", "3", "auth.log"], extra: ["head", "-v"], why: "`tail` shows the end of a file, where the newest log entries are." },
  { prompt: "Find every file under `/etc` that anyone can write to.", tokens: ["find", "/etc", "-type", "f", "-perm", "-002"], extra: ["-name", "-4000"], why: "`-perm -002` means that the world-write bit is set. `-4000` would look for SUID instead." },
];

export const MODE_DRILLS: DrillDef[] = [
  { id: "hunts", title: "Log hunts", blurb: "One line in the noise matters. Click it, then see why the others don't.", month: 3, deck: HUNTS.length, make: (rng, i) => huntAt(rng, i === undefined ? rng.pick(HUNTS) : (HUNTS[i] as Hunt)) },
  { id: "flaws", title: "Spot the flaw", blurb: "Real code, with one dangerous line. Find it, and learn the fix.", month: 6, deck: FLAWS.length, make: (rng, i) => {
    const f = i === undefined ? rng.pick(FLAWS) : (FLAWS[i] as Flaw);
    return { kind: "spot", code: true, prompt: f.prompt, lines: f.lines, correct: f.bad, why: f.why, notes: Object.fromEntries(f.lines.map((_, k) => [k, f.fine])) };
  } },
  { id: "order", title: "Put it in order", blurb: "How things really unfold: handshakes, attacks, responses and pipelines.", month: 2, deck: ORDERS.length, make: (rng, i) => {
    const o = i === undefined ? rng.pick(ORDERS) : (ORDERS[i] as (typeof ORDERS)[number]);
    return { kind: "order", prompt: o.prompt, items: o.items, notes: o.notes, why: o.why };
  } },
  { id: "build", title: "Command builder", blurb: "Assemble the command yourself. It runs for real in the simulator.", month: 1, deck: BUILDS.length, make: (rng, i) => {
    const b = i === undefined ? rng.pick(BUILDS) : (BUILDS[i] as (typeof BUILDS)[number]);
    const solution = b.tokens.join(" ");
    const sh = world();
    const expected = sh.exec(solution, "", sh.creds).stdout;
    return { kind: "build", prompt: b.prompt, tokens: [...b.tokens, ...b.extra], solution, expected, setup: world, why: b.why };
  } },
];
