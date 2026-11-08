---
title: Linux privilege escalation
summary: How a low-privileged account becomes root, explained as one recurring pattern, and how to audit, harden and detect each path before someone else finds it.
level: intermediate
side: both
minutes: 60
attack: T1548.001, T1548.003, T1053.003, T1068, T1574.007
needs: 0008-suid-sticky-umask, 0057-auditing-for-privilege-escalation, 02-01-linux-processes-and-proc, 02-02-linux-boot-and-linking
pair: 02-03-linux-confinement, 02-05-linux-persistence-and-audit
source: GTFOBins | https://gtfobins.github.io/
words: privilege escalation, GTFOBins, Dirty Pipe
---
Lesson 57 gave you the defender's checklist. This module goes behind it. There's one idea throughout: **privileged code that trusts something an unprivileged user can influence**. Each category here is one answer to the question "what does root trust, and who can change it?"

@term Dirty Pipe = CVE-2022-0847, a Linux kernel flaw that let an unprivileged user overwrite data in read-only files.
@term TOCTOU (time-of-check to time-of-use) = A bug where the state a program checked changes before it uses that state.

## Concept

### Fundamentals: what escalation is

Attackers often arrive as `www-data` or an ordinary user. To reach root, they enumerate first, then pick a path. Most real paths are **configuration**, not exploits. These are the main families.

| Root trusts | The mistake | Example |
|---|---|---|
| A SUID program | It does more than intended | A SUID `find` or text editor |
| The sudoers file | An allowed command can run others | `sudo vi`, then a shell escape |
| A scheduled job | A user can edit its script or path | A world-writable cron script |
| `PATH` | A relative command name | A SUID helper calling `service` |
| A service unit | Its file is writable | Changing `ExecStart` |
| Group membership | The group equals root | `docker`, `lxd`, `disk` |
| Stored secrets | A password in a file | History, config, backup scripts |
| The kernel | A known unpatched flaw | Dirty Pipe |

### Sudo and SUID programs

SUID makes a program run as its owner. If that's root, any way to make the program do something extra becomes root access. Many ordinary tools have such a way: editors can spawn shells, `find` can run commands, `tar` has checkpoint actions, and `less` can launch a shell. [GTFOBins](https://gtfobins.github.io/) catalogues them. The same goes for `sudo` rules, so `sudo -l` is one of the first commands any attacker runs.

The fix is the same for both: **grant the smallest thing that does the job**. An allowed command must be incapable of running other commands. For sudo, wildcards in arguments are a common trap, and `NOEXEC` helps only for dynamically linked programs.

### Path, cron and wildcards

If a privileged script runs `tar` instead of `/usr/bin/tar`, it uses the `PATH`. If a user controls the `PATH`, or a directory early in it, their program runs instead. In cron jobs, look at the `PATH=` line in `/etc/crontab`.

**Wildcards** expand before a program sees them. If a root cron job runs `tar czf /backup.tgz *` in a directory that a user can write to, a file *named like an option* becomes an option. The shell can't tell the difference. Writing `./*` or `--` before the glob fixes this.

### Groups that equal root

The `docker` group can start a container with the host's filesystem mounted, so it amounts to root without a password. The same is true for `lxd`, and `disk` gives raw access to the drive. Treat membership as a root grant.

### Advanced: kernel flaws

If configuration is clean, a kernel bug may still work. Two well-known examples:

