---
title: Cobalt Strike
summary: A commercial red-team tool whose cracked copies made it a favourite of real attackers.
side: both
use: know
docs: https://www.cobaltstrike.com/
aka: beacon
alt: sliver, sysmon
---
## What it's for
Cobalt Strike is a commercial adversary-emulation platform. Legitimate red teams buy it, but cracked versions have been so widely abused by criminals and state groups that it's one of the most important names in real-world intrusions. Every defender meets it in threat reports.

## How it works
Its agent is called Beacon. A Beacon checks in to its controller on a schedule, asks for tasks, and runs them, then goes quiet, which makes its traffic look periodic rather than constant. A "malleable" profile lets the operator shape that traffic to imitate ordinary web requests. Understanding this check-in-and-sleep rhythm, and the attempt to blend traffic in, is what helps you detect it.

## Practise safely
Study detection, not operation. Public rule sets and threat reports describe Beacon's patterns in detail. On a lab, [Atomic Red Team](/tools/atomic-red-team/) and emulation tools let you generate similar beaconing behaviour safely and confirm your monitoring sees it. The learning goal is to recognise regular check-ins, known default profiles, and the named pipes and injection patterns Beacon has used.

## What defenders see
Detect beaconing by its regularity: connections at steady intervals, even with jitter, stand out in network logs over time. Known malleable profiles, default certificates and JA3/JA3S TLS fingerprints have all been catalogued. Memory scanning with tools like YARA catches Beacon in RAM. [Command and control](/modules/06-02-command-and-control/) covers the wider detection picture.

?! Beacon sleeps between check-ins to look less like malware. Why does its regular rhythm still betray it over time?
