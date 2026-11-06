/** Months 9 to 12: SOC queries, phishing, detection, incident timelines, risk. */
import type { Rng } from "@/lib/rng";
import { sha256 } from "@/lib/shell/hash";
import { posixToJs } from "@/lib/shell/parse";
import { machine, tool } from "@/lib/shell/world";
import { submitted, type Built, type Mission, type RangeSet } from "./kit";

export const ana = () => machine("ana", [{ name: "ana", uid: 1000 }]);
export const own = { owner: "ana" };
export const two = (n: number) => String(n).padStart(2, "0");
export const stamp = (rng: Rng, from = 8, to = 17) => `2026-10-27T${two(rng.int(from, to))}:${two(rng.int(0, 59))}:${two(rng.int(0, 59))}Z`;

const HOSTS = ["HR-LAP-12", "FIN-LAP-03", "ENG-LAP-41", "OPS-LAP-07", "SRV-FILE-01", "SRV-WEB-02", "DC-01"];
const USERS = ["sara", "omar", "lina", "youssef", "nadia", "karim"];

function securityCsv(rng: Rng, attacker: string) {
  const rows: string[] = [];
  for (let i = 0; i < 40; i++) rows.push(`${stamp(rng)},4624,${rng.pick(HOSTS)},${rng.pick(USERS)},10.0.${rng.int(1, 9)}.${rng.int(2, 200)}`);
  const count: [string, number][] = [[attacker, rng.int(30, 60)], ["198.51.100.23", rng.int(3, 9)], ["192.0.2.44", rng.int(2, 8)], ["10.0.4.19", rng.int(4, 12)]];
  for (const [ip, n] of count) for (let i = 0; i < n; i++) rows.push(`${stamp(rng)},4625,${rng.pick(HOSTS)},${rng.pick(["admin", "administrator", ...USERS])},${ip}`);
  return `time,event,host,user,src_ip\n${rows.sort().join("\n")}\n`;
}

function sysmonCsv(rng: Rng, parent: string, child: string) {
  const pairs: [string, string, number][] = [["services.exe", "svchost.exe", 60], ["explorer.exe", "chrome.exe", 40], ["svchost.exe", "taskhostw.exe", 20], ["explorer.exe", "OUTLOOK.EXE", 15], ["OUTLOOK.EXE", "WINWORD.EXE", 6]];
  const rows: string[] = [];
  for (const [p, c, n] of pairs) for (let i = 0; i < n; i++) rows.push(`${stamp(rng)},${rng.pick(HOSTS)},${p},${c}`);
  rows.push(`${stamp(rng)},${rng.pick(HOSTS)},${parent},${child}`);
  return `time,host,parent,image\n${rows.sort().join("\n")}\n`;
}

