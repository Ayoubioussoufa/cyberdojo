---
title: Autoruns
summary: Lists everything set to start automatically on a Windows machine, in one place.
side: defence
use: open
docs: https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns
aka: autorunsc
alt: sysmon, procmon
---
## What it's for
Malware wants to survive a reboot, so it registers itself somewhere Windows starts programs automatically. There are dozens of such places: Run keys, services, scheduled tasks, drivers, WMI subscriptions, Explorer add-ons, Winlogon entries. Autoruns, from Microsoft's free Sysinternals suite, lists them all in one view, which makes it a first-hour tool for finding how an intruder stays in.

## How it works
It reads each start-up location from the registry, the file system and the task scheduler, then checks every entry's file: whether it's signed by a verified publisher and, if you ask, how VirusTotal rates its hash. Hiding the entries signed by Microsoft leaves a short list to review. `autorunsc` is the command-line version, which writes CSV for comparing machines, or one machine over time.

## Try it
```
autorunsc64.exe -accepteula -a * -c -h -s -m > autoruns.csv
```

`-a *` covers every category, `-c` writes CSV, `-h` adds hashes, `-s` checks signatures and `-m` hides Microsoft-signed entries. In the window version, tick Options, then Hide Microsoft Entries, and read what remains: is each one a program you installed?

## What defenders see
Look for unsigned entries, files in folders any user can write to such as `AppData` or `Temp`, names that imitate system files, and services or scheduled tasks added recently. An Autoruns snapshot of a clean build, compared later, shows exactly what changed. [Sysmon](/tools/sysmon/) records registry and service changes as they happen, so together they show both the result and the moment. The [living off the land](/modules/06-03-living-off-the-land/) module shows which built-in tools create such entries.

?! Autoruns shows an unsigned scheduled task that runs `C:\Users\Public\update.exe` at every logon. What do you check before deleting it?
