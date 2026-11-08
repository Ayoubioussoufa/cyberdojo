---
title: Linux persistence and audit
summary: Where attackers stay on a Linux host, and how auditd and eBPF let you see it. From authorized_keys to kernel modules, with the detection for each.
level: advanced
side: both
minutes: 55
attack: T1543.002, T1053.003, T1098.004, T1546.004, T1547.006, T1505.003
needs: 02-02-linux-boot-and-linking, 02-04-linux-privilege-escalation, 0025-hardening-linux
pair: 02-02-linux-boot-and-linking, 02-04-linux-privilege-escalation, 01-09-ssh-internals-and-forwarding, 08-07-linux-forensics
source: auditd(8) and the Linux Audit documentation | https://man7.org/linux/man-pages/man8/auditd.8.html
words: persistence, auditd, eBPF
---
A compromised server gets rebooted, patched and logged out of. Persistence is whatever survives that. The trouble for attackers is that Linux has a small number of ways to start code automatically. List them, watch them, and persistence turns from a mystery into a checklist.

@term eBPF = A way to run small verified programs inside the Linux kernel, used for tracing, networking and security monitoring.
@term web shell = A script placed on a web server that gives an attacker remote command execution through HTTP.
@term loadable kernel module = Code added to a running kernel, with full kernel privileges.

## Concept

### Fundamentals: the persistence map

Ask one question: **what runs without anyone asking?**

| Mechanism | Runs when | Where to look |
|---|---|---|
| SSH keys | On login | `~/.ssh/authorized_keys`, for every user |
| Cron | On schedule | `/etc/crontab`, `/etc/cron.*`, `/var/spool/cron` |
| systemd units and timers | At boot, on schedule | `/etc/systemd/system/`, `~/.config/systemd/user/` |
| Shell profiles | On login | `.bashrc`, `.profile`, `/etc/profile.d/` |
| Preload | Every program | `/etc/ld.so.preload` |
| PAM | Every authentication | `/etc/pam.d/`, `/lib/security/` |
| udev rules | When a device appears | `/etc/udev/rules.d/` |
| Web shells | On an HTTP request | Web roots, upload folders |
| Kernel modules | At boot | `/etc/modules-load.d/`, `lsmod` |

Rootless variants matter too: `systemctl --user` and `crontab -e` need no privileges, and they run as that user. On a host running a service, a web shell may be all an attacker needs.

### Levels of stealth

User-mode persistence is easy to find with the right tools. Going deeper makes hiding easier:

1. A plain new file, found by file integrity monitoring.
2. A modified legitimate file, found by package verification.
3. A preloaded library that hides files from libc tools. See Rootkits.
4. A kernel module, which can lie to everything above it.

A **loadable kernel module** runs with full privileges, so it can filter system calls to hide processes. That's why locking down module loading is such a strong control.

### Auditing: how auditd sees

The **audit** subsystem lives in the kernel. It checks rules on system calls and file access, then sends events to `auditd`, which writes `/var/log/audit/audit.log`.

```
-w /etc/sudoers -p wa -k sudoers
-w /etc/systemd/system/ -p wa -k systemd
-a always,exit -F arch=b64 -S execve -k exec
-a always,exit -F arch=b64 -S init_module,finit_module -k modules
```

`-w` watches a path, and `-p wa` means writes and attribute changes. `-S` picks system calls. `-k` adds a key, which you can search with `ausearch -k sudoers`. One event spans several lines joined by a serial number, and the `auid` field records the original login user, so it survives `sudo`. That makes it invaluable.

### Advanced: eBPF changes the game

**eBPF** lets you load small programs into the kernel at hook points, such as system calls and network events. A verifier checks each program for safety before it runs, so the kernel can't be crashed by a bad probe, in principle. Modern tools like Falco, Tetragon and many EDR agents are built on it. Compared with auditd, eBPF gives richer context and more flexible filtering, with less overhead on a busy system.

The same power serves attackers. With enough privilege, an eBPF program can read kernel memory, filter what tools see, or listen for a magic packet. The BPFDoor family used a packet filter this way: it opened no port, so a port scan shows nothing. So defenders also list loaded programs with `bpftool prog show`. Restricting `CAP_BPF` and setting `kernel.unprivileged_bpf_disabled=1` reduces this risk.

?? Why is `auid` so useful in an audit record?
+ It keeps the original login user after `sudo`
- It records the hash of the executed binary
- It proves the event came from the kernel
- It stores the attacker's full remote IP address
=> `uid` changes when someone becomes root, but `auid` stays with the person who logged in, which is what an investigator needs.

