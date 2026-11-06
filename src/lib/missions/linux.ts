/** Day zero and Month 1: the shell, files, pipes, permissions, processes. */
import type { Rng } from "@/lib/rng";
import { machine } from "@/lib/shell/world";
import { flagFrom, submitted, type Built, type Mission, type RangeSet } from "./kit";

const ana = (extra: { name: string; uid: number; groups?: string[] }[] = [], groups: string[] = []) =>
  machine("ana", [{ name: "ana", uid: 1000 }, ...extra], groups);

const NOISE = ["rotate logs", "backup ok", "disk 41%", "heartbeat", "cron tick", "sync done", "cache flush", "update check"];

export function authLog(rng: Rng, attacker: string, count: number) {
  const ips = [attacker, "198.51.100.23", "192.0.2.44", "203.0.113.90", "198.51.100.7"];
  const out: string[] = [];
  const counts: Record<string, number> = { [attacker]: count, "198.51.100.23": rng.int(3, 9), "192.0.2.44": rng.int(2, 8), "203.0.113.90": rng.int(1, 6), "198.51.100.7": rng.int(1, 5) };
  for (const ip of ips) for (let i = 0; i < (counts[ip] as number); i++) {
    const user = rng.pick(["root", "admin", "oracle", "test", "ubuntu"]);
    out.push(`Oct 27 0${rng.int(1, 9)}:${String(rng.int(10, 59))}:${String(rng.int(10, 59))} web1 sshd[${rng.int(800, 999)}]: Failed password for ${user} from ${ip} port ${rng.int(30000, 60000)} ssh2`);
  }
  for (let i = 0; i < 12; i++) out.push(`Oct 27 0${rng.int(1, 9)}:${String(rng.int(10, 59))}:${String(rng.int(10, 59))} web1 sshd[${rng.int(800, 999)}]: Accepted publickey for ana from 10.0.0.5 port ${rng.int(30000, 60000)} ssh2`);
  return `${rng.shuffle(out).join("\n")}\n`;
}

const firstSteps: Mission[] = [
  {
    id: "first-1",
    title: "Say hello to the machine",
    brief: "You're logged in to a Linux server. Find out who you are: type `whoami` and press Enter.",
    greeting: "Welcome. This box is a simulated Linux terminal. Type a command after the $ and press Enter.",
    hints: ["Click in the black box, type `whoami`, press Enter. That's the whole mission."],
    build: () => ({ shell: ana() }),
    passed: (_, cmd) => cmd.trim() === "whoami",
    solve: () => ["whoami"],
    debrief: "`whoami` is a program. You asked the operating system to run it and it answered: you are the user `ana`.",
  },
  {
    id: "first-2",
    title: "Where am I?",
    brief: "Every terminal is always standing in one folder. Ask where with `pwd`, then list what's there with `ls`.",
    hints: ["`pwd` stands for print working directory.", "Run `pwd`, press Enter, then run `ls`."],
    build: () => {
      const shell = ana();
      shell.fs.put("/home/ana/welcome.txt", "Hello.\n", { owner: "ana" });
      shell.fs.put("/home/ana/notes.txt", "Buy coffee.\n", { owner: "ana" });
      return { shell };
    },
    passed: (w) => w.shell.history.some((h) => h === "pwd") && w.shell.history.some((h) => /^ls( |$)/.test(h)),
    solve: () => ["pwd", "ls"],
    debrief: "You stand in `/home/ana`, your home folder. Everything you create starts here.",
  },
  {
    id: "first-3",
    title: "Your first flag",
    brief: "One file here holds a secret string that looks like `CD{...}`. Read files with `cat name`, find the flag, then type `submit CD{...}`.",
    hints: ["Run `ls` to see the file names.", "Run `cat flag.txt`.", "Copy the whole `CD{...}` string, then run: `submit` followed by a space and the flag."],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      shell.fs.put("/home/ana/flag.txt", `Well done. Here it is: ${flag}\n`, { owner: "ana" });
      shell.fs.put("/home/ana/todo.txt", "1. learn Linux\n2. learn networks\n", { owner: "ana" });
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["cat flag.txt", `submit ${w.flag}`],
    debrief: "That's the shape of nearly every hands-on platform you'll use: find the flag, prove it, move on.",
  },
];

