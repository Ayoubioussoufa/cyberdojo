---
title: Windows logs and Sysmon
summary: The event IDs that record what happened, how to deploy Sysmon, and how to generate and find specific events.
month: 5
minutes: 40
builds: Sysmon deployed with a documented config, and 5 events located
source: Sysmon documentation, Microsoft | https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon
words: event ID, Sysmon, audit policy
---
Everything in the last two lessons leaves a mark, if logging is on. Windows logs are the raw material of SOC work, and memorising the key numbers is one of the few places where memorising pays.

@term event ID = The number that identifies a type of Windows log entry.
@term Event Viewer = The built-in Windows application for reading logs.
@term audit policy = Windows settings that decide which security events get recorded.
@term Sysmon = A free Microsoft tool that logs detailed process, network and file activity.
@term EDR (endpoint detection and response) = Security software that records and responds to activity on devices.

## The Security log

| ID | Meaning | Why you care |
|---|---|---|
| **4624** | Successful logon | Who, from where, what type |
| **4625** | Failed logon | Password guessing |
| **4634** | Logoff | Session end |
| **4648** | Logon with explicit credentials | `runas`, lateral movement |
| **4672** | Special privileges assigned | Admin logons |
| **4688** | Process created | Needs auditing turned on |
| **4697** | Service installed | Persistence |
| **4720** | User created | Persistence |
| **4732** | Added to a local group | Privilege change |
| **1102** | Audit log cleared | Covering tracks |

From the System log, **7045** is a new service. From PowerShell, **4104** is script block logging, which shows the actual script that ran.

@drill event-ids

::: trap Not everything is on by default
Process creation (4688) isn't logged by default, and it won't show command lines until you [enable them](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/component-updates/command-line-process-auditing). An analyst who assumes the log exists finds nothing and draws the wrong conclusion. "No evidence" only means something if the data was being collected.
:::

?? You find 200 event 4625 entries for one account, then a 4624. What does that suggest?
+ Password guessing that eventually got in
- A user logging off many times
- An administrator clearing the audit log
- A new service being installed today
=> Many failed logons followed by a success is the classic brute-force pattern.

## Why Sysmon

Default logs say a process started. [Sysmon](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon) adds the detail investigators need, including the full command line, the file hash and the parent process.

| Sysmon ID | Records |
|---|---|
| **1** | Process creation |
| **3** | Network connection |
| **7** | Image (DLL) loaded |
| **8** | CreateRemoteThread |
| **10** | ProcessAccess |
| **11** | FileCreate |
| **13** | Registry value set |
| **22** | DNS query |

@drill sysmon-ids

Sysmon logs a lot unless you filter it, so use a maintained configuration like [sysmon-modular](https://github.com/olafhartong/sysmon-modular).

::: try Deploy it
```
Sysmon64.exe -accepteula -i sysmonconfig.xml
```
Logs appear in Event Viewer under **Applications and Services Logs → Microsoft → Windows → Sysmon → Operational**. Then generate events, and find each one: run `notepad` (ID 1), run `curl https://example.com` (IDs 3 and 22), create a file (ID 11), add a Run key (ID 13).
:::

?? What does Sysmon add that default logs lack?
+ Command lines, hashes and parent processes
- Automatic blocking of all known malware
- A backup of every file changed
- A faster way to start Windows
=> It records detail. It doesn't block anything.

## Querying from the command line

Clicking through Event Viewer doesn't scale. `Get-WinEvent` is the tool:

```powershell
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} -MaxEvents 20

Get-WinEvent -FilterHashtable @{
    LogName='Microsoft-Windows-Sysmon/Operational'; Id=1
} -MaxEvents 5 | Format-List TimeCreated, Message
```

The gate: find a specific logon event in under two minutes.

?? A process made a suspicious DNS lookup. Which Sysmon event would show the query?
+ Event ID 22, the DNS query
- Event ID 1, the process creation
- Event ID 11, the file creation
- Event ID 13, the registry value
=> Sysmon 22 ties a DNS query to the process that made it, which a network DNS log can't do on its own.

::: ai Roadmap exercise
Ask an LLM for "the 15 most important event IDs for detecting lateral movement". Verify each against Microsoft's documentation and your own lab. Classify errors: wrong ID, wrong log, invented field. This is the reflex you'll need in a SOC.
:::

?! A colleague says "there's no 4688 for that, so the program never ran". What's wrong with that reasoning?