## Threat model

| Technique | ATT&CK |
|---|---|
| Systemd service | [T1543.002](https://attack.mitre.org/techniques/T1543/002/) |
| Cron | [T1053.003](https://attack.mitre.org/techniques/T1053/003/) |
| SSH authorized keys | [T1098.004](https://attack.mitre.org/techniques/T1098/004/) |
| Shell profile changes | [T1546.004](https://attack.mitre.org/techniques/T1546/004/) |
| Kernel modules | [T1547.006](https://attack.mitre.org/techniques/T1547/006/) |
| Web shell | [T1505.003](https://attack.mitre.org/techniques/T1505/003/) |

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `auditctl`, `ausearch`, `aureport` | Manage and search the audit trail | Standard Linux auditing |
| AIDE, Tripwire | File integrity monitoring | Catching changes to key paths |
| `debsums`, `rpm -Va` | Compare with packages | Finding altered binaries |
| `systemctl list-unit-files`, `list-timers` | List what's enabled | Hunting units |
| Falco, Tetragon | eBPF runtime detection | Containers and modern hosts |
| `bpftool`, `lsmod` | List BPF programs and modules | Checking kernel-side persistence |
| osquery | Query the OS using SQL | Fleet-wide hunting |

## Defence

- **Collect centrally and quickly.** An attacker with root can edit local logs, so ship them off the host in near real time. Immutable audit rules (`-e 2`) can't be changed without a reboot.
- **Monitor the map above.** Each row becomes a file watch or a scheduled check.
- **Lock the kernel.** Require signed modules, and set `kernel.modules_disabled=1` after boot on servers that don't need more. Kernel lockdown mode adds further limits.
- **Make the filesystem hostile.** Run services with `ProtectSystem=strict`, mount web roots read-only, and deploy from a pipeline.
- **Rebuild, don't clean.** On cattle-style infrastructure, replacing a host removes everything. Treat persistence as a sign to rebuild.

**Detect web shells** from behaviour: a web server process spawning a shell, and new script files in a web root, especially files that are requested by very few clients.

## Pitfalls

- **Logging every `execve` with no filtering.** It'll flood your disk, and it can slow a busy host. Filter and test first.
- **"Our logs would show it."** Not if they stayed on the box the attacker controls.
- **Checking root only.** Persistence can sit in any user's account, so loop through all home directories.
- **Trusting tools on a compromised host.** A rootkit can lie to `ls` and `ps`. Compare with an offline view of the disk.
- **Forgetting timers.** People check cron and miss systemd timers.

?? `ls` shows no strange files, but a disk image mounted on a clean host does. What does this suggest?
+ A rootkit was hiding files on the live system
- The disk image contains files from a different computer
- The live system runs a newer version of `ls`
- The filesystem was still recovering from an earlier crash
=> A clean machine doesn't run the attacker's code, so comparing the two views is a classic way to detect a rootkit.

## Exercise

::: law Lab only
Plant these in your own snapshot VM. Don't leave deliberately weakened machines reachable from any network.
:::

Use two roles: first attacker, then investigator.

1. As root, add these to a VM: an extra key in a user's `authorized_keys`, a systemd timer that writes a timestamp to `/tmp`, a line in `.bashrc`, and a file in `/etc/profile.d/`.
2. Reboot, and confirm that they all fire.
3. Without looking at your notes, find each with a script that checks every row of the table. Save it as `persistence-check.sh`.
4. Add auditd rules for those paths. Repeat one change, and find the event with `ausearch -k`. Note the `auid`.
5. Run `lsmod` and `bpftool prog show`. Pick one entry, and find out what it is.

?! Compare auditd and an eBPF-based sensor for a fleet of web servers. Which would you deploy, and how would you protect its logs from someone who has root?

## Further reading

- [auditd(8)](https://man7.org/linux/man-pages/man8/auditd.8.html) and [audit.rules(7)](https://man7.org/linux/man-pages/man7/audit.rules.7.html).
- [Linux kernel eBPF documentation](https://docs.kernel.org/bpf/).
- [Tetragon documentation](https://tetragon.io/docs/), and [Falco](https://falco.org/docs/).
- [ATT&CK's Persistence tactic](https://attack.mitre.org/tactics/TA0003/), filtered for Linux.
- [AIDE](https://aide.github.io/), a file integrity monitor.
