---
title: Digital forensics
summary: Order of volatility, acquisition and integrity, Windows artifacts, memory analysis and timelines, with fact kept apart from inference.
month: 15
minutes: 60
builds: a defensible timeline that separates fact from inference
source: SANS DFIR posters | https://www.sans.org/posters/
words: order of volatility, artifact, timeline
---
"What exactly happened on this machine?" Forensics answers from evidence, in a way that survives scrutiny. The discipline is as important as the tools, because a clever conclusion that nobody can verify is worthless.

@term digital forensics = Collecting and analysing digital evidence in a way that can be defended.
@term order of volatility = Collecting the most short-lived evidence first.
@term forensic image = An exact copy of a disk or memory.
@term artifact = A trace left on a system by some activity.
@term Prefetch = A Windows feature that records when programs ran.
@term MFT (master file table) = The NTFS table recording every file on a volume.
@term Volatility = An open-source framework for analysing memory images.
@term super-timeline = One timeline combining many artifact sources.
@term write blocker = A device or setting that lets you read a disk without being able to change it.
@term Plaso = A tool that extracts timestamps from many artifact types into one timeline.

## The principles

**Order of volatility.** Memory disappears fastest, so collect it before disk. [RFC 3227](https://www.rfc-editor.org/rfc/rfc3227) gives the classic guidance.

@flow CPU and memory > Network state > Running processes > Disk > Backups

**Integrity.** Work on copies, and hash the evidence at collection and again later. Matching hashes prove nothing changed. A **write blocker** lets you image a disk without writing a single byte to it.

**Documentation.** Record every step, so that someone else could reproduce it. If you make a mistake, write that down as well. An honest note about an error damages your case far less than an unexplained gap that someone finds later under questioning.

@drill volatility

?? Why take a hash of a forensic image straight after collecting it?
+ To prove later that it hasn't changed
- To encrypt the evidence against any attacker
- To shrink the image for easier storage
- To recover files that have been deleted
=> A matching hash shows integrity. It's the backbone of chain of custody.

## Windows artifacts

An **artifact** is a footprint. Windows keeps many of these to work faster or stay convenient, and each answers a different question.

| Artifact | Answers | Watch out |
|---|---|---|
| Prefetch | Did a program run, and when? | Often off on servers |
| Amcache, Shimcache | Was this program present? | Presence doesn't always prove execution |
| LNK files, Jump Lists | Which files did a user open? | Survive after the file is deleted |
| ShellBags | Which folders did a user browse? | Per user |
| SRUM | How much network and CPU did it use? | Kept for about a month |
| `$MFT`, `$UsnJrnl` | When was a file created or changed? | Timestamps can be faked |
| Event logs | Logons, services, changes | Can be cleared (event 1102) |

[13Cubed](https://www.youtube.com/@13Cubed) teaches these superbly, and [Eric Zimmerman's tools](https://ericzimmerman.github.io/) parse them.

?? You want to prove that `tool.exe` ran on a workstation. Which artifact is the strongest start?
+ Prefetch, since it records program execution there
- ShellBags, since they list folders users browsed
- DNS logs, since they list domains resolved
- SRUM, since it only stores file contents
=> Prefetch is designed around program launches. Confirm with a second source, because good findings rest on more than one artifact.

## Memory

[Volatility 3](https://volatilityfoundation.org/) reads a memory image, so you examine a copy of what the machine was doing. Memory can show what never touched the disk.

| Plugin | Shows |
|---|---|
| `windows.pslist` | Running processes |
| `windows.pstree` | Who started whom |
| `windows.cmdline` | Each process's command line |
| `windows.netscan` | Network connections |
| `windows.malfind` | Memory that looks like injected code |

A classic finding is **process injection**: `notepad.exe` holding executable memory that isn't backed by a file, and connecting to the internet. Notepad has no reason to do that. `malfind` gives candidates, not verdicts, so you still have to examine what it finds.

?? `windows.malfind` flags a region inside a browser process. What's the right conclusion?
+ A candidate, which needs further examination first
- Certain proof that malware infected the browser
- The memory image is corrupt, so stop
- Nothing, because browsers can't contain injected code
=> Browsers legitimately generate code at runtime. A tool's hit is a lead, and your analysis is what makes it a finding.

## Timelines, and honest language

Put everything on one timeline, in UTC. **Plaso** builds a **super-timeline** from many sources. Then write carefully:

| Fact | Inference |
|---|---|
| "The log shows a 03:14 logon as `svc_web`" | "The attacker probably used a stolen password" |

Mark each clearly. Conclusions that blur them don't survive review.

@drill fact-inference

?? Which sentence is written as a fact?
+ Event 4624 records a `sam` logon at 03:14
- Sam's stolen password was used by the hacker
- The attacker clearly wanted to reach finance staff
- Sam must have clicked on the phishing link
=> It says what a source shows, and no more. The others add a cause or a motive that the evidence doesn't state.

## Work from evidence

@range forensics

::: try Practise
Work through [CyberDefenders](https://cyberdefenders.org/) labs and [NIST CFReDS](https://cfreds.nist.gov/) images, then write [P11](/projects/P11/).
:::

?! Rewrite this with fact and inference separated: "The hacker logged in at 3am with Sam's stolen password and ran a script."
