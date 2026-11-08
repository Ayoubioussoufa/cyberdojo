---
title: Linux forensics
summary: Most servers run Linux, yet most forensics training is about Windows. Where Linux keeps its evidence, how to collect it, and how to build a timeline from logs, shells and files.
level: intermediate
side: defence
minutes: 45
attack: T1070.002, T1070.003
needs: 0025-hardening-linux, 02-01-linux-processes-and-proc, 0065-forensic-principles
pair: 02-01-linux-processes-and-proc, 02-05-linux-persistence-and-audit
source: The Unix-like Artifacts Collector | https://github.com/tclahr/uac
words: wtmp, journald, live response
---
A compromised Linux server has no Prefetch, no Amcache and no registry. It does have a different kind of trail, spread across plain text, binary logs and filesystem metadata. Because attackers with root can edit much of it, the art is to combine sources they forget about.

@term wtmp = The binary Linux log of logins and logouts, read with `last`.
@term btmp = The binary Linux log of failed logins, read with `lastb`.
@term live response = Collecting evidence from a running system, before it's shut down or changed.

## Concept

### Fundamentals: the evidence map

| Question | Where to look |
|---|---|
| Who logged in? | `/var/log/auth.log` or `secure`, `wtmp` (`last`), `lastlog` |
| Who failed to log in? | `btmp` (`lastb`), auth logs |
| What did they run? | `.bash_history`, `auditd`, `sudo` logs |
| What ran on a schedule? | cron logs, `systemctl list-timers`, journal |
| What changed? | Package logs, `dpkg.log`, file metadata |
| What's persistent? | See [Linux persistence](/modules/02-05-linux-persistence-and-audit/) |
| What was the network doing? | `ss` (live), firewall logs, Zeek |
| What did the service log? | `/var/log/nginx/`, application logs |

`journald` keeps binary logs, read with `journalctl`. `journalctl --since`, `-u sshd` and `_UID=` make good filters, and `--verify` checks that journal files are intact.

### Live response comes first

Follow the order of volatility, and use trusted tools from outside, because the host's own `ls` may be compromised.

1. Capture memory with AVML or LiME, if the risk justifies it.
2. Collect running state: `ps`, `ss -tnp`, `lsof`, `/proc`.
3. Collect logs and key files.
4. Image the disk, ideally by snapshot in a VM or the cloud.