const siem: Mission[] = [
  {
    id: "siem-1",
    title: "Failed logons by source",
    brief: "This is Month 9's first gate query, done with a pipeline. `/var/log/export/security.csv` is a SIEM export with columns `time,event,host,user,src_ip`. Event 4625 is a failed logon. Find the source IP with the most failures and submit it.",
    greeting: "Same shape as KQL: filter, then group and count, then sort.",
    hints: ["Filter first: `grep ',4625,' /var/log/export/security.csv`", "The IP is field 5: add `| cut -d, -f5`", "Then group and count: `| sort | uniq -c | sort -rn | head -3`"],
    build: (rng) => {
      const shell = ana();
      const ip = rng.pick(["203.0.113.7", "203.0.113.90", "198.51.100.77"]);
      shell.fs.put("/var/log/export/security.csv", securityCsv(rng, ip));
      return { shell, flag: ip };
    },
    passed: submitted,
    solve: (w) => ["grep ',4625,' /var/log/export/security.csv | cut -d, -f5 | sort | uniq -c | sort -rn | head -1", `submit ${w.flag}`],
    debrief: "That pipeline is `summarize count() by IpAddress | sort by count desc`. Only the spelling changes between tools, so once you think in filter, group, sort, you can read any SIEM language.",
  },
  {
    id: "siem-2",
    title: "New service installed",
    brief: "Attackers love services because they survive a reboot. `/var/log/export/system.csv` has columns `time,event,host,service,path`. Event 7036 is routine (a service changed state). Event 7045 means a new service was installed. Find the new service and submit its name.",
    hints: ["`grep ',7045,' /var/log/export/system.csv`", "The name is field 4."],
    build: (rng) => {
      const shell = ana();
      const name = rng.pick(["WinUpdateHelper", "NetCfgAgent", "SysDiagSvc"]);
      const rows = Array.from({ length: 120 }, () => `${stamp(rng)},7036,${rng.pick(HOSTS)},${rng.pick(["Spooler", "BITS", "wuauserv", "Dnscache", "W32Time"])},-`);
      rows.push(`${stamp(rng)},7045,${rng.pick(HOSTS)},${name},C:\\Users\\Public\\${name.toLowerCase()}.exe`);
      shell.fs.put("/var/log/export/system.csv", `time,event,host,service,path\n${rows.sort().join("\n")}\n`);
      return { shell, flag: name };
    },
    passed: submitted,
    solve: (w) => ["grep ',7045,' /var/log/export/system.csv", `submit ${w.flag}`],
    debrief: "Look at its path too: a service running from `C:\\Users\\Public` is a strong warning sign, because real services live in `Program Files` or `System32`. Context turned one line into a finding.",
  },
  {
    id: "siem-3",
    title: "Rare parent and child",
    brief: "Rare is interesting. `/var/log/export/sysmon.csv` has columns `time,host,parent,image`, one row per new process, and the first line is a header. Count every parent and child pair, find the rarest, and submit the **parent** process name.",
    hints: ["Skip the header and keep two fields: `awk -F, 'NR > 1 {print $3, $4}' /var/log/export/sysmon.csv`", "Then `| sort | uniq -c | sort -n | head -3`. The rarest pair comes first."],
    build: (rng) => {
      const shell = ana();
      const parent = rng.pick(["WINWORD.EXE", "EXCEL.EXE"]);
      shell.fs.put("/var/log/export/sysmon.csv", sysmonCsv(rng, parent, rng.pick(["powershell.exe", "cmd.exe"])));
      return { shell, flag: parent };
    },
    passed: submitted,
    solve: (w) => ["awk -F, 'NR > 1 {print $3, $4}' /var/log/export/sysmon.csv | sort | uniq -c | sort -n | head -1", `submit ${w.flag}`],
    debrief: "An Office app starting a shell is rare, and rare plus risky is exactly what a hunt looks for. You've now written all three of the Month 9 gate queries.",
  },
];

function processCsv(rng: Rng, hosts: string[]) {
  const rows: string[] = [];
  const hash = (s: string) => sha256(`${s}-${rng.int(1, 1_000_000)}`);
  for (let i = 0; i < 120; i++) rows.push(`${stamp(rng)},${rng.pick(HOSTS)},${rng.pick(["explorer.exe", "services.exe", "svchost.exe"])},${rng.pick(["chrome.exe", "svchost.exe", "OUTLOOK.EXE"])},${hash("noise")}`);
  const bad = hosts.map((h) => {
    const sum = hash(h);
    rows.push(`${stamp(rng)},${h},WINWORD.EXE,powershell.exe,${sum}`);
    return sum;
  });
  return { csv: `time,host,parent,image,sha256\n${rows.sort().join("\n")}\n`, bad };
}

const behaviourWorld = (rng: Rng) => {
  const shell = ana();
  const hosts = rng.shuffle(HOSTS).slice(0, rng.int(3, 6));
  const { csv, bad } = processCsv(rng, hosts);
  shell.fs.put("/var/log/export/process.csv", csv);
  shell.fs.put("/home/ana/report.txt", `Intel report, TLP:GREEN\nA loader was seen in the sector this week.\nIndicator, SHA-256: ${bad[0]}\n`, own);
  return { shell, hosts };
};

