---
title: Scanning in depth
summary: What each Nmap scan type asks a target, why the answers differ, how the Internet gets scanned in minutes, and what all of it looks like from the defender's chair.
level: intermediate
side: both
minutes: 50
attack: T1046, T1595.001, T1595.002
needs: 0022-scanning-with-nmap, 01-03-tcp-internals
pair: 07-02-ids-rule-writing, 09-05-osint-and-recon
source: Nmap Network Scanning, the official book | https://nmap.org/book/
words: idle scan, stateless scanning, NSE
---
Lesson 22 taught a method. This module explains the reasoning behind each probe. Every scan type is a different question, built on a specific detail of how TCP/IP stacks behave, so if you understand the stack, you can predict the result. You can also predict the trace it leaves.

@term stateless scanning = Scanning with no per-target state in memory, recognising replies by data encoded in the probe, which allows enormous speed.
@term idle scan = A scan that bounces probes off a third host and reads its IP ID counter, so the target sees the third host and not the scanner.

## Concept

### Fundamentals: each scan asks a different question

| Scan | Sends | Open | Closed | Needs |
|---|---|---|---|---|
| Connect, `-sT` | Full handshake | Connects | RST | No privileges |
| SYN, `-sS` | SYN, then RST | SYN-ACK | RST | Raw sockets |
| UDP, `-sU` | Protocol probe or empty | Reply, or silence | ICMP port unreachable | Patience |
| ACK, `-sA` | Bare ACK | RST | RST | Maps firewall rules, not services |
| FIN, NULL, Xmas | Odd flag combinations | Silence | RST | An RFC-following target |

The connect scan uses the operating system's `connect()` call, so it works without root, and applications may log it. A SYN scan never completes the handshake, so an application that logs only finished connections sees nothing. A firewall, IDS or `conntrack` still does.

UDP is slow and ambiguous because silence can mean open *or* filtered, and ICMP errors are usually rate limited. Good UDP scanning sends real protocol payloads, such as a DNS query to port 53, to provoke a reply.

ACK scans don't find open ports at all. Both open and closed ports answer RST, so the result separates *filtered* from *unfiltered*, which tells you where a stateless filter sits. The FIN, NULL and Xmas family rely on a rule in the original TCP specification: a closed port must reset, and an open port must ignore such a packet. Windows and some other stacks don't follow that, so a result can mislead you.

### Fingerprinting

`-sV` sends probes from a large database and matches the replies. `-O` sends carefully unusual TCP, UDP and ICMP packets, then compares details like initial window, TTL, options order and IP ID behaviour with known systems. Both are probabilistic. Treat the output as a lead to confirm.

### The scripting engine

**NSE** runs Lua scripts in categories such as `default`, `safe`, `discovery`, `vuln`, `intrusive` and `exploit`. The category matters. `-sC` runs only `default`. The `vuln` and `intrusive` categories can crash fragile services, so read a script before you run it, and never run them outside your scope.

### Timing

The templates `-T0` to `-T5` set timeouts and parallelism. Slower scans make less noise per minute, though they're not invisible, and a slow scan can still be spotted across a long time window. `--min-rate` and `--max-rate` set exact limits. Scanning too fast on a fragile network can take down old printers and OT devices, which is why OT scanning is usually passive.

### Advanced: scanning at Internet scale

