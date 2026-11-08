---
title: net, ipconfig and the net recon family
summary: Everyday Windows commands attackers run first to understand where they've landed.
side: both
use: know
docs: https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/net-commands-on-operating-systems
aka: net, tasklist, systeminfo
alt: wmic, sysmon
---
## What it's for
When an intruder lands on a Windows machine, the first thing they do is look around, and they do it with the commands administrators use every day: `whoami`, `net`, `ipconfig`, `tasklist`, `systeminfo`, `nltest`. ATT&CK groups this as discovery, and these built-in commands are its workhorses.

## How it works
Each command is ordinary on its own. `whoami` shows the current user, `net group` lists accounts and groups, `ipconfig` shows the network, `tasklist` the processes, `systeminfo` the patches, `nltest` the domain trusts. What marks an intrusion is the pattern: many of these running in quick succession, often soon after a login, as someone who doesn't yet know the machine orients themselves. A real user rarely runs `systeminfo` then `net group` then `nltest` in two minutes.

## Practise safely
Study the pattern, since no single command is the signal. On a lab VM with command-line logging, run a few of these yourself and see how ordinary each looks alone. Then consider how a burst of them, from one process in a short window, tells a different story. This is where behavioural detection beats any single indicator.

## What defenders see
Detection here is about sequence and context: several discovery commands from one parent process, soon after initial access, especially on a server. Good command-line logging through [Sysmon](/tools/sysmon/) is the foundation, and these sequences map cleanly to ATT&CK discovery techniques, which [attack models](/modules/09-01-attack-models/) covers.

?! Why is a burst of these commands together a better signal than any one of them, which an admin might run any day?