[UAC](https://github.com/tclahr/uac) automates that collection for Linux and other Unix systems, so that a responder gets a repeatable bundle.

### Files and time

`stat` shows access, modify and change times. On ext4, a fourth exists, creation (`crtime`), and modern `stat` prints this as *Birth*. Older tools need `debugfs -R 'stat <inode>' /dev/sdX`.

| Time | Changes when |
|---|---|
| mtime | Content changes |
| atime | Content's read, depending on mount options |
| ctime | Metadata changes, can't be set by `touch` |
| crtime | At creation |

An attacker using `touch -d` can set mtime and atime, but this updates ctime to now. So a file with an old mtime and a recent ctime is suspect. Linux servers often mount with `relatime`, so access times are only partly useful.

### Reading shell history

`.bash_history` is useful but fragile. By default, it's written when a shell exits, so a live session's commands aren't there yet. An attacker can unset `HISTFILE`, or link it to `/dev/null`, and that absence is itself a finding: a user who logged on with an empty history file. Timestamps exist only if `HISTTIMEFORMAT` was set. For anything reliable, use `auditd` or eBPF logging, which a user can't turn off from their own shell.

### Advanced: finding what was hidden

**Deleted but running.** `ls -l /proc/*/exe | grep deleted` finds running binaries that were removed, and you can [recover them](/modules/02-01-linux-processes-and-proc/).

**Package verification.** `debsums -c` or `rpm -Va` shows binaries that differ from the package.

**Log gaps.** Editing `wtmp` or text logs leaves oddities. A jump in `journald`'s sequence numbers, a truncated file, or a host whose logs stop at the attack, but which kept running, all stand out. Compare with your central log store, which is why remote logging matters so much.

**Containers.** An overlay filesystem holds a container's changes in `/var/lib/docker/overlay2/`, and those vanish when it's removed. Attackers love ephemeral workloads, so capture quickly, or depend on runtime logs. See [Cloud forensics](/modules/08-08-network-and-cloud-forensics/).

?? What does `lastb` read?
+ The failed login attempts kept in `/var/log/btmp`
- The commands that each user typed today
- The services that started at last boot
- The packages that were installed this month
=> `last` reads successful logins from `wtmp`, and `lastb` reads failures from `btmp`.

## Threat model

Attackers with root try to remove their tracks, by clearing logs ([T1070.002](https://attack.mitre.org/techniques/T1070/002/)) and history ([T1070.003](https://attack.mitre.org/techniques/T1070/003/)). A rootkit can even lie to your tools. So evidence on the host has limits. Trust sources in this order: central logs, offline disk view, tools you brought, then the live host's own tools.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| UAC | Collects artifacts | First response |
| `journalctl`, `ausearch` | Query logs | Building a timeline |
| `last`, `lastb`, `lastlog` | Read login records | Sessions |
| `debsums`, `rpm -Va` | Verify packages | Spotting tampering |
| Plaso, Sleuth Kit | Timelines and images | Offline analysis |
| Velociraptor | Collection at scale | Many hosts |
| A static `busybox` | Trusted shell tools | Avoiding compromised binaries |

## Defence

- **Ship logs off the host** in near real time.
- **Run auditd or an eBPF sensor,** so that command history isn't your only source.
- **Set `HISTTIMEFORMAT`** and `PROMPT_COMMAND` logging, knowing that they're only a convenience.
- **Enable `journald` persistence** with forward secure sealing if you need tamper evidence.
- **Standardise builds.** Golden images make deviation obvious.
- **Practise collection** in your VMs, and in the cloud.

## Pitfalls

- **Logging in over SSH as a user to look around.** You add to `wtmp`, and your session changes state. Note what you do, and when.
- **Trusting `ls` and `ps` on a suspect host.** Bring your own static tools, or mount the disk elsewhere.
- **Reading only `.bash_history`.** It's optional and easily cleared.
- **Forgetting log rotation.** Older evidence sits in `.1` and `.gz` files.
- **Ignoring time zones.** `auth.log` may use local time, and `journald` displays by your setting.

?? An attacker cleared `.bash_history`. Where might the evidence remain?
+ In audit logs shipped to another host
- In the kernel's list of loaded modules
- In the system's chosen keyboard layout file
- In the default umask for new users
=> Logs already sent off the machine are out of an attacker's reach, even with root.

## Exercise

::: law Lab only
Run this on your own VM, or a training image. Collecting data from a machine that you don't own or manage needs written authority.
:::

1. On a lab VM, simulate an intruder: SSH in, add a user, drop a script in `/tmp`, add a cron job, then clear the history.
2. Without using your notes, reconstruct what happened using logs, `wtmp`, `auth.log`, `journalctl`, and `stat`.
3. Run UAC on the VM, and read what it collected.
4. Use `touch -d` to backdate the script. Show that `stat` still reveals the recent `ctime`.
5. Compare what `auditd` recorded with what `.bash_history` shows.
6. Write a one-page timeline with sources for each line.

?! A cloud VM was compromised, and it's about to be auto-replaced by scaling in 20 minutes. What would you collect, how, and in what order?

## Further reading

- Bruce Nikkel, *Practical Linux Forensics*.
- [UAC documentation](https://tclahr.github.io/uac-docs/).
- [journalctl(1)](https://man7.org/linux/man-pages/man1/journalctl.1.html).
- [The Sleuth Kit](https://sleuthkit.org/).
- [AVML](https://github.com/microsoft/avml), a Linux memory acquisition tool.