const behaviour: Mission[] = [
  {
    id: "behav-1",
    title: "Hunt by hash",
    brief: "`~/report.txt` gives one SHA-256. `/var/log/export/process.csv` has columns `time,host,parent,image,sha256`. Search for that hash and submit the host it was seen on.",
    hints: ["`cat report.txt`, then copy the hash.", "`grep <hash> /var/log/export/process.csv`. The host is field 2."],
    build: (rng) => {
      const { shell, hosts } = behaviourWorld(rng);
      return { shell, flag: hosts[0] as string };
    },
    passed: submitted,
    solve: (w) => {
      const h = /SHA-256: (\w+)/.exec(w.shell.fs.lookup("/home/ana/report.txt", "/", w.shell.creds).content)?.[1];
      return [`grep ${h} /var/log/export/process.csv`, `submit ${w.flag}`];
    },
    debrief: "One host. It's tempting to stop here and write \"contained\". The next mission shows why that would be wrong.",
  },
  {
    id: "behav-2",
    title: "Hunt by behaviour",
    brief: "The attacker repacks the file for every victim, so each one has a different hash. The behaviour doesn't change: Word starts PowerShell. In `/var/log/export/process.csv`, count how many **different hosts** show `WINWORD.EXE` starting `powershell.exe`, and submit the number.",
    hints: ["`grep 'WINWORD.EXE,powershell.exe' /var/log/export/process.csv`", "Keep field 2, then count unique values: `| cut -d, -f2 | sort -u | wc -l`"],
    build: (rng) => {
      const { shell, hosts } = behaviourWorld(rng);
      return { shell, flag: String(hosts.length) };
    },
    passed: submitted,
    solve: (w) => ["grep 'WINWORD.EXE,powershell.exe' /var/log/export/process.csv | cut -d, -f2 | sort -u | wc -l", `submit ${w.flag}`],
    debrief: "The hash found one host. The behaviour found all of them, including those no report mentions. That gap is the whole Pyramid of Pain in one exercise.",
  },
];

