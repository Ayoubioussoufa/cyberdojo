---
title: Digital forensics
summary: Order of volatility, acquisition and integrity, Windows artifacts, memory analysis and timelines, with fact kept apart from inference.
month: 15
minutes: 85
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

## Making the copy

Memory comes first, then the disk, and each needs its own tool:

| What | Common tools | What you get |
|---|---|---|
| Memory, on Windows | [WinPmem](https://github.com/Velocidex/WinPmem), DumpIt | A raw file the size of the RAM |
| Memory, on Linux | [AVML](https://github.com/microsoft/avml), LiME | The same |
| A disk | FTK Imager, `ewfacquire`, or `dd` behind a write blocker | A raw image, or an E01 file |

On Linux, a raw disk image takes two commands, run against a disk attached through a write blocker:

```
sudo dd if=/dev/sdb of=disk.img bs=4M conv=noerror,sync status=progress
sudo sha256sum /dev/sdb disk.img
```

`if` is the input, the evidence disk, and `of` is the output file. `conv=noerror,sync` keeps going past sectors that can't be read and fills them with zeros, so the image keeps its size and every later byte stays at its right offset. The second line hashes the disk and the copy, and the two hashes should match. On a failing disk they won't, because of those zero-filled sectors. That's no reason to hide anything: write down which sectors failed and why the hashes differ, and keep the imaging log.

The **E01** format, also called the Expert Witness Format, does the same job with more care. It compresses the image and stores the hash and the case notes inside the file, which is why most forensic suites prefer it.

?? You image a failing disk, and the image's hash doesn't match the disk's. What do you do?
+ Note the unreadable sectors and explain the gap
- Image it again until both hashes finally match
- Remove the hash from the final report quietly
- Treat the whole image as worthless and stop
=> A difference you can explain is fine. An explanation left out of the report is what destroys trust in everything else in it.

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

The event logs answer the most questions, and a handful of IDs cover most investigations:

| Event ID | Log | Means |
|---|---|---|
| 4624 | Security | A successful logon. Its logon type says how: 2 at the keyboard, 3 over the network, 10 by Remote Desktop |
| 4625 | Security | A failed logon |
| 4688 | Security | A process was created, if process auditing is turned on |
| 7045 | System | A new service was installed |
| 1102 | Security | The audit log was cleared |

Every file on NTFS has two sets of timestamps in the MFT. `$STANDARD_INFORMATION` holds the four that Explorer shows: modified, accessed, changed (the MFT entry itself) and born, often written **MACB**. `$FILE_NAME` holds another four, which ordinary programs can't set directly. Tools that fake a file's dates, which is called **timestomping**, usually change only the first set. So a file whose `$STANDARD_INFORMATION` creation time is earlier than its `$FILE_NAME` creation time deserves a closer look. So does a time whose fraction is exactly zero, because NTFS counts in steps of 100 nanoseconds, and real files rarely land on a whole second.

@code timestomp-check

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

Running them takes one command each:

```
vol -f memory.raw windows.pstree
vol -f memory.raw windows.malfind --pid 4012
```

A process tree is easier to read once you know what a healthy one looks like. The [SANS Hunt Evil poster](https://www.sans.org/posters/hunt-evil/) lists the normal parents, and these are the ones most worth remembering:

| Process | Its normal parent | How many |
|---|---|---|
| `wininit.exe` | `smss.exe`, which has exited, so no parent is shown | One |
| `services.exe` | `wininit.exe` | One |
| `lsass.exe` | `wininit.exe` | One |
| `svchost.exe` | `services.exe` | Many |

An `svchost.exe` started by anything other than `services.exe`, or a second `lsass.exe`, is a classic sign of malware hiding under a familiar name.

@code process-tree

A classic finding is **process injection**: `notepad.exe` holding executable memory that isn't backed by a file, and connecting to the internet. Notepad has no reason to do that. `malfind` gives candidates, not verdicts, so you still have to examine what it finds.

`malfind` reports memory that is both writable and executable, and isn't backed by a file on disk. That's how injected code tends to look. It's also how a browser's JavaScript engine looks, because it writes code while it runs. One sign is stronger than the rest: a region that starts with `MZ`, the first two bytes of every Windows program, means a whole executable was loaded straight into memory, and no browser needs to do that.

@code injection-candidates

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

A super-timeline from a single laptop can hold millions of rows, so nobody reads it from the top. You **pivot** instead: take one moment you trust, such as the alert or the first malicious logon, and read everything a few minutes either side of it. Each new finding gives you another moment to pivot from.

@code timeline-window

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

## Review a report

A colleague's draft report has three lines that need to change before it goes out.

```
1. We connected the laptop's disk to an analysis PC and browsed it in Explorer.
2. Prefetch shows MIMIKATZ.EXE ran at 03:16, so every domain password was stolen.
3. All times in this report are local times.
```

?? What did step 1 put at risk?
+ The evidence, since nothing stopped Windows writing to it
- The timestamps, since Explorer converts them all to UTC
- Nothing at all, since Explorer never changes any files
- The report, since Explorer hides all the system files
=> Windows can write to any volume it mounts, for example to update timestamps or create its own system folders. A write blocker, or working only on an image, keeps the original unchanged.

?? What's wrong with line 2?
+ One fact is stretched into a much larger claim
- Prefetch never records the time when a program ran
- Program names in Prefetch files are always lower case
- Mimikatz simply cannot ever run on a domain computer
=> The fact is that a program with that name ran at 03:16. What it did, which accounts it reached, and whether anything left the machine all need more evidence, and the report should say so.

?? Why does line 3 need changing?
+ Local times without a zone can't be matched up
- Courts only ever accept times written as Unix numbers
- Local time is always exactly one hour behind UTC
- Good reports should never contain any times at all
=> With no named time zone, and with daylight saving in play, nobody can line these times up with firewall or cloud logs. Write UTC, as in lesson 59.

?! Rewrite this with fact and inference separated: "The hacker logged in at 3am with Sam's stolen password and ran a script."
