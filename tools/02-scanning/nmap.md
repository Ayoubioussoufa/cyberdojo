---
title: Nmap
summary: Finds live hosts, open ports, services and versions.
side: both
use: own
docs: https://nmap.org/book/man.html
kali: nmap
alt: masscan, rustscan, naabu
---
## What it's for
Nmap is the standard network scanner. Administrators use it to check what's really exposed, and testers use it to map a network. If you learn one tool in this list, learn this one.

## How it works
A port scan sends crafted packets and reads the replies. In a SYN scan, an open port answers SYN-ACK, a closed port answers RST, and silence usually means a firewall. Nmap never finishes the handshake, so it needs raw sockets, and that's why it wants root. Version detection then connects and compares replies with a large database of probes. The Nmap Scripting Engine adds Lua scripts for deeper checks. [Scanning in depth](/modules/01-07-scanning-in-depth/) covers each type.

## Try it
::: law Your lab only
Scan your own network or `scanme.nmap.org`, which allows light use. Scanning others without permission can break the law and your provider's terms.
:::

```
sudo nmap -sS -sV -p 1-1000 192.168.56.10
sudo nmap -sn 192.168.56.0/24
sudo nmap -sV --script=default -oA lab 192.168.56.10
```

`-sn` finds hosts without port scanning, and `-oA` saves results in three formats. Compare what you find with what the host should expose.

## What defenders see
Firewalls and IDS rules see one source touching many ports, often with half-open connections. Suricata and Zeek both flag it. A scan on its own is low severity, but one from inside your network deserves a look, since a laptop has no reason to scan its neighbours.

?! A SYN scan reports a port as `filtered`. What did Nmap see, and what could be causing it?
