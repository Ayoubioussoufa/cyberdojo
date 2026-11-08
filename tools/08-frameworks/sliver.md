---
title: Sliver
summary: An open-source command-and-control framework that attackers increasingly adopt.
side: both
use: know
docs: https://sliver.sh/docs
alt: cobalt-strike, metasploit
---
## What it's for
Sliver, from Bishop Fox, is an open-source command-and-control framework. As Cobalt Strike became more heavily detected and its cracked copies more risky to use, criminal and red-team operators alike turned to open tools like Sliver, so it now appears regularly in intrusions. ATT&CK tracks it.

## How it works
Its agents, called implants, support several channels to reach their controller: HTTPS, DNS and others. Operators generate a unique implant per campaign, which changes its fingerprint and defeats simple hash-based detection. So defenders lean on behaviour, the check-in rhythm and the destinations, rather than on a fixed signature, which is the general truth for all modern C2.

## Practise safely
Study its behaviour from the defensive side. Public analyses describe its default traffic and the artifacts its implants leave. Emulation on a lab, with tools such as [CALDERA](/tools/caldera/), lets you produce comparable C2 behaviour safely and test whether your network and endpoint monitoring catch it. The goal is to recognise beaconing and unusual DNS or HTTPS patterns, not to run the framework against anything.

## What defenders see
The detections mirror those for other C2: periodic check-ins, rare destinations, DNS used as a transport, and TLS fingerprints. Because implants are unique per build, behavioural and anomaly detection matter more than file signatures. Egress filtering, DNS monitoring and TLS inspection where lawful all help, as [command and control](/modules/06-02-command-and-control/) explains.

?! If each Sliver implant is unique, why does file-hash detection fail, and what kind of detection works instead?
