---
title: fping
summary: Pings many hosts at once and reports which ones answer.
side: both
use: own
docs: https://fping.org/
kali: fping
alt: nmap, arp-scan
---
## What it's for
`ping` tests one host at a time. fping tests a whole range and tells you what's alive, which suits monitoring scripts as well as quick checks.

## How it works
It sends ICMP echo requests in a round-robin across all targets, rather than waiting for each one to reply. So a dead host doesn't hold up the rest. It's built for scripts: `-a` lists only live hosts, and the exit code shows the result. Remember that many hosts drop ICMP, so no reply doesn't mean that a host is down.

## Try it
::: law Your network only
Sweep only your own ranges.
:::

```
fping -a -g 192.168.56.0/24 2>/dev/null
```

`-g` generates the range, and the redirect hides the unreachable messages.

## What defenders see
An ICMP sweep is easy to see in flow data: one source sends echo requests to each address in order. Monitoring systems do it legitimately, so allow-list them, then alert on the rest.

?! A host doesn't answer fping but serves web pages. How can that be?
