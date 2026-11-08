---
title: BITS and bitsadmin
summary: A Windows file-transfer service that attackers use to download payloads quietly and persist.
side: both
use: know
docs: https://learn.microsoft.com/en-us/windows/win32/bits/background-intelligent-transfer-service-portal
aka: bits
alt: certutil, sysmon
---
## What it's for
The Background Intelligent Transfer Service, BITS, is how Windows downloads updates politely in the background. Attackers misuse it, through `bitsadmin` or PowerShell, to download their tools using a trusted system service, and to keep a foothold. It appears across many intrusions.

## How it works
BITS is designed to transfer files quietly, resuming after interruptions, which is perfect for updates and equally perfect for an attacker who wants a download to blend in. Worse, a BITS job can be set to run a command when it finishes, which gives both the download and a form of persistence that survives reboots. The transfer is done by the service, not the attacker's process, so it hides the connection.

## Practise safely
Study how to see it. BITS activity is recorded in its own event log, and on a lab VM you can watch a normal background transfer there to learn the baseline. The abuse signals are a BITS job created from a command line, a job that runs a program on completion, and transfers to unusual hosts. Review existing BITS jobs, since a lingering one can be persistence.

## What defenders see
Alert on BITS jobs created by `bitsadmin` or PowerShell, and on jobs with a command set to run on completion. Inspect the BITS event log, and periodically list existing jobs on sensitive hosts. As with the rest of this family, command-line logging and application control are the backbone of detection.

?! Why does downloading through a background system service hide an attacker's connection better than downloading directly?
