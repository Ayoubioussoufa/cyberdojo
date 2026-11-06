/**
 * Programs running with more privilege than they need. pwn.college's Program
 * Misuse teaches this from the attacker's side; here you audit and fix it.
 */
import { submitted, type Mission } from "../kit";
import { ana, modeOf } from "./kit";

const put = (sh: ReturnType<typeof ana>, path: string, mode = 0o4755) => sh.fs.put(path, "\x7fELF\0", { mode });
const FIND = "find / -type f -perm -4000 2>/dev/null";

export const AUDIT: Mission[] = [
  {
    id: "dojo-audit-1",
    title: "Find every SUID program",
    brief: "A program with the SUID bit runs as its owner, whoever starts it. Root-owned SUID programs are the first thing to review on a host. How many files on this machine have the bit? Submit the number.",
    hints: ["`find / -type f -perm -4000`", "Hide the errors with `2>/dev/null`, and count with `wc -l`."],
    build: (rng) => {
      const shell = ana();
      const n = rng.int(1, 4);
      shell.fs.dir("/opt", { mode: 0o755 });
      for (let i = 0; i < n; i++) put(shell, `/opt/tool${i}`);
      const flag = shell.run(`${FIND} | wc -l`).trim();
      shell.history = [];
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => [`${FIND} | wc -l`, `submit ${w.flag}`],
    debrief: "`-perm -4000` means at least this bit is set. Real hosts have a few dozen of these, and each one is code that runs as root on behalf of any user.",
  },
  {
    id: "dojo-audit-2",
    title: "What changed since the baseline?",
    brief: "`baseline.txt` lists the SUID programs from the approved build. One was added since. Find it by comparing the baseline with the machine as it is now, and submit its path.",
    hints: ["Save the current list, sorted: `find / -type f -perm -4000 2>/dev/null | sort > now.txt`", "`uniq -u` keeps lines that appear only once: `sort baseline.txt now.txt | uniq -u`"],
    build: (rng) => {
      const shell = ana();
      const clean = shell.run(`${FIND} | sort`);
      shell.history = [];
      shell.fs.put("/home/ana/baseline.txt", clean, { owner: "ana" });
      const odd = `/usr/local/bin/${rng.pick(["netcheck", "sysreport", "logview", "update-helper"])}`;
      put(shell, odd);
      return { shell, flag: odd };
    },
    passed: submitted,
    solve: (w) => [`${FIND} | sort > now.txt`, "sort baseline.txt now.txt | uniq -u", `submit ${w.flag}`],
    debrief: "Lists on their own are hard to judge. Differences aren't. Comparing a host with a known-good baseline is file integrity monitoring, the idea behind tools like AIDE and Wazuh.",
  },
  {
    id: "dojo-audit-3",
    title: "Remove the bit",
    brief: "`/usr/local/bin/logview` is SUID root and doesn't need it. Remove only that bit, using the `sudo chmod` you've been given, and leave its other permissions alone.",
    hints: ["`u-s` removes SUID.", "`sudo chmod u-s /usr/local/bin/logview`, then check with `ls -l`."],
    build: () => {
      const shell = ana();
      put(shell, "/usr/local/bin/logview");
      shell.sudoRules.ana = ["/usr/bin/chmod"];
      return { shell };
    },
    passed: (w) => modeOf(w, "/usr/local/bin/logview") === 0o755,
    solve: () => ["sudo chmod u-s /usr/local/bin/logview"],
    notEnough: () => ["sudo chmod u-w /usr/local/bin/logview"],
    debrief: "Before removing a bit in production, check what depends on it. If a tool truly needs one privilege, Linux capabilities can grant that alone, instead of all of root.",
  },
  {
    id: "dojo-audit-4",
    title: "A script root trusts",
    brief: "A root cron job runs `/opt/nightly.sh`, and anyone can edit that file, so anyone can run code as root. Read `/etc/cron.d/nightly`, then remove write permission for others from the script.",
    hints: ["`find /opt -type f -perm -002` shows world-writable files.", "`sudo chmod o-w /opt/nightly.sh`"],
    build: () => {
      const shell = ana();
      shell.fs.dir("/opt", { mode: 0o755 });
      shell.fs.dir("/etc/cron.d", { mode: 0o755 });
      shell.fs.put("/opt/nightly.sh", "#!/bin/bash\ntar czf /var/backups/www.tgz /var/www\n", { mode: 0o777 });
      shell.fs.put("/etc/cron.d/nightly", "0 2 * * * root /opt/nightly.sh\n", { mode: 0o644 });
      shell.sudoRules.ana = ["/usr/bin/chmod"];
      return { shell };
    },
    passed: (w) => ((modeOf(w, "/opt/nightly.sh") ?? 0o777) & 0o002) === 0,
    solve: () => ["cat /etc/cron.d/nightly", "find /opt -type f -perm -002", "sudo chmod o-w /opt/nightly.sh"],
    debrief: "Anything a privileged process runs has to be protected as carefully as the privilege itself: the script, its folder, and whatever it reads. Audit the whole chain.",
  },
];
