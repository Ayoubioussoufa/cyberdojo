---
title: Scanning with Nmap
summary: Discover hosts and services the way an attacker does, and read the results like a defender.
month: 3
minutes: 35
builds: an Nmap report of your own lab explaining every open port
source: Nmap Network Scanning, the official book, free online | https://nmap.org/book/
words: port scan, service detection, enumeration
---
Before attacking anything, an attacker asks: what's there? Nmap is the tool that answers, and every defender should run it against their own network first.

@term Nmap = A free tool that discovers hosts and services on a network.
@term port scan = Probing a machine's ports to find which are open.
@term enumeration = Actively collecting details about a target's hosts, services and users.
@term banner = Text that a service sends identifying itself, often including a version.
@term NSE (Nmap Scripting Engine) = Nmap's scripts for extra checks against a service.

::: law
Scanning is the first step of an attack, and scanning systems you don't own can get you into real trouble. Scan your own lab, or the host Nmap itself [provides for testing](https://nmap.org/book/man-target-specification.html), `scanme.nmap.org`, gently. Note that Kali should be on your host-only network here.
:::

## How scanning works

It's the TCP handshake from lesson 18, used as a question.

| You send | Reply | Nmap says |
|---|---|---|
| SYN | SYN-ACK | **open**: a service is listening |
| SYN | RST | **closed**: host up, nothing listening |
| SYN | Nothing, or ICMP unreachable | **filtered**: a firewall is probably in the way |

The default scan as root, `-sS`, is a **SYN scan**: on SYN-ACK, Nmap sends RST instead of finishing the handshake. It's fast. It's also still visible to any decent monitoring.

?? In a SYN scan, what does a closed port send back?
+ RST, which means that nothing's listening there
- SYN-ACK, which means that a service answered
- Nothing, because closed ports stay totally silent
- FIN, which means the service has finished
=> A closed port answers RST. Silence usually means that a firewall dropped the probe.

## A method, not a command

```
nmap -sn 192.168.56.0/24                   1. Which hosts are up?
nmap -p- 192.168.56.10                     2. All 65,535 TCP ports on one host
nmap -sV -sC -p 22,80,443 192.168.56.10    3. What exactly is on those ports?
nmap -sU --top-ports 20 192.168.56.10      4. Don't forget UDP (slow)
nmap -oA scan1 192.168.56.10               Save all output formats
```

| Option | Meaning |
|---|---|
| `-sn` | Host discovery only |
| `-p-` | All TCP ports. By default Nmap scans only the 1,000 most common |
| `-sV` | Detect service versions |
| `-sC` | Run default NSE scripts |
| `-sU` | UDP scan |
| `-O` | Guess the operating system |
| `-oA name` | Save results in all formats |

::: trap Scan all the ports
By default Nmap tests the top 1,000 ports. A service on port 8443 or 31337 may be missed. Always use `-p-` on hosts that matter.
:::

?? A scan shows port 22 `filtered`. What's the best reading?
+ Something, probably a firewall, is dropping the probes
- SSH is running with its original default password
- The host is definitely turned off right now
- A service is listening and accepted the connection
=> Filtered means Nmap got no useful reply. An open port would answer with SYN-ACK and a closed one with RST.

## Reading the results

```
PORT     STATE  SERVICE VERSION
22/tcp   open   ssh     OpenSSH 9.6p1 Ubuntu
80/tcp   open   http    nginx 1.24.0
3306/tcp open   mysql   MySQL 8.0.36
```

A defender asks three questions about each line:

1. **Should this port be open at all?** A database reachable from the network is a finding.
2. **Who needs to reach it?** Could a firewall limit it?
3. **Is the version current?** Old versions may have known vulnerabilities.

That's your exit-gate deliverable: a report that explains each open port and whether it should exist.

?? Your scan finds MySQL open on a web server, reachable from the staff network. What's the best recommendation?
+ Bind it to localhost, or firewall it very tightly
- Change MySQL to listen on a random high port
- Leave it, since a strong password fixes everything here
- Add a new banner so attackers misread the version
=> Reduce the attack surface. A database should only be reachable by what needs it. Moving the port only hides it from a default scan.

## What a defender sees

Run a scan while watching with Wireshark or your IDS. A port scan is a single source touching many ports in a short time, and it's loud. That connects to the next lesson.

@drill ports

?! Scan your Ubuntu VM. Paste the result and, for each port, answer: should it be open, and why?

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [Nmap reference guide (the man page, online)](https://nmap.org/book/man.html)
- [Nmap book: port scanning techniques](https://nmap.org/book/man-port-scanning-techniques.html)
