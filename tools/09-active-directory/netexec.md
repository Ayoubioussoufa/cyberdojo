---
title: NetExec
summary: A Swiss-army tool for assessing Windows networks at scale, and a map of what to lock down.
side: both
use: know
docs: https://www.netexec.wiki/
aka: crackmapexec, cme, nxc
alt: impacket, responder
---
## What it's for

NetExec, the maintained successor to CrackMapExec, automates checks across many Windows machines at once: which credentials work where, which shares are readable, and which hosts are misconfigured. Assessors use it to find weaknesses fast, and for a defender it's a checklist of exactly what to harden and monitor.

## How it works

It ties together protocols such as SMB, WinRM and others, and runs a chosen check against a whole range of hosts. Its power is scale: it quickly shows where a single set of credentials is accepted, which is how lateral movement happens in practice. The underlying issues it surfaces, reused local administrator passwords, over-shared folders, weak settings, are all configuration problems a defender can fix.

## Practise safely

On a lab of a few Windows VMs, the defensive exercise is to identify the weaknesses it would find: a shared local administrator password, an over-permissive share, missing SMB signing. Fixing those, for example with Windows LAPS to give every machine a unique local administrator password, removes the easy paths. Watch the logs it generates across many hosts.

## What defenders see

The telltale sign is one source authenticating to many hosts in a short time, often with the same account, which network and Windows logs reveal clearly. Defences are concrete: unique local administrator passwords with LAPS, SMB signing, least privilege on shares, and segmentation so one credential doesn't open the whole estate. [Windows defences](/modules/02-09-windows-defences/) covers them.

?! Why is one account successfully authenticating to many machines in minutes a strong signal, and what setting most reduces that risk?
