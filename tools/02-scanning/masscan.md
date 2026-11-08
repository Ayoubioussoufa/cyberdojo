---
title: masscan
summary: Scans very large address ranges at high speed.
side: both
use: own
docs: https://github.com/robertdavidgraham/masscan
kali: masscan
alt: nmap, naabu
---
## What it's for
masscan scans huge ranges quickly. Researchers use it to measure the Internet, and large organisations use it to check their own address space.

## How it works
Nmap tracks each connection. masscan doesn't: it runs its own TCP/IP stack, sends SYN packets without keeping state, and encodes a check value in each packet's sequence number. When a reply arrives, that value proves it's genuine. Dropping per-connection state is what makes it so fast. It's less accurate at high rates, since packets get lost, and it doesn't do Nmap's detailed version detection.

## Try it
::: law Your ranges only
A high rate can knock over routers and get you reported. Start low, and only on your own network.
:::

```
sudo masscan 192.168.56.0/24 -p22,80,443 --rate 500
```

`--rate` is packets per second. Feed what you find into Nmap for detail.

## What defenders see
It looks like a very fast SYN scan, so flow logs show one source reaching a great many addresses. Rate limits and scan detection on the edge catch it. Its own stack can behave differently from the host's, which is a fingerprint worth knowing about.

?! How does masscan know a reply is genuine without storing a record of each probe?
