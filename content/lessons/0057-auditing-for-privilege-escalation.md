---
title: Auditing for privilege escalation
summary: The defender's checklists for Linux, Windows and Active Directory: what lets a normal user become an admin, how to find it first, and how each path looks in logs.
month: 10
minutes: 70
builds: privilege audit checklists in your own words for Linux and Windows
source: CIS Benchmarks | https://www.cisecurity.org/cis-benchmarks
words: privilege escalation, least privilege, tiering
---
An attacker rarely lands as an admin. They land as someone small, and then look for a way up. That's **privilege escalation**, and almost all of it comes from misconfiguration rather than rare exploits. The same search that an attacker would run, you can run first.

@term LAPS = Windows Local Administrator Password Solution: a unique, rotated local admin password for each machine.
@term tiering = Keeping admin accounts for high-value systems away from ordinary machines.
@term DCSync = Abusing replication rights to request password data from a domain controller.
@term service misconfiguration = A Windows service whose settings let a normal user change what runs as a powerful account.
@term gMSA (group managed service account) = A Windows service account with a long, automatically rotated password.

## The pattern behind them all

Privileged software trusts something, and a low-privileged user can change that thing.

| Root or SYSTEM trusts | The mistake | The result |
|---|---|---|
| A script run on schedule | Anyone can write to it | Their code runs as root |
| A program with SUID set | It can be made to do more than intended | A normal user acts as root |
| A service binary's path | Anyone can replace the file | Their code runs as SYSTEM |
| A config file | Its permissions are too loose | Settings change |

Once you see this shape, you stop memorising tricks. You ask: **what do powerful accounts trust, and who can change it?**

?? Root runs `/opt/job.sh` every night, and that file is mode 777. Why is this serious?
+ Any user can make root run their commands
- The file will use too much disk space
- Nightly jobs always fail with those permissions set
- It stops the root account from logging in
=> A file trusted by root is only as safe as its write permissions. You proved this on Lantern.

## Linux checklist

Run these as a normal user, on your own systems, and fix what you find.

| Check | Command | Fix |
|---|---|---|
| Sudo rights | `sudo -l` | Name exact commands, and avoid wildcards |
| SUID programs | `find / -perm -4000 -type f 2>/dev/null` | Remove SUID from what doesn't need it |
| World-writable files | `find /etc -type f -perm -002` | Correct the mode |
| Scheduled jobs | `cat /etc/crontab`, `ls -l` on each script | Owned by root, not writable by others |
| Second root accounts | `awk -F: '$3 == 0 {print $1}' /etc/passwd` | Remove them |
| Secrets in files | `grep -rl password /etc /opt` | Move to a secrets manager |
| Missing patches | `apt list --upgradable` | Patch the kernel and setuid programs |

A table of commands only helps once you can read what they print. Take three of them.

**`sudo -l`** lists what the current user may run as someone else:

```
User sam may run the following commands on web1:
    (root) /usr/bin/systemctl restart nginx
    (root) NOPASSWD: /usr/bin/vim /etc/hosts
    (ALL : ALL) ALL
```

The brackets say who the command runs as, and what follows is the command allowed. The first line is a good rule: one exact command. The second looks narrow and isn't, as the question below explains. The third means "anything, as anyone", and it belongs to administrators only.

**The SUID search** prints paths. On a fresh Ubuntu there are a dozen or so, all in system folders: `passwd`, `sudo`, `su`, `mount` and their relatives. Learn that list on a clean machine, because the finding is whatever isn't on it. Look closer with `ls -l`:

```
-rwsr-xr-x 1 root root 59976 Feb  6  2024 /usr/bin/passwd
```

The `s` where the owner's `x` would be is the SUID bit: whoever runs this file, it runs as its owner, root. For `passwd` that's intended, since it has to edit a file only root can write. The same letters on a file in `/home`, `/tmp` or `/opt` need an explanation today.

**The UID check** reads `/etc/passwd`, where the third field is the user's number. Only `root` should have 0, because the kernel treats any account with UID 0 as root, whatever it's called. It's the simplest of these checks to write yourself.

@code uid-zero-accounts

Sudo rules are text with a regular shape, so the dangerous patterns can be searched for.

@code risky-sudo-rule

And the permission string from `ls -l` tells you, in one fixed position, whether everybody can write to a file.

@code world-writable

