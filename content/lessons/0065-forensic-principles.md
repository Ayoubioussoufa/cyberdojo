---
title: Digital forensics
summary: Order of volatility, evidence integrity, Windows artifacts, memory and timelines, with fact kept apart from inference.
month: 15
minutes: 45
builds: a defensible timeline that separates fact from inference
source: SANS DFIR posters | https://www.sans.org/posters/
words: order of volatility, artifact, timeline
---
"What exactly happened on this machine?" Forensics answers from evidence, in a way that survives scrutiny. The discipline is as important as the tools.

@term digital forensics = Collecting and analysing digital evidence in a way that can be defended.
@term order of volatility = Collecting the most short-lived evidence first.
@term forensic image = An exact copy of a disk or memory.
@term artifact = A trace left on a system by some activity.
@term Prefetch = A Windows feature that records when programs ran.
@term MFT (master file table) = The NTFS table recording every file on a volume.
@term Volatility = An open-source framework for analysing memory images.
@term super-timeline = One timeline combining many artifact sources.

## The principles

**Order of volatility.** Memory disappears fastest, so collect it before disk. [RFC 3227](https://www.rfc-editor.org/rfc/rfc3227) gives the classic guidance.

@flow CPU and memory > Network state > Running processes > Disk > Backups

**Integrity.** Work on copies, and hash the evidence at collection and again later. Matching hashes prove nothing changed.

**Documentation.** Record every step, so that someone else could reproduce it.

?? Why take a hash of a forensic image straight after collecting it?
+ To prove later that it hasn't changed
- To encrypt the evidence against any attacker
- To shrink the image for easier storage
- To recover files that have been deleted
=> A matching hash shows integrity. It's the backbone of chain of custody.

## Windows artifacts

| Artifact | Shows |
|---|---|
| Prefetch | A program ran, and when |
| Amcache, Shimcache | Programs present or executed |
| LNK files, Jump Lists | Files a user opened |
| ShellBags | Folders a user browsed |
| SRUM | Resource use over time |
| `$MFT`, `$UsnJrnl` | File creation and changes |
| Event logs | Logons, services, changes |

[13Cubed](https://www.youtube.com/@13Cubed) teaches these superbly, and [Eric Zimmerman's tools](https://ericzimmerman.github.io/) parse them.

## Memory

[Volatility 3](https://volatilityfoundation.org/) reads a memory image and lists processes, network connections and signs of injected code. Memory can show what never touched the disk.

## Timelines, and honest language

Put everything on one timeline, in UTC. Then write carefully:

| Fact | Inference |
|---|---|
| "The log shows a 03:14 logon as `svc_web`" | "The attacker probably used a stolen password" |

Mark each clearly. Conclusions that blur them don't survive review.

::: try Practise
Work through [CyberDefenders](https://cyberdefenders.org/) labs and [NIST CFReDS](https://cfreds.nist.gov/) images, then write [P11](/projects/P11/).
:::

?! Rewrite this with fact and inference separated: "The hacker logged in at 3am with Sam's stolen password and ran a script."