const eml = (o: { from: string; ret: string; reply: string; spf: string; dkim: string; dmarc: string; body: string; subject: string }) =>
  [
    `Return-Path: <bounce@${o.ret}>`,
    `Received: from mail.${o.ret} (mail.${o.ret} [203.0.113.40]) by mx.oasis.example; Tue, 27 Oct 2026 08:12:03 +0000`,
    `Authentication-Results: mx.oasis.example; spf=${o.spf} smtp.mailfrom=${o.ret}; dkim=${o.dkim} header.d=${o.ret}; dmarc=${o.dmarc} header.from=${o.from}`,
    `From: "Payroll Team" <payroll@${o.from}>`,
    `Reply-To: ${o.reply}`,
    "To: sara@oasis.example",
    `Subject: ${o.subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
    "",
    btoa(o.body),
    "",
  ].join("\n");

function phishWorld(rng: Rng) {
  const shell = ana();
  const reply = rng.pick(["payroll.desk@mailbox.example", "hr-support@inbox.example", "salary.team@post.example"]);
  const link = rng.pick(["oasis-hr-portal.example", "payroll-verify.example", "staff-oasis-login.example"]);
  const failed = rng.pick(["dmarc", "spf"]);
  const subject = "Action needed: confirm your salary details";
  const body = `<p>Dear colleague,</p><p>Please confirm your bank details within 24 hours.</p><a href="https://${link}/verify?id=${rng.int(1000, 9999)}">Confirm now</a>`;
  shell.fs.put("/home/ana/mail/reported.eml", eml({ from: "oasis-payroll.example", ret: "mailer-77.example", reply, subject, body, spf: failed === "spf" ? "fail" : "pass", dkim: "pass", dmarc: failed === "dmarc" ? "fail" : "pass" }), own);
  const count = rng.int(6, 20);
  const staff = ["sara", "omar", "lina", "youssef", "nadia", "karim", "imane", "hamza", "salma", "adil", "rania", "tarik", "ghita", "mehdi", "aya", "reda", "hind", "zakaria", "fatima", "samir"];
  const rows: string[] = staff.slice(0, count).map((u) => `${stamp(rng, 8, 9)},payroll@oasis-payroll.example,${u}@oasis.example,${subject},delivered`);
  for (let i = 0; i < 80; i++) rows.push(`${stamp(rng)},${rng.pick(["news@vendor.example", "it@oasis.example", "ceo@oasis.example"])},${rng.pick(staff)}@oasis.example,${rng.pick(["Weekly digest", "Maintenance window", "Team lunch"])},delivered`);
  shell.fs.put("/var/log/mail/gateway.csv", `time,from,to,subject,action\n${rows.sort().join("\n")}\n`);
  return { shell, reply, link, failed, count };
}

const phish: Mission[] = [
  {
    id: "phish-1",
    title: "Where would a reply go?",
    brief: "A user reported `~/mail/reported.eml`. An `.eml` file is plain text, so reading it can't run anything. The `From` looks fine. Find the `Reply-To` address and submit it.",
    hints: ["`grep -i '^reply-to' mail/reported.eml`"],
    build: (rng) => {
      const w = phishWorld(rng);
      return { shell: w.shell, flag: w.reply };
    },
    passed: submitted,
    solve: (w) => ["grep -i '^reply-to' mail/reported.eml", `submit ${w.flag}`],
    debrief: "A different domain in `Reply-To` means the sender wants the conversation somewhere you can't see. On its own it isn't proof, but it's a classic sign of fraud.",
  },
  {
    id: "phish-2",
    title: "Read the verdicts",
    brief: "The receiving server recorded its checks in `Authentication-Results`. Find that line. One of `spf`, `dkim` or `dmarc` failed. Submit the name of the one that failed.",
    hints: ["`grep Authentication-Results mail/reported.eml`", "Look for `=fail`."],
    build: (rng) => {
      const w = phishWorld(rng);
      return { shell: w.shell, flag: w.failed };
    },
    passed: submitted,
    solve: (w) => ["grep Authentication-Results mail/reported.eml", `submit ${w.flag}`],
    debrief: "Notice that a check passed for `mailer-77.example` but the `From` shows another domain. That's what alignment is about: passing means nothing unless it passes for the domain you actually see.",
  },
  {
    id: "phish-3",
    title: "Open it without opening it",
    brief: "The body is base64, which is an encoding, so decoding it is safe: nothing renders or runs. It's the last non-empty line of the file. Decode it and submit the **domain** of the link. Don't include `https://` or any path.",
    hints: ["`tail -1 mail/reported.eml | base64 -d`", "The domain sits between `https://` and the next `/`."],
    build: (rng) => {
      const w = phishWorld(rng);
      return { shell: w.shell, flag: w.link };
    },
    passed: submitted,
    solve: (w) => ["tail -1 mail/reported.eml | base64 -d", `submit ${w.flag}`],
    debrief: "You've extracted an indicator without clicking anything. When you share it, defang it, like `example[.]com`, so nobody clicks it by accident.",
  },
  {
    id: "phish-4",
    title: "Who else got it?",
    brief: "This is the step people forget. `/var/log/mail/gateway.csv` has columns `time,from,to,subject,action`. Search for the subject `confirm your salary details`, and submit how many different people received it.",
    hints: ["`grep 'confirm your salary' /var/log/mail/gateway.csv`", "The recipient is field 3: `| cut -d, -f3 | sort -u | wc -l`"],
    build: (rng) => {
      const w = phishWorld(rng);
      return { shell: w.shell, flag: String(w.count) };
    },
    passed: submitted,
    solve: (w) => ["grep 'confirm your salary' /var/log/mail/gateway.csv | cut -d, -f3 | sort -u | wc -l", `submit ${w.flag}`],
    debrief: "One report became a whole list of people at risk. Now you can pull the message from their mailboxes, block the domain, and check who clicked.",
  },
];

