---
title: Auditing for privilege escalation
summary: The defender's checklists for Linux, Windows and Active Directory: what lets a normal user become an admin, how to find it first, and how each path looks in logs.
month: 10
minutes: 50
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

?? What makes a privilege audit worth more over time?
+ Automatically comparing the results with the last run
- Printing the output and filing it away somewhere
- Running it once a decade on one server
- Keeping the results secret from the admin team
=> The change between two runs is the signal. A new SUID file nobody can explain deserves attention.

?! Write your own Linux privilege audit checklist: ten checks, each with a command, and what a bad result looks like.
