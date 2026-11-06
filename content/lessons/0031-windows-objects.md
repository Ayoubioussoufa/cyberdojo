---
title: Windows from the inside
summary: Services, the registry, NTFS, users and SIDs, access tokens and UAC, seen through Sysinternals.
month: 5
minutes: 40
builds: explain SIDs, tokens, UAC and services to a non-expert, an exit-gate item
source: Sysinternals documentation, Microsoft | https://learn.microsoft.com/en-us/sysinternals/
words: registry, SID, access token
---
Time to meet Windows on its own terms. Keep a Windows VM open: this lesson is best done with the tools in front of you.

@term registry = Windows' central hierarchical database of system and user settings.
@term hive = A top-level section of the registry, stored in a file on disk.
@term NTFS = The standard Windows filesystem.
@term ADS (alternate data stream) = A hidden extra stream of data attached to an NTFS file.
@term SID (security identifier) = The unique ID Windows uses for a user or group.
@term access token = The object describing a process's identity and privileges.
@term UAC (User Account Control) = The Windows prompt that separates standard rights from admin rights.
@term Sysinternals = Microsoft's free suite of advanced Windows diagnostic tools.
@term WMI = Windows Management Instrumentation: a system for querying and managing Windows.
@term scheduled task = A Windows job that runs at a set time or event.

## Set up

::: try Your Windows VMs
Download the free evaluation images of [Windows 11 Enterprise](https://www.microsoft.com/en-us/evalcenter/evaluate-windows-11-enterprise) and [Windows Server](https://www.microsoft.com/en-us/evalcenter/). Give each 4 GB of RAM and a host-only adapter, take a snapshot, then get the [Sysinternals Suite](https://learn.microsoft.com/en-us/sysinternals/downloads/sysinternals-suite).
:::

| Tool | Use it to see |
|---|---|
| Process Explorer | The process tree, parents, loaded DLLs, signatures |
| Autoruns | Everything that starts automatically |
| Procmon | Every file, registry and process event, live |
| TCPView | Network connections per process |

?? Which tool shows what starts automatically on Windows?
+ Autoruns, which lists startup items
- TCPView, which lists network connections
- Procmon, which records live events
- Notepad, which edits plain text
=> Autoruns is your first stop when hunting persistence.

## Processes that should look a certain way

Windows has a predictable tree, and malware often mimics it. `services.exe` starts services, `svchost.exe` hosts them, and `lsass.exe` handles logins and holds credential material. Each normal system process has an expected parent, location and count.

| Red flag | Why |
|---|---|
| `svchost.exe` running from `C:\Users\...` | The real one is in `System32` |
| `lsass.exe` with a child process | Lsass doesn't start programs |
| `scvhost.exe` | A typo-named impostor |

The SANS [Hunt Evil poster](https://www.sans.org/posters/hunt-evil/) lists these. Print it.

?? Which of these is a red flag?
+ `svchost.exe` running from a user's folder
- `svchost.exe` running from the `System32` folder
- `lsass.exe` running once on the machine
- `services.exe` starting a normal Windows service
=> The real one lives in `System32`. Location gives away many impostors.

## Services and scheduled tasks

A **service** is a background program, often running as the very powerful `SYSTEM` account. A **scheduled task** runs at a time or event. Both are favourite persistence spots, and both are logged when created.

?? Why do attackers like Windows services?
+ They often run as powerful `SYSTEM`
- They can't be seen by anyone
- They only run on Linux machines
- They delete logs all by themselves
=> A service survives reboots, and it often has the highest rights. It's also logged when created.

## The registry

The **registry** is Windows' database of settings, arranged in **hives**, a bit like `/etc` as one big tree:

| Hive | Holds |
|---|---|
| `HKLM` | Settings for the whole machine |
| `HKCU` | Settings for the current user |

Values under `...\CurrentVersion\Run` start programs at login, which makes them a classic persistence location. You'll hunt those next lesson.

?? What does `HKLM` hold?
+ Settings for the whole machine
- Settings for one user only
- A folder of system logs
- A list of open ports
=> `HKCU` holds the current user's settings.

## NTFS

Beyond what Linux has, NTFS has a master file table (the **MFT**) recording every file, and **alternate data streams**: extra data attached to a file that Explorer doesn't show. Windows uses one to mark downloaded files as coming from the internet, and attackers can hide data in them. See both in Month 15.

?? What's an alternate data stream?
+ Extra data attached to a file
- A second copy of Windows itself
- A network connection between two folders
- A log of all deleted files
=> Explorer doesn't show them, so they're a place to hide things.

## Identity: SIDs and tokens

Windows, like Linux, thinks in numbers. Every user and group has a **SID**:

```
> whoami /user
S-1-5-21-1004336348-1177238915-682003330-1001
```

The last part is the relative ID: 500 is the built-in Administrator, and 1000+ are normal users. When you log in, Windows builds an **access token** listing your SID, your groups and your privileges. Every process you start carries a copy.

@flow You log in > Token created > Your process carries the token > Kernel checks it on each access

That's exactly the check from Linux, with a token in place of a UID. Attackers who steal or duplicate a token become that user, without knowing the password. See your own with `whoami /all`.

?? An attacker duplicates a token from an admin's running process. What do they gain?
+ They act as that admin, with no password
- They learn the admin's password in plain text
- They delete the admin account from the machine
- Nothing, because tokens are only used at login
=> The token is the identity. That's why admin sessions left on workstations are so dangerous.

## UAC

An admin who logs in gets two tokens: a filtered one for daily work and a full one. **UAC** is the prompt that switches between them. It reduces accidents, and it's convenience rather than a guarantee: [Microsoft doesn't treat UAC as a security boundary](https://www.microsoft.com/en-us/msrc/windows-security-servicing-criteria).

?? Which is the most suspicious finding?
+ `svchost.exe` running from a temp folder
- `svchost.exe` running from `System32` several times
- `explorer.exe` running under the logged-in user
- `services.exe` running under its parent `wininit.exe`
=> Several `svchost.exe` processes are normal, as is `services.exe` under `wininit.exe`. The right name in the wrong folder is classic masquerading.

?! Explain SID, token, UAC and service to a non-expert, in one sentence each.
