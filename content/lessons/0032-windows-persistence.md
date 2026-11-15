---
title: Windows persistence
summary: The places malware hides to survive a reboot, and how to check each. You'll plant it yourself, then hunt it.
month: 5
minutes: 55
builds: name at least 8 persistence locations and how to check each
source: MITRE ATT&CK, Persistence tactic | https://attack.mitre.org/tactics/TA0003/
words: persistence, autostart, masquerading
---
An attacker who gets in once doesn't want to do it again. So they arrange to come back automatically, and that's **persistence**. Every method leaves a trace in a known place, which makes this a hunt you can win.

@term persistence = Keeping access to a system across reboots and logouts.
@term autostart = Any mechanism that launches a program automatically.
@term masquerading = Naming malicious files to look legitimate.
@term WMI subscription = A WMI rule that runs an action when an event happens, usable for stealthy persistence.

## The eight places to know

| # | Location | How to check | ATT&CK |
|---|---|---|---|
| 1 | **Run keys**: `HKLM` and `HKCU\...\CurrentVersion\Run` | Autoruns, `reg query` | [T1547.001](https://attack.mitre.org/techniques/T1547/001/) |
| 2 | **Startup folder** | Autoruns, `shell:startup` | T1547.001 |
| 3 | **Services** | `sc query`, event 7045 | [T1543.003](https://attack.mitre.org/techniques/T1543/003/) |
| 4 | **Scheduled tasks** | `schtasks /query`, Autoruns | [T1053.005](https://attack.mitre.org/techniques/T1053/005/) |
| 5 | **WMI event subscriptions** | Autoruns (WMI tab) | [T1546.003](https://attack.mitre.org/techniques/T1546/003/) |
| 6 | **Winlogon helpers** | Autoruns | [T1547.004](https://attack.mitre.org/techniques/T1547/004/) |
| 7 | **DLL search-order hijacking** | Autoruns, Sysmon ID 7 | [T1574.001](https://attack.mitre.org/techniques/T1574/001/) |
| 8 | **New local accounts** | `net user`, event 4720 | [T1136.001](https://attack.mitre.org/techniques/T1136/001/) |

Autoruns collects most of these in one window, so it's your first tool. Tick **Hide Microsoft Entries** to reduce the noise, and check for missing signatures and unusual paths.

A table is easy to memorise and hard to use, so here is each place again with the command that reads it and what a healthy machine shows. Run every one on your own VM now: you can't recognise "odd" until you've seen "normal".

**1 and 2. Run keys and the Startup folder.** Programs listed here start when a user logs in.

```
reg query "HKLM\Software\Microsoft\Windows\CurrentVersion\Run"
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Run"
dir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
dir "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp"
```

Normal: a handful of signed vendor programs in the keys, and usually nothing at all in the two folders.

**3. Services.** Started at boot, usually as `SYSTEM`.

```powershell
Get-CimInstance Win32_Service | Select-Object Name, StartMode, StartName, PathName
```

Normal: every `PathName` points into `C:\Windows` or `C:\Program Files`.

**4. Scheduled tasks.** Started by a time or an event.

```
schtasks /query /tn "Updater" /v /fo LIST
```

The lines to read are `Task To Run`, `Run As User` and `Schedule Type`. Normal: hundreds of tasks under `\Microsoft\Windows\`, and very few at the top level.

**5. WMI event subscriptions.** A rule stored inside Windows itself: "when this event happens, run that". There's no file in a startup folder and no registry Run value, which is why it's favoured for staying hidden.

```powershell
Get-CimInstance -Namespace root/subscription -ClassName __EventConsumer
```

Normal: one entry named `SCM Event Log Consumer`. Anything else needs an explanation.

**6. Winlogon helpers.** Two registry values name the programs Windows runs at every logon.

```
reg query "HKLM\Software\Microsoft\Windows NT\CurrentVersion\Winlogon"
```

Normal: `Shell` is exactly `explorer.exe`, and `Userinit` is exactly `C:\Windows\system32\userinit.exe,` with nothing after the comma.

**7. DLL search-order hijacking.** No setting to read: look for a DLL sitting beside a program that normally loads it from `System32`. Sysmon event 7 and the path check from lesson 30 find it.

**8. New local accounts.** The simplest way back in is a login of your own.

```powershell
Get-LocalUser | Select-Object Name, Enabled, LastLogon
Get-LocalGroupMember Administrators
```

Normal: you can name every account, and say why each member of Administrators is there.

?? You open Autoruns on a suspect host. What's the most efficient first move?
+ Hide Microsoft entries, then review the unsigned ones
- Delete everything that isn't from Microsoft at once
- Read every single entry from top to bottom
- Reboot, so that all the malware shows itself
=> Filtering puts the unusual entries in front of you. Never delete before you've recorded evidence.

## The hunt, step by step

::: try Plant it, then find it (snapshot first)
On your own Windows VM:

```
reg add HKCU\Software\Microsoft\Windows\CurrentVersion\Run /v Updater /t REG_SZ /d "C:\Windows\System32\notepad.exe"
schtasks /create /tn "Updater" /tr notepad.exe /sc onlogon
```

Now put your defender hat on. Find both in Autoruns, note the exact path and name, then remove them and confirm they're gone:

```
reg delete HKCU\Software\Microsoft\Windows\CurrentVersion\Run /v Updater /f
schtasks /delete /tn "Updater" /f
```
:::

Notepad is harmless, but the mechanism is real. That's what the roadmap means by creating persistence on purpose.

While the two entries are in place, look at what the machine recorded about your own actions. Each mechanism has an event that says "this was created":

| You created | Recorded as |
|---|---|
| A Run key value | Sysmon 13, registry value set, with the key, the data and the process that wrote it |
| A file in the Startup folder | Sysmon 11, file created |
| A service | 7045 in the System log, 4697 in the Security log |
| A scheduled task | 4698 in the Security log, if object-access auditing is on |
| A WMI subscription | Sysmon 19, 20 and 21 |
| A local account | 4720 in the Security log, and 4732 when it joins a group |

Sysmon 1 also recorded `reg.exe` and `schtasks.exe` starting, with your full command lines. So a defender has two chances: the entry itself, and the act of creating it. You'll install Sysmon in the next lesson and can come back to read these.

?? Why plant harmless persistence yourself?
+ You learn exactly what it leaves
- It makes the machine run faster
- It's required by Windows each month
- It removes any real malware present
=> Doing it once teaches you what to look for, in a way that reading can't.

## What makes an entry suspicious

- It runs from a user-writable path: `AppData`, `Temp`, `ProgramData`, `Public`.
- It's unsigned, or the publisher is blank.
- Its name is almost right (`svch0st`, `OneDriveUpdate.exe` in the wrong folder).
- It launches a script host: `powershell.exe`, `wscript.exe`, `mshta.exe`, with long or encoded arguments.
- It was created just before the alert.

?? Which Run key value deserves the first look?
+ `powershell -enc SQBFAFgA...`, in a user's key
- A signed vendor updater in `Program Files`
- `OneDrive.exe` from its normal install folder path
- A signed security agent in `Program Files`
=> An encoded PowerShell command at login is a strong signal. Encoded commands aren't always evil, but they're the first thing to decode.

## A baseline beats a good memory

Nobody remembers what every autostart entry on a machine should be. Professionals don't try: they save the list while the machine is known to be clean, and later they compare. Autoruns has a command-line twin, `autorunsc`, made for this:

```
autorunsc.exe -accepteula -a * -c -h -s > baseline.csv
```

| Option | Meaning |
|---|---|
| `-a *` | Every category of autostart, not only logon entries |
| `-c` | Output as CSV, one entry per line |
| `-h` | Add the hash of each file |
| `-s` | Check each file's signature |

Run it again later into `today.csv`, and let PowerShell show only what changed:

```powershell
Compare-Object (Get-Content baseline.csv) (Get-Content today.csv)
```

Lines marked `=>` exist only in the new file. On a machine where nothing was installed, there should be none. One new unsigned line is the whole investigation handed to you.

When you do find something, the order of your actions matters more than their speed:

1. **Record** the entry exactly: name, path, command line, hash, and the time it was created.
2. **Remove** it, and confirm with the same command that found it.
3. **Explain** it: persistence is step two of a break-in, so ask what step one was.

?? The Winlogon `Userinit` value reads `C:\Windows\system32\userinit.exe,C:\Users\Public\svc.exe`. What's wrong?
+ A second program follows after the comma
- The real `userinit.exe` path is misspelt there
- The value should point at `explorer.exe` only
- The value must be empty by default
=> The first program is the genuine one, which is what makes this easy to miss. Everything in the list runs at each logon.

?? Which record tells you that a scheduled task was created?
+ Event 4698, in the Security log
- Event 7045, in the System log
- Event 4720, in the Security log
- Event 4625, in the Security log
=> 4698 is task creation. 7045 is a new service, 4720 a new account and 4625 a failed logon.

?? You find a Run value that starts an unknown program from `AppData`. What do you do first?
+ Record its name, data and timestamps
- Delete the value straight away, quietly
- Reboot the machine to clear it
- Reinstall Windows from some clean media
=> Evidence first. Once the entry is deleted you can no longer prove what it was, when it appeared or what wrote it.

::: job Interview answer
"Where would you look for persistence?" Name Run keys, services, scheduled tasks and WMI, say which tool shows each, and say which event IDs record them. That's a Tier 1 answer with Tier 2 depth.
:::

?! Without looking, list as many persistence locations as you can, with how to check each. Aim for eight.