/** Events a rule is tested against: `label,parent,image,cmdline`. */
function ruleTests(rng: Rng, trap: boolean) {
  const bad = ["WINWORD.EXE,powershell.exe,powershell -nop -w hidden", "EXCEL.EXE,cmd.exe,cmd /c whoami", "WINWORD.EXE,cmd.exe,cmd /c ipconfig", "EXCEL.EXE,powershell.exe,powershell -c Get-Process", "WINWORD.EXE,powershell.exe,powershell -File update.ps1"];
  const good = [
    "deployagent.exe,powershell.exe,powershell -File C:\\Deploy\\inventory.ps1", "explorer.exe,powershell.exe,powershell", "explorer.exe,cmd.exe,cmd", "services.exe,svchost.exe,svchost -k netsvcs",
    "WINWORD.EXE,splwow64.exe,splwow64.exe 12288", "EXCEL.EXE,chrome.exe,chrome https://intranet.example", "taskeng.exe,cmd.exe,cmd /c cleanup.bat", "explorer.exe,WINWORD.EXE,WINWORD.EXE report.docx",
  ];
  if (trap) good.push("deployagent.exe,powershell.exe,powershell -File C:\\Deploy\\repair-WINWORD.ps1", "explorer.exe,cmd.exe,cmd /c del EXCEL.EXE.tmp");
  const rows = [...bad.map((b) => `malicious,${b}`), ...good.flatMap((g) => Array.from({ length: rng.int(1, 3) }, () => `benign,${g}`))];
  return rng.shuffle(rows);
}

function ruleWorld(rng: Rng, trap: boolean): Built {
  const shell = ana();
  const rows = ruleTests(rng, trap);
  shell.fs.put("/opt/rules/tests/events.csv", `parent,image,cmdline\n${rows.map((r) => r.slice(r.indexOf(",") + 1)).join("\n")}\n`);
  const state = { clean: false };
  tool(shell, "testrule", (ctx) => {
    const pat = ctx.args[0];
    if (pat === undefined) return { stdout: "", stderr: "usage: testrule 'REGEX'\n", code: 2 };
    let re: RegExp;
    try {
      re = new RegExp(posixToJs(pat, true));
    } catch {
      return { stdout: "", stderr: "testrule: invalid regular expression\n", code: 2 };
    }
    let tp = 0;
    let fp = 0;
    let bad = 0;
    for (const r of rows) {
      const i = r.indexOf(",");
      const hit = re.test(r.slice(i + 1));
      const mal = r.startsWith("malicious");
      if (mal) bad++;
      if (hit && mal) tp++;
      if (hit && !mal) fp++;
    }
    state.clean = tp === bad && fp === 0;
    return {
      stdout: `tested against ${rows.length} labelled events\n  caught:          ${tp} of ${bad} malicious\n  false positives: ${fp}\n  missed:          ${bad - tp}\n${state.clean ? "PASS: every attack caught, no false alarms\n" : ""}`,
      stderr: "",
      code: state.clean ? 0 : 1,
    };
  });
  shell.helpExtra = "This box adds:  testrule 'REGEX'  (tests a rule against labelled events)";
  return { shell, state };
}