**Masscan** and **ZMap** skip the operating system's TCP stack. They send packets at full speed, keep no per-target state, and recognise replies by a value encoded in the probe's own sequence number. [ZMap's authors](https://zmap.io/paper.pdf) showed in 2013 that one machine could scan the whole IPv4 space on one port in under an hour. This is why a new exposed service gets probed within minutes, and why services like Shodan and Censys exist.

Nmap's trade-off is that it's accurate and detailed, and comparatively slow. A common pattern is to find ports fast with Masscan or RustScan, then run `nmap -sV` on what came back.

**Idle scan** (`-sI`) is the elegant one. If a third host has a predictable IP ID counter, a scanner can spoof a SYN from it to the target, and later read how much that counter moved. An open port made the target reply to the third host, which sent back an RST and used up an ID. The target only ever sees the third host. Modern operating systems randomise IP IDs, which makes suitable hosts rare, though a printer or old device may still qualify.

?? An ACK scan reports a port as `unfiltered`. What do you now know?
+ Packets reach it, but open or closed is unknown
- A service is listening and has accepted the connection
- The port is closed as the host sent nothing
- The firewall has logged and blocked the probe packet
=> Open and closed ports both answer a bare ACK with RST. So the scan only tells you whether a firewall stopped the probe.

## Threat model

Reconnaissance is usually the first observable step.

| Activity | ATT&CK |
|---|---|
| Scanning from outside | [T1595.001](https://attack.mitre.org/techniques/T1595/001/) |
| Vulnerability scanning | [T1595.002](https://attack.mitre.org/techniques/T1595/002/) |
| Internal discovery after a foothold | [T1046](https://attack.mitre.org/techniques/T1046/) |

Treat these two very differently. Scans from the Internet are background noise, and they rarely justify a page. A scan from a *workstation inside your network* is a strong sign of compromise, because a person's laptop has no reason to sweep the server VLAN.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Nmap | Accurate scanning and fingerprinting | Almost always |
| Masscan | Very fast stateless port scans | Large ranges, your own estate |
| RustScan | Quick port finder that hands over to Nmap | Speeding up a single host |
| ZMap | Internet-wide research scanning | Research with ethics review |
| `ndiff` | Compares two Nmap XML results | Finding what changed since last week |
| Nessus, OpenVAS | Vulnerability scanners | Authenticated checks. See lesson 55 |

## Defence

**Reduce what can be found.** Scan yourself first and on a schedule, then compare results with `ndiff`. An open port that nobody can explain is a finding.

**Know each scan's trace.**

| Scan | Where it shows |
|---|---|
| Connect | Application logs, firewall logs |
| SYN | Firewall and IDS, half-open connections, not application logs |
| FIN, NULL, Xmas | IDS signatures: these flag sets don't occur naturally |
| `-sV` | Application errors from malformed probes |
| `-O` | IDS: unusual packet combinations |
| Slow scans | Only over a long window: count distinct ports per source per hour |

**Detect by count.** The core feature is one source touching many ports or hosts, with a high failure rate. Zeek's scan policy and Suricata rules do this, and writing your own is straightforward.

**Don't rely on obscurity.** Moving SSH to a strange port cuts log noise, which has real value, though `-p-` still finds it. Port knocking adds a little friction, and it's no substitute for strong authentication.

## Pitfalls

- **"SYN scans are stealth scans."** That name is a relic: any stateful firewall sees them.
- **"Filtered means safe."** It only means that you didn't get an answer from there, at that moment.
- **Scanning from one vantage point.** Results from inside and outside the firewall differ, and both matter.
- **Believing `-sV` without checking.** Backported patches keep old version strings, so scanners over-report.
- **Using `-T5` on a fragile network.** You can lose ports to timeouts and hurt devices.
- **Running `vuln` scripts on production.** Some are intrusive, despite how their name sounds.

?? Which single source is most worrying in your logs?
+ A finance laptop sweeping ports across the server VLAN
- An unknown address on the Internet probing port 443
- A known research scanner hitting your public mail gateway
- A cloud provider's health check reaching your load balancer
=> Internet scanning is constant background noise. An internal workstation scanning servers suggests a foothold and has a much better signal.

## Exercise

::: law Lab only
Scan only your own lab, or `scanme.nmap.org` gently, as Nmap's site allows. Scanning other systems without written permission can be illegal in many countries.
:::

1. Put a Linux VM and your Kali VM on a host-only network. Run `-sT` and `-sS` against the same port while capturing. Mark exactly where the two differ.
2. Add a firewall rule on the target that drops all traffic to one port, and rejects on another. Run `-sS` and `-sA`, and explain the four results.
3. Turn on `iptables` logging or Suricata on the target. Run `-T2` and `-T4`, then look at what your logs caught.
4. Scan the target twice with `-oX`, opening a new service between the runs. Use `ndiff` to show the change.
5. Write one detection: "one source touched more than 20 ports in 10 minutes". Express it as a query for your SIEM, then think about what normal traffic it would match by mistake.

?! Your boss asks how long it would take for an attacker to find a forgotten test server with a public IP. Answer with reasoning, and say what your company should do about it.

## Further reading

- [Nmap Network Scanning](https://nmap.org/book/), especially the chapters on scan methods and OS detection.
- [NSE usage and categories](https://nmap.org/book/nse-usage.html), to see what a category really does.
- Durumeric, Wustrow and Halderman, [ZMap: Fast Internet-wide Scanning](https://zmap.io/paper.pdf), USENIX Security 2013.
- [Masscan on GitHub](https://github.com/robertdavidgraham/masscan), including how its stateless design works.
- [Idle scanning explained](https://nmap.org/book/idlescan.html), from Nmap's book.
