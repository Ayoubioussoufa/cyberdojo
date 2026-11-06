---
title: PowerShell for defenders
summary: Objects and the pipeline, remoting, execution policy, script block logging, and a triage script that outputs JSON.
month: 5
minutes: 40
builds: wintriage.ps1, which collects a host snapshot as JSON
source: PowerShell 101, Microsoft Learn | https://learn.microsoft.com/en-us/powershell/scripting/learn/ps101/00-introduction
words: cmdlet, execution policy, script block logging
---
PowerShell is Windows' automation language, and it's on every Windows machine. That's why attackers love it, and why you need to read it as fluently as they write it.

@term PowerShell = Microsoft's command shell and scripting language, which works with objects.
@term cmdlet = A PowerShell command, named Verb-Noun, like Get-Process.
@term execution policy = A PowerShell setting that controls whether scripts run. It's a safety feature, not a security boundary.
@term script block logging = PowerShell logging that records the code it runs, as event 4104.
@term remoting = Running PowerShell commands on another machine.

## Objects, not text

Bash pipes pass **text**, which is why you used `awk` to cut columns. PowerShell pipes pass **objects** with named properties, so you just ask for what you want.

```powershell
Get-Process | Where-Object CPU -gt 100 | Sort-Object CPU -Descending |
    Select-Object -First 5 Name, Id, CPU

Get-Service | Where-Object Status -eq Running
Get-NetTCPConnection -State Established
Get-ScheduledTask | Where-Object State -eq Ready
Get-LocalUser
```

To explore, use the built-in help:

```powershell
Get-Help Get-Process -Examples
Get-Command *event*
Get-Process | Get-Member       # what properties does it have?
```

?? Why don't you need `awk` to pick a column in PowerShell?
+ The pipeline passes objects with named properties
- PowerShell output is always a single column
- PowerShell has no way to process text
- Windows stores its output in the registry
=> You ask for the property by name. That's the main idea behind PowerShell.

## Execution policy isn't a security control

PowerShell has an execution policy that limits running scripts. Microsoft is explicit: ["The execution policy isn't a security boundary, it's defense in depth."](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies) A user can bypass it with `-ExecutionPolicy Bypass`, or by pasting the script's contents.

So don't rely on it. The controls that matter are logging, and [application control](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/appcontrol).

?? Why isn't execution policy a real control?
+ Users can simply bypass it
- It only applies on Linux
- It slows PowerShell too much
- It was removed from Windows
=> Microsoft says so itself. Rely on logging and application control.

## Script block logging

Attackers obfuscate commands, but PowerShell has to decode them before it runs them. **Script block logging** records the decoded code as **event 4104**. Enable it by Group Policy, then look:

```powershell
Get-WinEvent -FilterHashtable @{
    LogName='Microsoft-Windows-PowerShell/Operational'; Id=4104
} -MaxEvents 5
```

This is why PowerShell is so loud on a well-configured host, and why attackers try to run older versions or disable logging.

?? Why does event 4104 work against obfuscated scripts?
+ PowerShell must decode before running it
- Attackers can't use Base64 any more
- Windows blocks all encoded commands now
- Event 4104 decrypts all your files
=> Whatever the disguise, the decoded code gets logged.

## Reading an attacker's one-liner

```powershell
powershell -nop -w hidden -enc SQBFAFgAIAAoAE4A...
```

| Part | Meaning |
|---|---|
| `-nop` | No profile |
| `-w hidden` | Hidden window |
| `-enc` | The command is Base64 of UTF-16 text |

Decode it with [CyberChef](https://gchq.github.io/CyberChef/) or in PowerShell:

```powershell
[Text.Encoding]::Unicode.GetString([Convert]::FromBase64String("SQBFAFgA..."))
```

?? Why does `-enc` output look different from plain Base64 of ASCII text?
+ It encodes UTF-16, so bytes alternate with nulls
- It uses encryption keyed to the current user
- It's compressed by Windows just before it runs
- It stores the script in a registry value
=> PowerShell's `-EncodedCommand` expects UTF-16LE, which is why decoded strings show gaps if you treat them as ASCII. It's encoding, not encryption.

## Remoting

`Enter-PSSession -ComputerName SRV1` opens a remote shell, and `Invoke-Command` runs on many machines. Admins use it, and so do attackers moving laterally. It uses WinRM, on ports 5985 and 5986.

?? Which ports does WinRM use?
+ 5985 and 5986
- 22 and 23
- 80 and 443
- 3389 and 445
=> 22 is SSH, 80 and 443 are web, and 3389 is RDP.

## Your triage script

::: try Build wintriage.ps1
Collect processes with parents and paths, services, scheduled tasks, established connections and recent logons, then output JSON that your Python tools can read:

```powershell
$report = [ordered]@{
    host       = $env:COMPUTERNAME
    time       = (Get-Date).ToUniversalTime().ToString("o")
    processes  = Get-CimInstance Win32_Process |
                 Select-Object ProcessId, ParentProcessId, Name, ExecutablePath, CommandLine
    services   = Get-CimInstance Win32_Service |
                 Select-Object Name, State, StartMode, PathName
    tasks      = Get-ScheduledTask | Select-Object TaskName, TaskPath, State
    network    = Get-NetTCPConnection -State Established |
                 Select-Object LocalPort, RemoteAddress, RemotePort, OwningProcess
}
$report | ConvertTo-Json -Depth 4 | Out-File triage.json -Encoding utf8
```
Add recent logons, then add it to [P03](/projects/P03/). Note that time is in UTC: always the case for incident work.
:::

The Month 5 gate is on [the roadmap](/roadmap/5/).

?! Why does the course say execution policy isn't a security control? What would you rely on instead?