const detect: Mission[] = [
  {
    id: "detect-1",
    title: "Write a rule that passes its tests",
    brief: "Hypothesis: \"Office apps shouldn't start shells.\" `/opt/rules/tests/events.csv` holds test events as `parent,image,cmdline`. Try `testrule powershell` and see how noisy it is. Then write an extended regex that catches `WINWORD.EXE` or `EXCEL.EXE` starting `powershell.exe` or `cmd.exe`, until the tool prints PASS.",
    greeting: "A rule without tests is a guess. testrule shows you what your rule catches and what it wrongly flags.",
    hints: ["`(A|B)` means A or B, and `.*` means anything in between.", "Try `testrule '(WINWORD|EXCEL).*(powershell|cmd)'` and read the false positives.", "Be stricter: the parent is field 1 and the image is field 2. `testrule '(WINWORD|EXCEL)\\.EXE,(powershell|cmd)\\.exe'`"],
    build: (rng) => ruleWorld(rng, false),
    passed: (w) => w.state?.clean === true,
    solve: () => ["testrule '(WINWORD|EXCEL)\\.EXE,(powershell|cmd)\\.exe'"],
    debrief: "You just did detection as code: a hypothesis, logic, and tests that say pass or fail. Your rule now has evidence behind it, which is what the Month 11 gate asks for.",
  },
  {
    id: "detect-2",
    title: "A false positive appears",
    brief: "New test events were added, and they contain a tricky one: a repair script whose name contains `WINWORD`. A careless rule that matches anywhere on the line now fires. Run your rule, look at the tests, and make it pass again. It must match only when the **parent** field is Office.",
    hints: ["`grep -i winword /opt/rules/tests/events.csv` shows what's happening.", "`^` anchors a pattern to the start of the line, which is the parent field.", "`testrule '^(WINWORD|EXCEL)\\.EXE,(powershell|cmd)\\.exe'`"],
    build: (rng) => ruleWorld(rng, true),
    passed: (w) => w.state?.clean === true,
    solve: () => ["testrule '^(WINWORD|EXCEL)\\.EXE,(powershell|cmd)\\.exe'"],
    debrief: "Rules match structure, not vibes. In a real SIEM you'd compare the `ParentImage` field rather than the whole line, and your test events are what caught the mistake before it reached production.",
  },
  {
    id: "detect-3",
    title: "Measure precision",
    brief: "`~/alerts.csv` has a month of closed alerts as `id,rule,verdict`. Precision is true positives divided by all alerts. Work out the precision of the rule `office_shell` as a whole percentage, and submit only the number, like `75`.",
    hints: ["`grep office_shell alerts.csv | cut -d, -f3 | sort | uniq -c`", "Precision = TP ÷ (TP + FP) × 100."],
    build: (rng) => {
      const shell = ana();
      const [tp, fp] = rng.pick([[18, 2], [27, 3], [12, 4], [9, 1], [30, 10], [16, 4]] as [number, number][]);
      const rows = [...Array.from({ length: tp }, () => "office_shell,true_positive"), ...Array.from({ length: fp }, () => "office_shell,false_positive"), ...Array.from({ length: 40 }, () => `${rng.pick(["new_service", "failed_logons"])},${rng.pick(["true_positive", "false_positive"])}`)];
      shell.fs.put("/home/ana/alerts.csv", `id,rule,verdict\n${rng.shuffle(rows).map((r, i) => `A-${1000 + i},${r}`).join("\n")}\n`, own);
      return { shell, flag: String(Math.round((tp / (tp + fp)) * 100)) };
    },
    passed: submitted,
    solve: (w) => ["grep office_shell alerts.csv | cut -d, -f3 | sort | uniq -c", `submit ${w.flag}`],
    debrief: "Measuring per rule tells you where to spend tuning time. A rule with low precision wears out analysts, and a rule that never fires may simply be broken, so measure that as well.",
  },
];

function incident(rng: Rng) {
  const shell = ana();
  const ip = rng.pick(["203.0.113.7", "198.51.100.77", "192.0.2.150"]);
  const user = rng.pick(["omar", "lina", "karim"]);
  const hosts = rng.shuffle(["srv-file-01", "srv-web-02", "fin-lap-03", "eng-lap-41", "srv-db-01"]).slice(0, rng.int(2, 5));
  const first = `2026-10-27T02:${two(rng.int(10, 29))}:${two(rng.int(0, 59))}Z`;
  const noise = (src: string) => `${stamp(rng, 8, 17)} ${src} user=${rng.pick(USERS)} host=${rng.pick(["fin-lap-03", "hr-lap-12", "ops-lap-07"])} action=normal`;
  const vpn = [`${first} vpn user=${user} src=${ip} action=login_success`, ...Array.from({ length: 30 }, () => noise("vpn"))];
  const dc = hosts.map((h, i) => `2026-10-27T03:${two(10 + i * 4)}:${two(rng.int(0, 59))}Z dc user=${user} host=${h} action=remote_logon`);
  dc.push(`2026-10-27T04:${two(rng.int(10, 40))}:00Z dc user=${user} host=dc-01 action=created_account name=helpdesk2`, ...Array.from({ length: 30 }, () => noise("dc")));
  const web = [`2026-10-26T23:${two(rng.int(10, 50))}:00Z web src=10.0.3.8 path=/login status=200`, ...Array.from({ length: 30 }, () => `${stamp(rng, 8, 17)} web src=10.0.${rng.int(1, 9)}.${rng.int(2, 200)} path=/ status=200`)];
  shell.fs.put("/evidence/vpn.log", `${rng.shuffle(vpn).join("\n")}\n`);
  shell.fs.put("/evidence/dc.log", `${rng.shuffle(dc).join("\n")}\n`);
  shell.fs.put("/evidence/web.log", `${rng.shuffle(web).join("\n")}\n`);
  return { shell, ip, user, hosts, first };
}