- **Dirty COW** (CVE-2016-5195): a race in copy-on-write allowed writing to read-only mappings.
- **[Dirty Pipe](https://dirtypipe.cm4all.com/)** (CVE-2022-0847): an uninitialised flag in pipe buffers let a user overwrite the page cache of a read-only file, including a SUID binary.

Both are examples of a broader class. The kernel is one big privileged program that trusts data from every process, and a memory bug in a syscall handler gives full control. Kernel exploits can crash a machine, so real attackers try configuration paths first, and a good patch process closes this class. Also watch for **TOCTOU** races, where a privileged program checks a file, then opens it later, leaving a window to swap a symlink. Sticky bits and `fs.protected_symlinks` exist largely for that reason.

?? A root cron job runs `backup.sh`, which sits in a directory owned by a normal user. What's wrong?
+ That user can replace the script that root runs
- Cron will refuse any script that's outside of `/etc/cron.d`
- The job's output can't be written in that directory
- Root can't ever read files owned by other users
=> The script's own permissions may look fine, but owning the directory lets someone rename it and put another in its place. Check the whole path.

## Threat model

| Path | ATT&CK |
|---|---|
| SUID and SGID | [T1548.001](https://attack.mitre.org/techniques/T1548/001/) |
| Sudo and caching | [T1548.003](https://attack.mitre.org/techniques/T1548/003/) |
| Cron | [T1053.003](https://attack.mitre.org/techniques/T1053/003/) |
| Kernel exploits | [T1068](https://attack.mitre.org/techniques/T1068/) |
| Library path hijack | [T1574.007](https://attack.mitre.org/techniques/T1574/007/) |

After gaining root, attackers move to [persistence](/modules/02-05-linux-persistence-and-audit/), and to credential theft from `/etc/shadow`, SSH keys and configuration files.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `sudo -l` | Lists your sudo rights | The first check on any host |
| `find / -perm -4000 -type f` | Lists SUID files | Auditing against a baseline |
| `getcap -r /` | Lists file capabilities | Auditing |
| LinPEAS, LinEnum | Automated enumeration | Lab practice and authorised tests. Very noisy |
| Lynis | Hardening audit | Defensive review |
| `pspy` | Watches processes with no root | Spotting cron jobs in a CTF |
| GTFOBins | Reference on abuse of binaries | Judging whether a sudo rule is safe |

## Defence

- **Baseline SUID files** and alert on any change. Remove the SUID bit from what you don't need.
- **Review sudoers.** Avoid `ALL`, editors, interpreters and wildcards. Use `sudoedit` for file edits.
- **Use absolute paths** in scheduled jobs and privileged scripts, with safe ownership of each directory on the path.
- **Audit group membership** for `docker`, `lxd`, `disk`, `shadow` and `adm`. Consider rootless containers.
- **Patch kernels** with a real process, including reboots or livepatching. Dirty Pipe had a public exploit within days.
- **Mount `/tmp` and `/home` with `nosuid`**, so that a dropped SUID file does nothing.
- **Confine services**, as in [Linux confinement](/modules/02-03-linux-confinement/), so a compromised web server has little to enumerate.

**Detection.** Use `auditd` on `execve` of `sudo`, on `setuid` system calls, and on writes to `/etc/passwd`, `/etc/sudoers` and cron paths. Alert when a service account starts running `sudo`, `find -perm`, or LinPEAS-like enumeration in quick succession. A kernel oops can be a failed exploit attempt.

## Pitfalls

- **"Our kernel is patched, so we're safe."** Most real escalation is misconfiguration.
- **"The sudo rule only allows one command."** One command may run others. Check GTFOBins.
- **"The script's permissions are fine."** Check the directory too, and each parent.
- **Running LinPEAS in production as a "quick check".** It's loud, and it'll set off your own EDR, which is what you want from your EDR.
- **Thinking only of root.** Lateral movement to a more useful user can matter more than root on one box.

?? Why is membership of the `docker` group treated as equal to root?
+ It can mount the host's filesystem into a container
- It's the group that owns every SUID binary file
- Docker reads the root password from `/etc/shadow` at startup
- The kernel treats this group's members as UID 0
=> Starting a container with the host root mounted gives full read and write access, so there's no need to crack anything.

## Exercise

::: law Lab only
Do this on your own VM, or on legal platforms such as TryHackMe, Hack The Box and OverTheWire. Never test escalation on a shared or production machine.
:::

Set up a deliberately flawed VM, then fix it.

1. As root, add a sudo rule that lets `alice` run `/usr/bin/less`. As `alice`, read GTFOBins for `less`, and explain the risk. Now replace the rule with one that truly limits her.
2. Make a root cron job that runs a script in a directory which `alice` owns. Confirm with `ls -ld` that she could replace it, then fix the ownership.
3. Create a SUID copy of a tool in `/opt`. Find it with `find`, and write a one-line baseline check that would catch it tomorrow.
4. Write auditd rules for `/etc/sudoers` and for `execve` by `www-data`, and test them.
5. Run Lynis, and pick the three findings that matter most for privilege escalation.

?! Pick one escalation path from the table at the top. Write a detection for it, and a prevention. Then explain which one you'd build first, and why.

## Further reading

- [GTFOBins](https://gtfobins.github.io/), for how normal tools can be abused.
- [The Dirty Pipe write-up](https://dirtypipe.cm4all.com/), a careful account from the person who found it.
- [Linux capabilities and hardening in CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks).
- [OverTheWire Bandit](https://overthewire.org/wargames/bandit/) and [pwn.college](https://pwn.college/), for legal practice.
- [sudoers(5)](https://man7.org/linux/man-pages/man5/sudoers.5.html), on what rules really mean.
