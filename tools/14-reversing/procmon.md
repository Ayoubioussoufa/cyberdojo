---
title: Process Monitor
summary: Records every file, registry, process and network action on Windows, live.
side: defence
use: open
docs: https://learn.microsoft.com/en-us/sysinternals/downloads/procmon
aka: procmon
alt: strace, sysmon
---
## What it's for
Process Monitor, from Microsoft's Sysinternals suite, shows in real time what programs do on a Windows machine: every file they open, every registry key they read or write, every process they start and every network connection they make. Administrators use it to find out why a program fails, and analysts to watch what a suspicious program does to a system.

## How it works
A kernel driver captures events as they happen, each with the process, the operation, the path, the result and a full call stack. A busy machine produces hundreds of thousands of events a minute, so filters do all the work: by process name, operation, path or result. The process tree view shows parents and children across the whole capture. Captures save as PML files you can open later, or on another machine.

## Try it
Open Process Monitor, choose Filter, and add "Process Name is notepad.exe, then Include". Start Notepad, save a file, and stop the capture with Ctrl+E. You'll see each step of saving, including the registry keys Notepad reads for its settings. A filter on "Result is NAME NOT FOUND" shows every file a program looked for and didn't find, which is how DLL search-order problems show up.

```
Procmon64.exe /AcceptEula /Quiet /Minimized /BackingFile C:\lab\trace.pml
Procmon64.exe /Terminate
```

These two lines record to a file in the background, then stop.

## What defenders see
In a malware lab, run the sample in an isolated VM with Process Monitor recording, then look for files dropped in `AppData` or `Temp`, Run keys written, new services and child processes. The [dynamic analysis](/modules/05-08-dynamic-analysis-and-debugging/) module covers a safe set-up. On a monitored network, someone loading the Process Monitor driver on a server is unusual and worth a look.

?! A program says "configuration not found", but its configuration file is there. How would Process Monitor show you where it's really looking?
