---
title: Sysmon event IDs
summary: Every Sysmon event ID, with the ones that matter most for detection marked.
source: Microsoft Sysinternals, Sysmon | https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon
---
## Processes

| ID | Event | Use it to spot |
|---|---|---|
| **1** | Process creation | Parent, command line, hashes. The most useful one |
| 2 | A process changed a file creation time | Timestomping |
| 5 | Process terminated | Process lifetime |
| **8** | CreateRemoteThread | Process injection |
| **10** | ProcessAccess | Reading `lsass.exe` memory |
| 25 | ProcessTampering (Process image change) | Process hollowing |

## Network and DNS

| ID | Event | Use it to spot |
|---|---|---|
| **3** | Network connection | Which program connected out |
| **22** | DNSEvent (DNS query) | Which program looked up a name |

## Drivers and modules

| ID | Event | Use it to spot |
|---|---|---|
| 6 | Driver loaded | Vulnerable or unsigned drivers |
| 7 | Image loaded | DLL side-loading |

## Files

| ID | Event | Use it to spot |
|---|---|---|
| 9 | RawAccessRead | Reading a disk directly |
| **11** | FileCreate | Dropped payloads |
| 15 | FileCreateStreamHash | Hidden streams, download marks |
| 23 | FileDelete (File Delete archived) | Deleted tools, saved for you |
| 26 | FileDeleteDetected (File Delete logged) | Deletions, without saving a copy |
| 27 | FileBlockExecutable | Blocked executable writes |
| 28 | FileBlockShredding | Blocked secure deletion |
| 29 | FileExecutableDetected | New executables written |

## Registry

| ID | Event | Use it to spot |
|---|---|---|
| 12 | RegistryEvent (Object create and delete) | Run keys created |
| **13** | RegistryEvent (Value Set) | Persistence values |
| 14 | RegistryEvent (Key and Value Rename) | Hiding changes |

## Pipes and WMI

| ID | Event | Use it to spot |
|---|---|---|
| 17 | PipeEvent (Pipe Created) | Named pipes used by C2 tools |
| 18 | PipeEvent (Pipe Connected) | Movement through pipes |
| 19 | WmiEvent (WmiEventFilter activity detected) | WMI persistence |
| 20 | WmiEvent (WmiEventConsumer activity detected) | WMI persistence |
| 21 | WmiEvent (WmiEventConsumerToFilter activity detected) | WMI persistence |

## Sysmon itself

| ID | Event | Use it to spot |
|---|---|---|
| 4 | Sysmon service state changed | Someone stopping Sysmon |
| 16 | ServiceConfigurationChange | Changes to Sysmon's configuration |
| 24 | ClipboardChange (New content in the clipboard) | Clipboard theft |
| 255 | Error | Problems inside Sysmon |

## What to remember

| Question | Event |
|---|---|
| What ran, and who started it? | 1 |
| What connected out? | 3 |
| What looked up that domain? | 22 |
| Who touched LSASS? | 10 |
| What was injected into? | 8 |
| What file was dropped? | 11 |
| What survives a reboot? | 13 |

Sysmon needs a good configuration, or it's far too noisy. Start from [SwiftOnSecurity's](https://github.com/SwiftOnSecurity/sysmon-config) or [Olaf Hartong's](https://github.com/olafhartong/sysmon-modular).
