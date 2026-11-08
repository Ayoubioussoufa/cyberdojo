---
title: Responder
summary: Answers broadcast name requests to capture credentials; the clearest case for turning off old protocols.
side: both
use: know
docs: https://github.com/lgandx/Responder
kali: responder
alt: netexec, wireshark
---
## What it's for

Responder is a well-known tool in internal assessments, and the reason to study it is defensive: it exploits old Windows name-resolution protocols that should be switched off. Understanding what it does is the clearest argument for disabling them. ATT&CK records it in real intrusions.

## How it works

When a Windows machine can't resolve a name through DNS, it has historically fallen back to broadcast protocols, LLMNR and NBT-NS, that ask the whole local network "does anyone know this name?" These have no authentication, so any machine can answer. Responder answers, and in doing so can capture authentication material that the asking machine offers. The root problem is the trusting, unauthenticated fallback, not the tool.

## Practise safely

On a lab network with monitoring, observe the broadcast name-resolution traffic that these protocols generate, so you understand why it's risky. Then the exercise is to disable LLMNR and NBT-NS by policy on a test machine and confirm, by watching the network, that the broadcasts stop. That change alone removes the whole class of problem.

## What defenders see

Disable LLMNR and NBT-NS across the estate, which is a standard hardening step. Where they can't be removed, network monitoring can detect a host answering many name requests, a strong sign of this activity. Enforcing SMB signing and moving fully to authenticated DNS further closes the gap. [LAN and legacy protocols](/modules/01-08-lan-and-legacy-protocols/) explains the underlying weakness.

?! Why is disabling LLMNR and NBT-NS a more complete fix than trying to detect a tool that abuses them?
