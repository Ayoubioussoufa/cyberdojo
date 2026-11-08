---
title: arpspoof
summary: Part of dsniff, the classic toolkit that redirects LAN traffic.
side: attack
use: know
docs: https://www.monkey.org/~dugsong/dsniff/
kali: dsniff
aka: dsniff
alt: ettercap, bettercap
---
## What it's for
`arpspoof` comes from dsniff, written by Dug Song around 2000. It's historic: it showed how weak switched networks were, and it changed how people thought about plain-text protocols.

## How it works
It sends forged ARP replies, so a victim links the gateway's IP to the attacker's MAC. Traffic then passes through the attacker's machine. The rest of dsniff collected passwords from plain-text protocols, such as Telnet, FTP and POP3. That problem pushed the industry to SSH and TLS.

## Practise safely
Use `arpwatch` or Zeek on your own lab network, change a device's address, and see the alert. That shows you the signal without attacking anything.

## What defenders see
The signs are the same as for [Ettercap](/tools/ettercap/): unsolicited ARP replies, and a gateway whose MAC changes. Dynamic ARP Inspection stops it at the switch. Static ARP entries protect critical hosts, though they're hard to maintain.

?! Why did tools like dsniff help speed up the move to SSH and TLS?
