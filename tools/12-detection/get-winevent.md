---
title: Get-WinEvent
summary: Queries Windows event logs from PowerShell, the scriptable way into Event Viewer.
side: defence
use: open
docs: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/get-winevent
aka: wevtutil, Event Viewer
alt: sysmon, powershell
---
## What it's for
Windows writes its security and system events to event logs, and Event Viewer shows them one at a time. `Get-WinEvent` is the PowerShell cmdlet that searches them in bulk, and `wevtutil` is the older command-line tool for querying, exporting and clearing them. Together they answer "who logged on, when, and from where" on a Windows machine.

## How it works
Each log (Security, System, Application, and many more under Applications and Services, such as Sysmon's) holds events identified by a provider and an event ID. A few IDs carry most investigations: 4624 is a successful logon and 4625 a failed one, 4688 a new process (when process auditing is on), 4720 a new account, 7045 a new service, and 1102 the Security log being cleared. A hash-table filter is evaluated by the event log service itself, so it's far quicker than fetching everything and filtering afterwards. Reading the Security log needs an administrator.

## Try it
```
Get-WinEvent -ListLog * | Where-Object RecordCount -gt 0
Get-WinEvent -FilterHashtable @{ LogName = 'Security'; Id = 4625 } -MaxEvents 20
Get-WinEvent -FilterHashtable @{ LogName = 'System'; Id = 7045; StartTime = (Get-Date).AddDays(-7) }
wevtutil qe Security /q:"*[System[(EventID=4624)]]" /c:5 /rd:true /f:text
```

Lock your screen and type a wrong password once, then find that 4625 event and read which account and logon type it records.

## What defenders see
These logs are the defender's raw material, which is why attackers clear them: event 1102 (Security log cleared) or 104 (another log cleared) should always raise an alert. Collecting events centrally, through Windows Event Forwarding or a SIEM agent, means a cleared local log still has a copy elsewhere. Add [Sysmon](/tools/sysmon/) for far richer process and network detail than the built-in logs give.

?! You see one 4625 event for each of 300 different usernames, all from one address, within two minutes. What attack is this, and why might per-account lockout not stop it?