const timeline: Mission[] = [
  {
    id: "time-1",
    title: "One timeline",
    brief: "Three logs sit in `/evidence`. Each line starts with a UTC time in ISO format, and that format sorts correctly as text. Combine all three, sorted, into `~/timeline.txt`.",
    hints: ["`cat /evidence/*.log` joins them.", "`cat /evidence/*.log | sort > timeline.txt`"],
    build: (rng) => {
      const w = incident(rng);
      return { shell: w.shell };
    },
    passed: (w) => {
      try {
        const got = w.shell.fs.lookup("/home/ana/timeline.txt", "/", w.shell.creds).content.trim().split("\n");
        const want = ["vpn", "dc", "web"].flatMap((f) => w.shell.fs.lookup(`/evidence/${f}.log`, "/", w.shell.creds).content.trim().split("\n"));
        return got.length === want.length && got.every((l, i) => i === 0 || (got[i - 1] as string) <= l);
      } catch {
        return false;
      }
    },
    solve: () => ["cat /evidence/*.log | sort > timeline.txt"],
    debrief: "This is why every responder insists on UTC and ISO timestamps: sorting becomes trivial, and separate systems line up into one story.",
  },
  {
    id: "time-2",
    title: "The first touch",
    brief: "Threat intelligence flagged a source IP, which is in `~/alert.txt`. Find the **earliest** event from that IP across all three logs. Submit the user it logged in as.",
    hints: ["`cat alert.txt`", "`cat /evidence/*.log | sort | grep <ip> | head -1`"],
    build: (rng) => {
      const w = incident(rng);
      w.shell.fs.put("/home/ana/alert.txt", `Suspicious source: ${w.ip}\n`, own);
      return { shell: w.shell, flag: w.user };
    },
    passed: submitted,
    solve: (w) => {
      const ip = /: (\S+)/.exec(w.shell.fs.lookup("/home/ana/alert.txt", "/", w.shell.creds).content)?.[1];
      return [`cat /evidence/*.log | sort | grep ${ip} | head -1`, `submit ${w.flag}`];
    },
    debrief: "Fact: that account logged in from that IP at that time. Inference: the password was probably stolen. Keep the two apart in your report, as Month 15 will drill.",
  },
  {
    id: "time-3",
    title: "Scope it",
    brief: "The compromised user is in `~/alert.txt`. In `/evidence/dc.log`, count how many different hosts that user made a `remote_logon` to, and submit the number. That number decides how many machines you must contain.",
    hints: ["`grep <user> /evidence/dc.log | grep remote_logon`", "`grep -o 'host=[^ ]*'` pulls out the host. Then `sort -u | wc -l`."],
    build: (rng) => {
      const w = incident(rng);
      w.shell.fs.put("/home/ana/alert.txt", `Compromised user: ${w.user}\n`, own);
      return { shell: w.shell, flag: String(w.hosts.length) };
    },
    passed: submitted,
    solve: (w) => {
      const u = /: (\S+)/.exec(w.shell.fs.lookup("/home/ana/alert.txt", "/", w.shell.creds).content)?.[1];
      return [`grep ${u} /evidence/dc.log | grep remote_logon | grep -o 'host=[^ ]*' | sort -u | wc -l`, `submit ${w.flag}`];
    },
    debrief: "Scope drives everything that follows. Contain too little and the attacker stays, contain too much and you stop the business for nothing. And look: `action=created_account` shows persistence you'd also have to remove.",
  },
];

