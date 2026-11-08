---
title: nbtscan
summary: Lists Windows hosts on a network through NetBIOS names.
side: both
use: own
docs: https://www.kali.org/tools/nbtscan/
kali: nbtscan
alt: arp-scan, enum4linux-ng
---
## What it's for
nbtscan asks each address for its NetBIOS name table, which reveals the host name, workgroup and logged-in user names on old configurations. ATT&CK records it in several real intrusions, since it's small and quick.

## How it works
NetBIOS is an old naming system that still runs on UDP port 137. A status query asks a host to list its registered names, and it answers without authentication. So sweeping a range gives you a quick inventory of Windows machines.

## Try it
::: law Your lab only
Sweep your own lab network.
:::

```
nbtscan 192.168.56.0/24
```

Compare the names with your inventory. Now turn off NetBIOS over TCP/IP on one host, and scan again.

## What defenders see
A sweep of UDP 137 from one workstation is unusual, and sensors can flag it. Disable NetBIOS where it's not needed, as well as LLMNR, which reduces [name poisoning](/modules/01-08-lan-and-legacy-protocols/) too.

?! Why would an intruder use a tiny tool like this soon after landing on a machine?