const navigate: Mission[] = [
  {
    id: "nav-1",
    title: "Walk down the tree",
    brief: "The flag is in a file somewhere under `/home/ana/projects`. Use `cd`, `ls` and `cat` to reach it. Submit it.",
    hints: ["`cd projects` moves you into that folder. `ls` shows what's inside.", "Keep going down until you see `flag.txt`. `cd ..` goes back up one level."],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      shell.fs.put("/home/ana/projects/2026/reports/flag.txt", `${flag}\n`, { owner: "ana" });
      shell.fs.put("/home/ana/projects/2026/draft.txt", "nothing here\n", { owner: "ana" });
      shell.fs.put("/home/ana/projects/old/draft.txt", "nothing here either\n", { owner: "ana" });
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["cd projects/2026/reports", "cat flag.txt", `submit ${w.flag}`],
    debrief: "You used relative paths: directions that start from where you stand. Press Tab as you type: it completes names and saves you from typos.",
  },
  {
    id: "nav-2",
    title: "Files that hide",
    brief: "Names starting with a dot are hidden from plain `ls`. There's a hidden file in `/home/ana/vault`. Find it and submit its flag.",
    hints: ["Plain `ls` won't show it. Check `man ls`: which option means all?", "Try `ls -a vault`."],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      shell.fs.put("/home/ana/vault/readme.txt", "Nothing to see here.\n", { owner: "ana" });
      shell.fs.put("/home/ana/vault/.secret", `${flag}\n`, { owner: "ana" });
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["ls -a vault", "cat vault/.secret", `submit ${w.flag}`],
    debrief: "Attackers and malware love dot-files because a careless `ls` misses them. Defenders use `ls -la` out of habit.",
  },
  {
    id: "nav-3",
    title: "Awkward names",
    brief: "In `/home/ana/dropbox` there is a file whose name has spaces in it, and one called `-note`. Each is annoying to open. The flag is in `my secret file.txt`.",
    hints: ["The shell splits words on spaces. Put quotes around the name: `cat \"my secret file.txt\"`.", "You could also escape each space with a backslash."],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      shell.fs.put("/home/ana/dropbox/my secret file.txt", `${flag}\n`, { owner: "ana" });
      shell.fs.put("/home/ana/dropbox/-note", "To open me: cat ./-note\n", { owner: "ana" });
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["cd dropbox", 'cat "my secret file.txt"', `submit ${w.flag}`],
    debrief: "Quoting is how you tell the shell where one argument ends. Half of all shell bugs, including security bugs, are quoting bugs. You'll see this again in Month 3 and in command injection in Month 8.",
  },
  {
    id: "nav-4",
    title: "Absolute paths",
    brief: "From anywhere, read the file that names this machine: `/etc/hostname`. Then read `/etc/os-release` and submit the value of `VERSION_ID` with `submit`, quotes removed.",
    hints: ["An absolute path starts with `/`, so it works from any folder.", "`cat /etc/os-release`, then look at the `VERSION_ID` line."],
    build: () => ({ shell: ana(), flag: "26.04" }),
    passed: submitted,
    solve: () => ["cat /etc/hostname", "cat /etc/os-release", "submit 26.04"],
    debrief: "`/etc` holds a system's configuration. When you land on an unknown machine, `/etc/os-release` tells you what it is.",
  },
];

