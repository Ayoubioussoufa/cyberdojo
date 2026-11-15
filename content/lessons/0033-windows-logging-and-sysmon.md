---
title: Windows logs and Sysmon
summary: The event IDs that record what happened, how to deploy Sysmon, and how to generate and find specific events.
month: 5
minutes: 60
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

An event is more than its number. Open one 4624 in Event Viewer (**Windows Logs → Security**, then **Filter Current Log** and type the ID) and you'll find a form with dozens of fields. Five of them answer most questions:

```
Event 4624: An account was successfully logged on.
    TargetUserName   : ana
    LogonType        : 10
    IpAddress        : 203.0.113.50
    WorkstationName  : DESKTOP-7Q2
    TargetLogonId    : 0x3E7A91
```

Who logged on, how, from which address, from which machine name, and the ID of the session that was created. That last one is the thread you pull: every later event from the same session, including the 4634 logoff, carries the same logon ID.

`LogonType` tells you how the person arrived, and it changes the meaning of the event completely:

| Type | Name | Means |
|---|---|---|
| 2 | Interactive | Someone at the keyboard and screen |
| 3 | Network | A connection to a shared folder or another network service |
| 4 | Batch | A scheduled task |
| 5 | Service | A service starting under its account |
| 7 | Unlock | The screen was unlocked |
| 10 | RemoteInteractive | Remote Desktop |

Thousands of type 3 and type 5 logons a day are normal background. One type 10 logon from an address outside the company is not.

What gets recorded at all is decided by the **audit policy**. See it, and turn on process creation, from an administrator prompt:

```
auditpol /get /category:*
auditpol /set /subcategory:"Process Creation" /success:enable
```

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

Here is one Sysmon event 1, trimmed to the fields you'll read first:

```
Event 1: Process Create
    UtcTime           : 2026-11-15 09:14:02.118
    Image             : C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
    CommandLine       : powershell.exe -nop -w hidden -enc SQBFAFgA…
    User              : CORP\ana
    ParentImage       : C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE
    ParentCommandLine : "WINWORD.EXE" /n "C:\Users\ana\Downloads\invoice.docm"
    Hashes            : SHA256=9F2B…
```

Read it from the parent down, as a sentence: Word opened a document from the Downloads folder, and Word then started PowerShell with a hidden window and an encoded command. Neither program is malicious. The relationship is the finding, because a word processor has no reason to start a script interpreter. This is why `ParentImage` is the most valuable field Sysmon adds: default logs give you processes, and Sysmon gives you the story.

Sysmon logs a lot unless you filter it, so use a maintained configuration like [sysmon-modular](https://github.com/olafhartong/sysmon-modular).

The configuration is an XML file of rules that say what to record and what to skip. A fragment looks like this:

```xml
<RuleGroup name="" groupRelation="or">
  <NetworkConnect onmatch="exclude">
    <Image condition="is">C:\Program Files\Mozilla Firefox\firefox.exe</Image>
  </NetworkConnect>
</RuleGroup>
```

It reads: for network connections, record everything except those made by Firefox. Every exclusion is a blind spot that you chose, so a config should say why each one is there. Three commands manage the installed service:

| Command | Does |
|---|---|
| `Sysmon64.exe -c` | Prints the configuration in use |
| `Sysmon64.exe -c new.xml` | Replaces it, with no reboot |
| `Sysmon64.exe -u` | Uninstalls Sysmon |

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

Read the first command as a sentence: from the Security log, give me events with ID 4625, and stop after 20. Add a time window with one more key, such as `StartTime=(Get-Date).AddHours(-1)` for the last hour.

The fields inside an event aren't columns you can sort by. They sit in the event's XML, so to count or group by a field you pull it out first. This counts failed logons per account, which turns 200 lines into the three that matter:

```powershell
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} |
  ForEach-Object {
    ([xml]$_.ToXml()).Event.EventData.Data |
      Where-Object Name -eq 'TargetUserName' |
      Select-Object -ExpandProperty '#text'
  } |
  Group-Object | Sort-Object Count -Descending
```

Step by step: fetch the events, turn each into XML, keep the `TargetUserName` field, take its text, then group identical names and sort by how many there are. It's the Windows cousin of `sort | uniq -c | sort -rn` from Month 1.

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

## Read three events

Three events from one morning. Decide what each one means before you read the choices.

```
Event 4624   TargetUserName: svc-backup   LogonType: 10   IpAddress: 198.51.100.77
```

?? What kind of logon is that, and why does it stand out?
+ Remote Desktop, used by a service account
- A scheduled task, run by a service
- A file share, opened by a user
- A screen unlock, done at the keyboard
=> Type 10 is Remote Desktop. Service accounts run services, which is type 5: one of them opening a desktop session from a remote address is a person using its password.

```
Event 1   ParentImage: …\WINWORD.EXE   Image: …\powershell.exe   CommandLine: powershell.exe -w hidden -enc …
```

?? What makes that Sysmon event worth an alert?
+ A document program started a hidden script
- PowerShell is malware and should never run
- Word is unsigned and runs from Temp
- The event is missing its user name
=> Both programs are legitimate. A word processor launching a hidden, encoded PowerShell command is the pattern of a malicious document.

```
Event 1102   The audit log was cleared.   SubjectUserName: ana   03:12
```

?? What does that event tell you?
+ Someone wiped the Security log at 03:12
- The log reached its maximum size limit
- Windows installed a big update that night
- Ana failed to log on at 03:12
=> 1102 is written when the Security log is cleared by hand, and it names the account that did it. Logs that rotate when full don't produce it.

::: try Make the events, then find them
1. Fail a logon on purpose with a wrong password, then find the 4625 with `Get-WinEvent` and read its `TargetUserName` and `LogonType`.
2. Log on correctly and find the matching 4624. Note its logon ID.
3. With Sysmon installed, run `notepad`, then find its event 1. Which program is the `ParentImage`?
4. Run `curl https://example.com` and find the event 22. Which `Image` made the query?
5. Run the counting pipeline above and check that your failed logon is in the result.
:::

?! A colleague says "there's no 4688 for that, so the program never ran". What's wrong with that reasoning?
