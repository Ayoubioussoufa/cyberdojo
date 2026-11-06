/**
 * Owners, groups and modes. The exercise ideas follow pwn.college's Linux
 * Luminarium (BSD-2-Clause, see THIRD_PARTY_NOTICES.md); text and code are ours.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { ana, modeOf } from "./kit";

export const PERMISSIONS: Mission[] = [
  {
    id: "dojo-perm-1",
    title: "Take ownership",
    brief: "`/flag` belongs to root and only root can read it. You may run exactly one privileged command: `sudo chown`. Make yourself the owner, then read it.",
    hints: ["Check what you may run with `sudo -l`.", "`sudo chown ana /flag`, then `cat /flag`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      shell.fs.put("/flag", `${flag}\n`, { mode: 0o600 });
      shell.sudoRules.ana = ["/usr/bin/chown"];
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["sudo chown ana /flag", "cat /flag", `submit ${w.flag}`],
    debrief: "`sudo chown` alone is equal to full root: whoever can take ownership of `/etc/shadow` owns the machine. When you audit `sudo -l`, read each entry as what it could lead to, not what it was meant for.",
  },
  {
    id: "dojo-perm-2",
    title: "Share through a group",
    brief: "`/flag` is mode `640`: the owner reads and writes, the group reads, everyone else gets nothing. It's in group `root`. Move it to group `ana` with the one command you may run, then read it.",
    hints: ["`ls -l /flag` shows owner and group.", "`sudo chgrp ana /flag`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      shell.fs.put("/flag", `${flag}\n`, { mode: 0o640 });
      shell.sudoRules.ana = ["/usr/bin/chgrp"];
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["sudo chgrp ana /flag", "cat /flag", `submit ${w.flag}`],
    debrief: "Every Linux user gets a private group of the same name. Groups are how a team shares a file without opening it to everyone.",
  },
  {
    id: "dojo-perm-3",
    title: "Which group am I in?",
    brief: "Same file, but this time your group has a generated name. Find out what groups you belong to, then give `/flag` to the right one.",
    hints: ["`id` lists your user and all your groups.", "`sudo chgrp <the group id printed> /flag`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const group = `crew${rng.int(1000, 9999)}`;
      const shell = ana([], [group], [group]);
      shell.fs.put("/flag", `${flag}\n`, { mode: 0o640 });
      shell.sudoRules.ana = ["/usr/bin/chgrp"];
      return { shell, flag, state: { group } };
    },
    passed: submitted,
    solve: (w) => ["id", `sudo chgrp ${w.state?.group as string} /flag`, "cat /flag", `submit ${w.flag}`],
    debrief: "`id` is the first command to run on any box you audit. It tells you what the kernel will actually decide on.",
  },
  {
    id: "dojo-perm-4",
    title: "Open it just enough",
    brief: "`/flag` has mode `000`, and you may run `sudo chmod`. Give everyone else read permission and nothing more, then read it. Don't use `777`.",
    hints: ["`o+r` adds read for others.", "`sudo chmod o+r /flag`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      shell.fs.put("/flag", `${flag}\n`, { mode: 0o000 });
      shell.sudoRules.ana = ["/usr/bin/chmod"];
      return { shell, flag };
    },
    passed: (w) => submitted(w) && modeOf(w, "/flag") === 0o004,
    solve: (w) => ["sudo chmod o+r /flag", "cat /flag", `submit ${w.flag}`],
    notEnough: (w) => ["sudo chmod 777 /flag", `submit ${w.flag}`],
    debrief: "Grant the least that works. `chmod 777` makes the error go away by removing the protection, and in an audit it's the finding, not the fix.",
  },
  {
    id: "dojo-perm-5",
    title: "Make it runnable",
    brief: "`/opt/report.sh` is a script nobody can run. Add execute permission for its owner only, using `sudo chmod`, then run it with `sudo`-free hands: you own the file. Submit what it prints.",
    hints: ["`u+x` adds execute for the owner.", "`sudo chmod u+x /opt/report.sh`, then `/opt/report.sh`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      shell.fs.dir("/opt", { mode: 0o755 });
      shell.fs.put("/opt/report.sh", `#!/bin/bash\necho report ready ${flag}\n`, { mode: 0o644, owner: "ana" });
      shell.sudoRules.ana = ["/usr/bin/chmod"];
      return { shell, flag };
    },
    passed: (w) => submitted(w) && modeOf(w, "/opt/report.sh") === 0o744,
    solve: (w) => ["sudo chmod u+x /opt/report.sh", "/opt/report.sh", `submit ${w.flag}`],
    debrief: "Read and execute are separate rights. A script you can read still won't run until execute is set, because the kernel checks it on `exec`.",
  },
  {
    id: "dojo-perm-6",
    title: "Set it all at once",
    brief: "`payroll.csv` should be readable and writable by you, readable by your group, and closed to everyone else. Set it in one command with the `=` form, not with octal digits.",
    hints: ["`=` sets a class exactly. Commas separate classes.", "`chmod u=rw,g=r,o= payroll.csv`"],
    build: () => {
      const shell = ana();
      shell.fs.put("/home/ana/payroll.csv", "name,salary\n", { owner: "ana", mode: 0o666 });
      return { shell };
    },
    passed: (w) => modeOf(w, "/home/ana/payroll.csv") === 0o640,
    solve: () => ["chmod u=rw,g=r,o= payroll.csv"],
    notEnough: () => ["chmod o-w payroll.csv"],
    debrief: "`+` and `-` adjust what's there, so the result depends on the starting point. `=` states the result, which is what you want in a hardening script.",
  },
  {
    id: "dojo-perm-7",
    title: "Change the default",
    brief: "New files here come out readable by everybody. Set your umask so that new files are `640` and create `secret.txt`. Both in the same session.",
    hints: ["The umask lists permissions to remove from new files.", "`umask 027`, then `touch secret.txt`, then check with `ls -l`."],
    build: () => ({ shell: ana() }),
    passed: (w) => modeOf(w, "/home/ana/secret.txt") === 0o640,
    solve: () => ["umask 027", "touch secret.txt"],
    notEnough: () => ["touch secret.txt"],
    debrief: "Files start from `666`, directories from `777`, and the umask takes bits away: `666` minus `027` leaves `640`. It's a default that protects files nobody remembered to protect.",
  },
];
