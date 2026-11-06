---
title: Windows persistence
summary: The places malware hides to survive a reboot, and how to check each. You'll plant it yourself, then hunt it.
month: 5
minutes: 35
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

::: job Interview answer
"Where would you look for persistence?" Name Run keys, services, scheduled tasks and WMI, say which tool shows each, and say which event IDs record them. That's a Tier 1 answer with Tier 2 depth.
:::

?! Without looking, list as many persistence locations as you can, with how to check each. Aim for eight.