const findThings: Mission[] = [
  {
    id: "find-1",
    title: "Needle in a log",
    brief: "`/var/log/app.log` has 5,000 lines. Exactly one contains the word `ALERT`. Use `grep`, then submit the flag on that line.",
    hints: ["`grep WORD file` prints only matching lines."],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      const lines = Array.from({ length: 5000 }, (_, i) => `2026-10-27T0${i % 10}:00:00Z ${rng.pick(NOISE)}`);
      lines[rng.int(100, 4900)] = `2026-10-27T03:14:15Z ALERT token=${flag}`;
      shell.fs.put("/var/log/app.log", `${lines.join("\n")}\n`);
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["grep ALERT /var/log/app.log", `submit ${w.flag}`],
    debrief: "Half of security work is this: reduce a mountain of text to the few lines that matter.",
  },
  {
    id: "find-2",
    title: "Find by name",
    brief: "Somewhere under `/opt` there's a file called `keys.bak`. Use `find` to locate it, read it, submit the flag.",
    hints: ["`find /opt -name keys.bak`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      const dirs = ["app/conf", "app/logs", "tools/bin", "tools/lib/old", "data/archive/2024", "data/archive/2025"];
      for (const d of dirs) shell.fs.put(`/opt/${d}/readme`, "empty\n");
      shell.fs.put(`/opt/${rng.pick(dirs)}/keys.bak`, `${flag}\n`);
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["find /opt -name keys.bak -exec cat {} \\;", `submit ${w.flag}`],
    debrief: "`find` walks a whole tree for you. Backups like `.bak` are a classic place where secrets get left behind.",
  },
  {
    id: "find-3",
    title: "Find by size",
    brief: "Under `/srv/data` are many files. The right one is exactly 33 bytes. Find it and submit what's inside. Tip: `man find` shows how to match by size.",
    hints: ["`-size 33c` means exactly 33 bytes (c means bytes, for historic reasons).", "Add `-type f` to skip folders."],
    build: (rng) => {
      const flag = `CD{${"x".repeat(0)}${flagFrom(rng).slice(3, 13)}exactly33bytes!!!}`;
      const shell = ana();
      for (let i = 0; i < 30; i++) shell.fs.put(`/srv/data/file${i}.dat`, "z".repeat(rng.int(1, 30) + (i % 2 ? 40 : 0)) + "\n");
      shell.fs.put(`/srv/data/file${rng.int(30, 60)}.dat`, `${flag}${" ".repeat(Math.max(0, 32 - flag.length))}\n`);
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["find /srv/data -type f -size 33c -exec cat {} \\;", `submit ${w.flag}`],
    debrief: "You read a manual to solve a problem instead of guessing. That is the skill the whole first month is about.",
  },
  {
    id: "find-4",
    title: "Quiet the errors",
    brief: "Search the whole disk for a file called `pass.txt`. You'll get `Permission denied` noise from folders you can't read. Silence the errors, then read the file and submit the flag.",
    hints: ["Errors go to a separate stream, number 2. `2>/dev/null` throws them away.", "`find / -name pass.txt 2>/dev/null`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      shell.fs.dir("/var/secret", { mode: 0o700 });
      shell.fs.put("/var/secret/other.txt", "hidden\n");
      shell.fs.put("/var/tmp/.cache/pass.txt", `${flag}\n`);
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["find / -name pass.txt 2>/dev/null", "cat /var/tmp/.cache/pass.txt", `submit ${w.flag}`],
    debrief: "Programs have two output streams: stdout for results and stderr for errors. Separating them is what makes pipelines clean.",
  },
];

const pipes: Mission[] = [
  {
    id: "pipe-1",
    title: "Count the failures",
    brief: "`/var/log/auth.log` records logins. How many lines contain `Failed password`? Submit the number with `submit`.",
    hints: ["`grep` filters, `wc -l` counts lines. Connect them with `|`.", "`grep 'Failed password' /var/log/auth.log | wc -l`"],
    build: (rng) => {
      const shell = ana();
      const n = rng.int(30, 60);
      const log = authLog(rng, "203.0.113.7", n);
      shell.fs.put("/var/log/auth.log", log);
      return { shell, flag: String(log.split("\n").filter((l) => l.includes("Failed password")).length) };
    },
    passed: submitted,
    solve: (w) => ["grep 'Failed password' /var/log/auth.log | wc -l", `submit ${w.flag}`],
    debrief: "The pipe `|` sends one program's output into the next. Small tools, joined up: that's the Unix idea.",
  },
  {
    id: "pipe-2",
    title: "Pull out one column",
    brief: "Print only the source IP address of each failed login. Field 11 of those lines, counting words, is the IP. Then count how many DIFFERENT IPs tried, and submit that number.",
    hints: ["`awk '{print $11}'` prints field 11.", "`sort -u` keeps each value once, then `wc -l` counts them."],
    build: (rng) => {
      const shell = ana();
      shell.fs.put("/var/log/auth.log", authLog(rng, "203.0.113.7", rng.int(30, 60)));
      return { shell, flag: "5" };
    },
    passed: submitted,
    solve: () => ["grep 'Failed password' /var/log/auth.log | awk '{print $11}' | sort -u | wc -l", "submit 5"],
    debrief: "You just turned a log into data. `awk` and `cut` extract columns, and those columns are what you count and compare.",
  },
  {
    id: "pipe-3",
    title: "Who is attacking us?",
    brief: "This is a real interview task and a Month 1 exit gate. Find the single IP with the most failed logins, using one pipeline. Submit the IP.",
    hints: ["`uniq -c` counts neighbours, so `sort` first.", "Then `sort -rn` puts the biggest count on top, and `head -1` keeps it.", "`grep 'Failed password' /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head -1`"],
    build: (rng) => {
      const shell = ana();
      const ip = rng.pick(["203.0.113.7", "203.0.113.66", "198.51.100.200", "192.0.2.150"]);
      shell.fs.put("/var/log/auth.log", authLog(rng, ip, rng.int(40, 80)));
      return { shell, flag: ip };
    },
    passed: submitted,
    solve: (w) => ["grep 'Failed password' /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head -1", `submit ${w.flag}`],
    debrief: "That one line is a SOC analyst's daily bread. Remember the shape: filter, extract, sort, count, sort, top.",
  },
  {
    id: "pipe-4",
    title: "Save your evidence",
    brief: "Investigators keep evidence. Write every failed-login line to `/home/ana/evidence.txt`. Use `>` to send output to a file.",
    hints: ["`>` replaces a file's contents with the output of a command.", "`grep 'Failed password' /var/log/auth.log > evidence.txt`"],
    build: (rng) => {
      const shell = ana();
      shell.fs.put("/var/log/auth.log", authLog(rng, "203.0.113.7", 40));
      return { shell };
    },
    passed: (w) => {
      try {
        const log = w.shell.fs.lookup("/var/log/auth.log", "/", w.shell.creds).content;
        const want = log.split("\n").filter((l) => l.includes("Failed password")).join("\n");
        return w.shell.fs.lookup("/home/ana/evidence.txt", "/", w.shell.creds).content.trim() === want.trim();
      } catch {
        return false;
      }
    },
    solve: () => ["grep 'Failed password' /var/log/auth.log > /home/ana/evidence.txt"],
    debrief: "Careful: `>` overwrites, `>>` appends. Point `>` at the wrong file and its old contents are gone.",
  },
];

const perms: Mission[] = [
  {
    id: "perm-1",
    title: "Read the permissions",
    brief: "Run `ls -l` in your home folder. One file is unreadable to you, one is readable. The readable one holds the flag. Why can't you open the other? Then submit.",
    hints: ["`ls -l` shows who owns each file and what each class may do.", "Read `public.txt`, the one with `r` for others."],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana([{ name: "sam", uid: 1001 }]);
      shell.fs.dir("/home/ana", { mode: 0o755, owner: "ana" });
      shell.fs.put("/home/ana/public.txt", `${flag}\n`, { owner: "sam", mode: 0o644 });
      shell.fs.put("/home/ana/private.txt", "not for you\n", { owner: "sam", mode: 0o600 });
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["ls -l", "cat public.txt", `submit ${w.flag}`],
    debrief: "`-rw-------` means only the owner, sam, may read `private.txt`. The kernel refused you, and that refusal is the whole point of permissions.",
  },
  {
    id: "perm-2",
    title: "Make a script run",
    brief: "`/home/ana/scan.sh` is your script, but `./scan.sh` says Permission denied. Give yourself execute permission, run it, and submit the flag it prints.",
    hints: ["`chmod u+x scan.sh` adds execute for the user who owns the file."],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      shell.fs.put("/home/ana/scan.sh", `#!/bin/bash\necho scan complete ${flag}\n`, { owner: "ana", mode: 0o644 });
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["chmod u+x scan.sh", "./scan.sh", `submit ${w.flag}`],
    debrief: "Execute is a separate permission from read. A file can be read and still refuse to run.",
  },
  {
    id: "perm-3",
    title: "Lock down a secret",
    brief: "`/home/ana/api_key.txt` is world-readable: anyone on this server can read it. Fix it so only you can read and write it. That's mode 600.",
    hints: ["`chmod 600 api_key.txt`", "Check with `ls -l`. You want `-rw-------`."],
    build: () => {
      const shell = ana();
      shell.fs.put("/home/ana/api_key.txt", "sk-live-example\n", { owner: "ana", mode: 0o644 });
      return { shell };
    },
    passed: (w) => (w.shell.fs.lookup("/home/ana/api_key.txt", "/", w.shell.creds).mode & 0o777) === 0o600,
    solve: () => ["chmod 600 api_key.txt"],
    debrief: "SSH refuses to use a private key that others can read, for exactly this reason. 600 is the default for secrets.",
  },
  {
    id: "perm-4",
    title: "Share with one team only",
    brief: "`/srv/report.txt` belongs to you and group `sec`. Sam is in `sec`, Tom isn't. Set the mode so you can read and write, the group can only read, and others get nothing.",
    hints: ["Owner rw = 6, group r = 4, others none = 0."],
    build: () => {
      const shell = ana([{ name: "sam", uid: 1001, groups: ["sec"] }, { name: "tom", uid: 1002 }], ["sec"]);
      const sec = shell.fs.groupId("sec") as number;
      shell.fs.user("ana")?.groups.push(sec);
      shell.creds.gids.push(sec);
      shell.fs.put("/srv/report.txt", "Q3 findings\n", { owner: "ana", group: "sec", mode: 0o666 });
      return { shell };
    },
    passed: (w) => (w.shell.fs.lookup("/srv/report.txt", "/", w.shell.creds).mode & 0o777) === 0o640,
    solve: () => ["chmod 640 /srv/report.txt"],
    debrief: "That's least privilege in one number: everyone gets exactly what they need, and nothing more.",
  },
];

const suid: Mission[] = [
  {
    id: "suid-1",
    title: "Hunt the SUID files",
    brief: "Exit-gate skill: with one `find` command, list every SUID file on this machine (mode bit 4000). Count them and submit the count. Hide the errors.",
    hints: ["`-perm -4000` matches files with that bit set.", "`find / -perm -4000 -type f 2>/dev/null | wc -l`"],
    build: () => {
      const shell = ana();
      shell.fs.put("/usr/local/bin/backup", "\x7fELF\0", { mode: 0o4755, program: "none" });
      const count = (dir: { children: Map<string, typeof dir>; kind: string; mode: number }): number =>
        [...dir.children.values()].reduce((sum, n) => sum + (n.kind === "file" && n.mode & 0o4000 ? 1 : 0) + (n.kind === "dir" ? count(n) : 0), 0);
      return { shell, flag: String(count(shell.fs.root)) };
    },
    passed: submitted,
    solve: (w) => ["find / -perm -4000 -type f 2>/dev/null | wc -l", `submit ${w.flag}`],
    debrief: "Most SUID files are normal: `passwd` needs root to edit a protected file. An unusual one, like `/usr/local/bin/backup`, is what an attacker looks for first.",
  },
  {
    id: "suid-2",
    title: "Why SUID is dangerous",
    brief: "`/opt/readlog` is SUID root: it runs with root's power no matter who starts it, and prints any file you name. `/root/flag.txt` is locked to root. Use `readlog` to read it and submit the flag. This is your own lab.",
    hints: ["Try `cat /root/flag.txt` first and see it fail.", "Then `/opt/readlog /root/flag.txt`."],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      shell.fs.put("/root/flag.txt", `${flag}\n`, { mode: 0o600 });
      shell.fs.put("/opt/readlog", "\x7fELF\0", { mode: 0o4755, program: "readlog" });
      shell.programs.readlog = (ctx) => {
        const f = ctx.args[0];
        if (!f) return { stdout: "", stderr: "usage: readlog FILE\n", code: 1 };
        try {
          const node = ctx.shell.fs.lookup(f, ctx.shell.cwd, ctx.creds);
          if (!ctx.shell.fs.can(node, ctx.creds, 4)) return { stdout: "", stderr: `readlog: ${f}: Permission denied\n`, code: 1 };
          return { stdout: node.content, stderr: "", code: 0 };
        } catch {
          return { stdout: "", stderr: `readlog: ${f}: No such file or directory\n`, code: 1 };
        }
      };
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => [`/opt/readlog /root/flag.txt`, `submit ${w.flag}`],
    debrief: "You didn't break the kernel. The program had a badly chosen permission, and it did exactly what it was told. That's privilege escalation: borrowing someone else's power through a mistake. The fix is `chmod u-s` or a safer design.",
  },
  {
    id: "suid-3",
    title: "Fix what you found",
    brief: "You're root now, for this one mission. Remove the SUID bit from `/opt/readlog` so nobody can abuse it, while everyone can still run it.",
    hints: ["`chmod u-s /opt/readlog` clears just that bit."],
    build: () => {
      const shell = machine("root", [{ name: "ana", uid: 1000 }]);
      shell.fs.put("/opt/readlog", "\x7fELF\0", { mode: 0o4755, program: "none" });
      return { shell };
    },
    passed: (w) => (w.shell.fs.lookup("/opt/readlog", "/", w.shell.creds).mode & 0o7777) === 0o755,
    solve: () => ["chmod u-s /opt/readlog"],
    debrief: "Build, break, defend: you found it, abused it and fixed it. Notice the prompt ended in `#`, which means root.",
  },
];

const procs: Mission[] = [
  {
    id: "proc-1",
    title: "What's running?",
    brief: "Something called `cryptominer` is eating this server. List all processes, find its PID and submit that number.",
    hints: ["`ps aux` lists every process.", "`ps aux | grep cryptominer`. The PID is the second column."],
    build: (rng) => {
      const shell = ana();
      const pid = rng.int(5000, 9000);
      shell.procs.push({ pid, ppid: 1, user: "ana", tty: "?", cmd: "/tmp/.x/cryptominer --pool evil.example" });
      return { shell, flag: String(pid) };
    },
    passed: submitted,
    solve: (w) => ["ps aux | grep cryptominer", `submit ${w.flag}`],
    debrief: "Note where it runs from: `/tmp/.x`, a hidden folder in a place anyone can write. That's a strong smell.",
  },
  {
    id: "proc-2",
    title: "Ask it to stop",
    brief: "Stop the process `scanner`. Use `kill PID`, which politely sends SIGTERM.",
    hints: ["Find the PID with `ps aux | grep scanner`, then `kill` it."],
    build: (rng) => {
      const shell = ana();
      shell.procs.push({ pid: rng.int(5000, 9000), ppid: 1, user: "ana", tty: "?", cmd: "/usr/local/bin/scanner" });
      return { shell };
    },
    passed: (w) => !w.shell.procs.some((p) => p.cmd.includes("scanner")),
    solve: (w) => [`kill ${w.shell.procs.find((p) => p.cmd.includes("scanner"))?.pid}`],
    debrief: "SIGTERM lets a program clean up before it exits. Always try it first.",
  },
  {
    id: "proc-3",
    title: "Force it",
    brief: "`stubborn` ignores polite signals. Try `kill` and watch it survive with `ps aux`, then stop it with the signal that can't be ignored.",
    hints: ["`kill -9 PID` sends SIGKILL. The kernel ends the process without asking it."],
    build: (rng) => {
      const shell = ana();
      shell.procs.push({ pid: rng.int(5000, 9000), ppid: 1, user: "ana", tty: "?", cmd: "/tmp/stubborn", ignoresTerm: true });
      return { shell };
    },
    passed: (w) => !w.shell.procs.some((p) => p.cmd.includes("stubborn")),
    solve: (w) => [`kill -9 ${w.shell.procs.find((p) => p.cmd.includes("stubborn"))?.pid}`],
    debrief: "A program can catch SIGTERM but never SIGKILL. In incident response, killing a process also destroys what it held in memory, so think before you strike.",
  },
  {
    id: "proc-4",
    title: "Not yours to kill",
    brief: "Try to `kill` the `sshd` process, which belongs to root. Read the error. Then submit the word the kernel answered with: `submit Operation`.",
    hints: ["`ps aux | grep sshd` shows the PID.", "The error ends with `Operation not permitted`."],
    build: () => ({ shell: ana(), flag: "Operation" }),
    passed: (w) => submitted(w) && w.shell.history.some((h) => h.startsWith("kill")),
    solve: () => ["kill 612", "submit Operation"],
    debrief: "Users can only signal their own processes. Same principle as files: the kernel checks who you are on every request.",
  },
];

export const MISSIONS_ZERO: Record<string, RangeSet> = {
  "first-steps": { title: "Your first three commands", missions: firstSteps },
  navigate: { title: "Move around a Linux machine", missions: navigate },
  "find-things": { title: "Find anything on a machine", missions: findThings },
  pipes: { title: "Pipelines: from a log to an answer", missions: pipes },
  perms: { title: "Permissions in practice", missions: perms },
  suid: { title: "SUID: hunt it, abuse it, fix it", missions: suid },
  procs: { title: "Processes and signals", missions: procs },
};

export type { Built };
