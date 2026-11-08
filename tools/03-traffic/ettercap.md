---
title: Ettercap
summary: A suite for man-in-the-middle tests on a local network.
side: attack
use: know
docs: https://www.ettercap-project.org/
kali: ettercap
alt: bettercap, arpspoof
---
## What it's for
Ettercap is a classic tool for intercepting traffic on a local network. It's a staple of older security courses. You'll meet its name in reports and on exam syllabuses, so it helps to know what it does.

## How it works
On a switched network, you only see your own traffic. Ettercap gets round this by abusing ARP, which has no authentication: it tells two hosts that it's the other one, so their traffic flows through it. Then it can read or alter what passes. [Layer 2 attacks](/modules/01-04-layer-2-attacks/) explains the flaw. It worked well when traffic was plain text, and TLS has reduced its value greatly.

## Practise safely
Build the defence instead. On a lab switch or a virtual network, turn on Dynamic ARP Inspection if it's available, or watch for a changed MAC address with Zeek or `arpwatch`. Practice with interception itself belongs on a legal training platform or in your own isolated lab.

## What defenders see
ARP replies nobody asked for, and one IP suddenly mapping to a new MAC, are the classic signs. Switch features such as Dynamic ARP Inspection and DHCP snooping block it. 802.1X keeps unknown devices off the network. TLS everywhere, with HSTS, means that even a successful interception reveals little.

?! Explain why TLS with proper certificate checks limits an attacker who has already won the ARP race.