A sudo rule for a harmless-looking program can be as good as full root, because many programs can start a shell or write files. [GTFOBins](https://gtfobins.org/) documents these, and defenders use it to review their rules.

@range audit

?? A sudo rule lets a helpdesk user run a text editor as root. Why's that dangerous?
+ Editors can open any file, and run commands
- Text editors use too much memory as root
- Sudo can only run programs written in Python
- Helpdesk staff aren't allowed to use text editors
=> Sudo gives the program root's power, and many programs do far more than they seem to. Review rules with that in mind.

## Windows checklist

The same idea, with different names.

| Check | What to look for | Fix |
|---|---|---|
| Service permissions | Can normal users change a service or its binary? | Correct the ACLs |
| Unquoted service paths | A path with spaces and no quotes | Quote the path |
| Local admin everywhere | One shared local password | LAPS gives each machine its own |
| Admins logging on to workstations | Their credentials sit in memory there | Tiering |
| Credentials in memory | LSASS can be read | Credential Guard, and LSA protection |
| Stored secrets | Passwords in scripts or shares | Remove and rotate |

The first two rows can be checked from PowerShell on your own lab machines:

```powershell
Get-CimInstance Win32_Service |
  Where-Object { $_.PathName -notlike '"*' -and $_.PathName -like '* *' } |
  Select-Object Name, StartName, PathName

icacls "C:\Program Files\Acme Tools\agent.exe"
Get-LocalGroupMember Administrators
```

The first command lists services whose path contains a space and doesn't begin with a quote. Many of those are harmless paths followed by arguments, so read each one: the risky case is a space inside the folder names themselves, such as `C:\Program Files\Acme Tools\agent.exe`. Without quotes, Windows tries `C:\Program.exe` first, then `C:\Program Files\Acme.exe`, and runs the first that exists. The fix is a pair of quotes around the path.

`icacls` answers the other question, who can change the file. `(F)` is full control, `(M)` modify and `(RX)` read and execute. `BUILTIN\Users:(M)` on a program that runs as `SYSTEM` is the Windows twin of the mode 777 script.

@code unquoted-service-path

**Tiering** matters the most. If a Domain Admin never logs on to a normal laptop, stealing that laptop's memory won't give an attacker Domain Admin.

?? Why does LAPS slow down an attacker who compromises one laptop?
+ Each machine's local admin password is now different
- It removes the local administrator account completely here
- It encrypts all the files on the laptop
- It blocks every kind of outbound network connection
=> Without it, one local password can open every machine. With it, a stolen password only opens one.

## Active Directory: what it looks like in logs

You studied these in Month 7. Here's the defender's summary, which is what the Month 10 gate needs you to detect in your own lab.

| Technique | In plain words | Telltale sign | Prevention |
|---|---|---|---|
| Kerberoasting | Requesting service tickets to crack offline | 4769 with `0x17` | gMSA, long passwords, AES |
| AS-REP roasting | Abusing accounts with pre-authentication off | 4768 with pre-auth type 0 | Require pre-authentication |
| ACL abuse | Using a delegated right to take over an object | 5136, or 4738 | Audit with BloodHound |
| LSASS access | Reading credentials from memory | Sysmon 10 targeting `lsass.exe` | Credential Guard |
| DCSync | Requesting password data like a domain controller | 4662 with replication rights, from a non-DC | Limit replication rights |

The [Keystone machine](/machines/keystone/) lets you follow one of these chains through the events.

?? Event 4662 shows replication rights used by a normal workstation's account. Why's that alarming?
+ Only domain controllers should normally be replicating data
- Workstations should be replicating data all day long
- It proves that a printer driver was installed
- It only means someone changed their desktop wallpaper
=> Replication from a non-DC can mean DCSync, which hands an attacker password material for the domain.

## Make it a habit

An audit run once goes stale. Script these checks, as you did in Month 3, run them on a schedule, and compare with the last result. Any new SUID file, sudo rule or local admin is either a change someone can explain, or an incident.

On Linux, the whole habit is three lines. Save today's list under today's date, and compare it with the last one:

```
sudo find / -perm -4000 -type f 2>/dev/null | sort > suid-$(date +%F).txt
comm -13 suid-2026-11-08.txt suid-2026-11-15.txt       lines only in the new file
comm -23 suid-2026-11-08.txt suid-2026-11-15.txt       lines only in the old file
```

`comm` compares two sorted files. An empty result is the answer you want. Any line it prints is a SUID program that appeared or vanished in a week, and somebody should be able to say why. The same three lines work for sudo rules, for members of the `sudo` group and for listening ports.

@code audit-diff

?? What makes a privilege audit worth more over time?
+ Automatically comparing the results with the last run
- Printing the output and filing it away somewhere
- Running it once a decade on one server
- Keeping the results secret from the admin team
=> The change between two runs is the signal. A new SUID file nobody can explain deserves attention.

## Read an audit

Three results from this week's run on a server you look after. Decide what each means before you read the choices.

```
-rwsr-xr-x 1 root root 16384 Nov 12 03:14 /home/sam/.cache/helper
```

?? What does that line of the SUID search tell you?
+ A root-owned SUID program in a user's home
- A normal system tool in its usual place
- A plain text file that anyone may read
- A folder that belongs to the root user
=> Nothing in a home directory should run as root. The hidden folder and the time, three in the morning, make it more than a mistake: treat it as an incident.

```
$ comm -13 suid-2026-11-08.txt suid-2026-11-15.txt
/usr/local/bin/backup-helper
```

?? What's the right next step?
+ Ask who installed it, and check the record
- Delete it at once, without telling anyone else
- Ignore it, since the name sounds quite harmless
- Add it to the baseline and move on
=> It appeared this week. Either a colleague can point to the change that added it, or nobody can, and then it's something to investigate.

```
C:\Program Files\Acme Tools\agent.exe BUILTIN\Users:(M)
```

?? That file is the program of a service that runs as `SYSTEM`. What can an ordinary user do?
+ Replace the program that `SYSTEM` will run
- Read the program, but never change it
- Stop Windows from starting up at all
- Nothing, because the service is properly signed
=> `(M)` is modify. Whoever can change the file decides what runs with the highest rights at the next restart. Remove the permission, and check whether the file has already been altered.

?! Write your own Linux privilege audit checklist: ten checks, each with a command, and what a bad result looks like.

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [GTFOBins: Unix binaries that can be abused, to audit for](https://gtfobins.github.io/)
- [LOLBAS: the Windows equivalent](https://lolbas-project.github.io/)
- [MITRE ATT&CK, Privilege Escalation tactic](https://attack.mitre.org/tactics/TA0004/)
