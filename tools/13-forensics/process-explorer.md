---
title: Process Explorer
summary: Shows Windows processes as a tree, with their files, connections, signature and parent.
side: defence
use: open
docs: https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer
aka: procexp
alt: procmon, autoruns, sysmon
---
## What it's for
Task Manager shows what runs; Process Explorer, from Microsoft's free Sysinternals suite, shows how it got there. Each process sits under the one that started it, with its command line, its user, the DLLs and handles it holds, its network connections, and whether its file is signed. It's the tool for a first look at a Windows machine you suspect.

## How it works
It reads the same information from Windows as Task Manager, and more through a small driver. Colours mark kinds of process, such as services and your own programs. Options turn on signature checks (Verify Image Signatures) and VirusTotal lookups of each file's hash. The lower pane lists the open handles or the loaded DLLs of the selected process.

## Try it
Start Process Explorer as administrator, then add the Command Line and Verified Signer columns from View, Select Columns. Then:

- Find `explorer.exe` and expand it: what you started from the desktop sits beneath it.
- Find a `svchost.exe` and check its parent, which should be `services.exe`.
- Right-click any process, choose Properties, and read its TCP/IP and Strings tabs.

```
procexp64.exe /accepteula
```

## What defenders see
Look for parent and child pairs that make no sense: Word or Outlook starting `powershell.exe` or `cmd.exe`, a `svchost.exe` whose parent isn't `services.exe` or that runs from outside `C:\Windows\System32`, names one letter away from a system process, and unsigned programs in user folders. The same checks, recorded all the time, are what [Sysmon](/tools/sysmon/) rules look for.

?! Process Explorer shows `svchost.exe` running from `C:\Users\Public\svchost.exe`, as a child of `explorer.exe`. List everything that's wrong with that picture.
