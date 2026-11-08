---
title: Volatility
summary: Analyses the contents of a captured memory image.
side: defence
use: open
docs: https://volatility3.readthedocs.io/
alt: autopsy, velociraptor
---
## What it's for
A computer's memory holds what the disk never sees: running processes, network connections, injected code and encryption keys. Volatility, now at version 3, extracts all of this from a memory capture.

## How it works
Memory is a snapshot of structures the operating system keeps in RAM. Volatility understands those structures, so it can list processes, open sockets and loaded modules from a raw capture. Memory-only malware leaves nothing on disk but must exist in RAM to run, which is exactly why memory analysis catches it.

## Try it
::: law Your evidence only
Analyse captures you're authorised to examine.
:::

```
python3 vol.py -f memory.raw windows.pslist
python3 vol.py -f memory.raw windows.netscan
```

Use a practice image from the project's samples. Compare the process list with the network connections: does every connection have a sensible owner?

## What defenders see
Memory forensics is central to modern incident response. Capture memory before you pull the plug, since it's lost on shutdown. Look for processes with no file on disk, injected regions, and connections to odd addresses. [Memory forensics](/modules/08-06-memory-forensics/) goes further.

?! Why do responders capture memory before switching a suspect machine off?
