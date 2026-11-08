---
title: Empire, Covenant, Mythic and the C2 landscape
summary: The wider family of command-and-control frameworks defenders see named in reports.
side: both
use: know
docs: https://www.thec2matrix.com/
aka: poshc2, havoc, merlin
alt: cobalt-strike, sliver
---
## What it's for
Beyond the best-known tools sits a whole landscape of command-and-control frameworks: Empire, Covenant, Mythic, PoshC2, Havoc, Merlin and more. You don't need to operate them, but recognising the names and their shared ideas helps you read threat reports and design detection that isn't tied to one tool.

## How it works
They differ in language and style. Empire and PoshC2 grew from PowerShell; Covenant uses .NET; Mythic is a modular platform hosting many agents; Havoc and Merlin are newer. Yet they share a shape: an agent on the victim, a server for the operator, a channel between them, and a catalogue of post-exploitation actions. That shared shape is the key insight, because detection aimed at the behaviour covers tools you've never heard of.

## Practise safely
Study the common pattern rather than any one tool. The [C2 Matrix](https://www.thec2matrix.com/) compares them and is a good map of the field. On a lab, emulation tools reproduce the shared behaviours safely, so you can confirm your monitoring catches beaconing, injection and discovery regardless of the specific framework. Focus on what they have in common.

## What defenders see
Because the frameworks are many and change often, tie detection to behaviour: periodic check-ins, process injection, credential access and discovery sequences, all of which map to [ATT&CK](/modules/09-01-attack-models/). A detection built around a single tool ages badly; one built around the shared kill-chain behaviours endures. [Command and control](/modules/06-02-command-and-control/) develops this.

?! Why is detection aimed at shared behaviours more durable than detection aimed at one named framework?