function registerCsv(rng: Rng) {
  const risks = ["Ransomware halts orders", "Laptop theft", "Vendor data breach", "Portal outage", "Phishing of finance staff", "Cloud bucket exposure", "Insider copies customer data", "Backup restore fails"];
  const ids = rng.shuffle(["R-01", "R-02", "R-03", "R-04", "R-05", "R-06", "R-07", "R-08"]);
  const top = ids[0] as string;
  const noOwner = ids[1] as string;
  const stale = ids[2] as string;
  const rows = risks.map((r, i) => {
    const id = ids[i] as string;
    const l = id === top ? 5 : rng.int(1, 4);
    const im = id === top ? 5 : rng.int(1, 4);
    const owner = id === noOwner ? "" : rng.pick(["COO", "CFO", "CISO", "IT lead"]);
    const treatment = id === stale ? "accept" : rng.pick(["mitigate", "transfer"]);
    const review = id === stale ? "2025-06-30" : "2027-03-31";
    return `${id},${r},${rng.pick(["ERP", "Portal", "Laptops"])},${l},${im},${owner},${treatment},${review}`;
  });
  rows.push("R-09,Old kiosk unsupported,Kiosk,1,2,CFO,accept,2027-06-30");
  return { csv: `id,risk,asset,likelihood,impact,owner,treatment,review\n${rows.join("\n")}\n`, top, noOwner, stale };
}

const riskWorld = (rng: Rng) => {
  const shell = ana();
  const r = registerCsv(rng);
  shell.fs.put("/home/ana/register.csv", r.csv, own);
  return { shell, ...r };
};

const risk: Mission[] = [
  {
    id: "risk-1",
    title: "The biggest risk",
    brief: "`~/register.csv` is a risk register. Field 4 is likelihood and field 5 is impact. Score is likelihood × impact. Find the risk with the highest score and submit its id, like `R-03`.",
    hints: ["`awk -F, 'NR > 1 {print $4 * $5, $1}' register.csv` prints each score and id.", "Add `| sort -rn | head -1`"],
    build: (rng) => {
      const w = riskWorld(rng);
      return { shell: w.shell, flag: w.top };
    },
    passed: submitted,
    solve: (w) => ["awk -F, 'NR > 1 {print $4 * $5, $1}' register.csv | sort -rn | head -1", `submit ${w.flag}`],
    debrief: "A score is a way of starting a conversation, not an answer. A director will ask why it's a 5, so be ready to defend each rating.",
  },
  {
    id: "risk-2",
    title: "Nobody owns this",
    brief: "A risk with no owner is a risk nobody will fix. Field 6 is the owner. Find the row with an empty owner and submit its id.",
    hints: ["`awk -F, '$6 == \"\"' register.csv`"],
    build: (rng) => {
      const w = riskWorld(rng);
      return { shell: w.shell, flag: w.noOwner };
    },
    passed: submitted,
    solve: (w) => ["awk -F, '$6 == \"\"' register.csv", `submit ${w.flag}`],
    debrief: "Auditors look for this first, because an unowned risk means that nobody is accountable for the decision.",
  },
  {
    id: "risk-3",
    title: "An expired acceptance",
    brief: "Accepting a risk is valid, but only until its review date. Today is 2026-11-06. Field 7 is the treatment and field 8 is the review date. Find the risk that was accepted and whose review date has passed, and submit its id.",
    hints: ["ISO dates sort as text, so `<` works on them.", "`awk -F, '$7 == \"accept\" && $8 < \"2026-11-06\"' register.csv`"],
    build: (rng) => {
      const w = riskWorld(rng);
      return { shell: w.shell, flag: w.stale };
    },
    passed: submitted,
    solve: (w) => ["awk -F, '$7 == \"accept\" && $8 < \"2026-11-06\"' register.csv", `submit ${w.flag}`],
    debrief: "Yesterday's acceptance isn't today's. Risks change, so an accepted risk needs a date when someone must look at it again.",
  },
];

export const MISSIONS_SOC: Record<string, RangeSet> = {
  siem: { title: "Answer questions with log queries", missions: siem },
  behaviour: { title: "Hash versus behaviour", missions: behaviour },
  phish: { title: "Analyse a reported email", missions: phish },
  detect: { title: "Write, test and measure a detection", missions: detect },
  timeline: { title: "Rebuild an incident from three logs", missions: timeline },
  risk: { title: "Audit a risk register", missions: risk },
};
