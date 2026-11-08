---
title: Memory forensics
summary: RAM holds what disks never see. Acquiring memory safely, how Volatility rebuilds processes and connections, and how to find injected code and hidden activity.
level: advanced
side: defence
minutes: 55
attack: T1055, T1014, T1620
needs: 0065-forensic-principles, 0030-how-operating-systems-work, 08-05-disk-forensics
pair: 08-09-anti-forensics-and-reporting, 06-07-rootkits-and-bootkits
source: Volatility 3 documentation | https://volatility3.readthedocs.io/
words: memory image, VAD, Volatility
---
Modern intrusions may never write a file to disk. The code runs from memory, and the network keys live only there. So does the decrypted command line, and the volume key of an encrypted disk. Memory is the one place where a running system can't fully hide what it's doing, as long as you capture it before the power goes.

@term memory image = A copy of a system's physical RAM, saved for analysis.
@term VAD (virtual address descriptor) = A Windows kernel structure that describes one region of a process's memory.
@term DKOM (direct kernel object manipulation) = Hiding things by directly changing kernel data structures.

## Concept

### Fundamentals: order of volatility

Lesson 65 taught the rule: collect what vanishes first. RAM comes before disk, so **don't pull the plug until you've imaged memory**, if you can. Capture changes the system a little, as the tool itself must run. Accept that, and document it.

| Tool | Target |
|---|---|
| WinPmem, Magnet RAM Capture, DumpIt | Windows |
| LiME, AVML | Linux |
| Hypervisor snapshot | VMs, with no agent inside |

Virtual machines are the best case: a snapshot captures memory without touching the guest. On a live host, acquisition isn't atomic, so memory changes during capture, which is called *smear*, and it can produce small inconsistencies.

### How analysis works

An image is just a big file of bytes. To read it, Volatility needs to know how the OS arranged its data. It finds the kernel, loads **symbols** for that exact build, then follows pointers just as the kernel would. That recovers structures such as process lists and network tables, without running anything from the image.

Typical first steps with Volatility 3:

| Plugin | Answers |
|---|---|
| `windows.info` | Which OS and build is this? |
| `windows.pslist`, `pstree` | What was running, and who started it? |
| `windows.psscan` | Are there any processes hidden or already ended? |
| `windows.cmdline` | What were the arguments? |
| `windows.netscan` | What connections and listeners existed? |
| `windows.dlllist` | Which libraries were loaded? |
| `windows.malfind` | Where is suspicious executable memory? |
| `windows.handles` | What was open? |

### Reading a process tree

Windows has a known family structure, which lesson 31 touched on. `services.exe` starts `svchost.exe`. `lsass.exe` has one instance, started by `wininit.exe`. Anything else is suspicious: `svchost.exe` started by `explorer.exe`, or two copies of `lsass.exe`, or `lsass.exe` with a misspelt name. Attackers rely on analysts not looking closely. [SANS's Hunt Evil poster](https://www.sans.org/posters/hunt-evil/) lists normal parents, paths and counts.

### Advanced: finding what's hiding

**Two views of processes.** `pslist` walks the kernel's linked list. `psscan` searches memory for the signature of a process structure. A **DKOM** rootkit unlinks a process from the list, so it vanishes from Task Manager and `pslist`, while `psscan` still sees it. Ended processes also linger in `psscan`.

**Injected code.** A normal process maps code from files. So executable memory with no backing file is suspicious. `malfind` scans **VADs** for regions marked executable and writable, and which hold code or a PE header. Hollowing leaves a mismatch between the image in memory and the file on disk. False positives are common, because .NET and JIT compilers legitimately do this, so check the context.

**Reflective loading** ([T1620](https://attack.mitre.org/techniques/T1620/)) puts a whole library in memory with no file, and so never appears in the normal module list. Comparing module lists from different kernel structures helps here.

**Secrets.** Memory can hold passwords, tokens, chat, decrypted documents and disk encryption keys, so a memory image is highly sensitive. Handle it accordingly.

**Compressed and paged memory.** Some of a process lives in `pagefile.sys`, and modern Windows compresses memory, so an image may be incomplete. Capture the pagefile as well if you can.

?? Why compare `pslist` with `psscan` output?
+ Hidden processes may appear in only one
- Each plugin needs a different operating system
- The second plugin decrypts the whole dump
- Only one plugin can read process names
=> One walks a list that rootkits can unlink, while the other scans raw memory for structures, so a difference is worth explaining.

## Threat model

| Technique | ATT&CK |
|---|---|
| Process injection | [T1055](https://attack.mitre.org/techniques/T1055/) |
| Rootkits | [T1014](https://attack.mitre.org/techniques/T1014/) |
| Reflective code loading | [T1620](https://attack.mitre.org/techniques/T1620/) |

Attackers run from memory in order to avoid disk scanning, and that's what makes this discipline necessary. They can also interfere: some rootkits tamper with acquisition tools or hide their memory, so acquiring from a hypervisor is more trustworthy.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Volatility 3 | Framework for memory analysis | The standard |
| MemProcFS | Mounts memory as a filesystem | Browsing quickly |
| WinPmem, AVML, LiME | Acquisition | Capturing RAM |
| YARA | Scans memory for patterns | Finding known families |
| Velociraptor | Remote collection at scale | Fleet-wide triage |
| `strings` | Finds text in an image | A quick first look |

## Defence

- **Prepare.** Pre-test acquisition tools on each OS, and store them on trusted media.
- **Use EDR memory scanning**, which catches injection during the attack.
- **Keep a process baseline** of normal parent-child pairs.
- **Enable crash dumps**, and protect those, as they contain secrets.
- **Practise,** because a memory capture under pressure is a bad time to learn. Add it to your [tabletop](/modules/08-04-tabletop-exercises/).
- **Encrypt and control** images, since they hold credentials.

## Pitfalls

- **Rebooting before you capture.** Everything's lost.
- **Running tools from the suspect disk.** That changes evidence, and those tools may be compromised.
- **Taking `malfind` hits as proof.** JIT engines look the same.
- **Mismatched symbols.** The wrong profile yields garbage that looks like evidence.
- **Trusting a single plugin.** Corroborate across several, and with disk and log evidence.

?? Why acquire memory before shutting a machine down?
+ Running code and keys vanish at shutdown
- The disk gets encrypted on every restart
- Windows wipes all its logs at shutdown
- Memory images need the network to work
=> RAM loses its contents when power goes, along with running code and encryption keys that may exist nowhere else.

## Exercise

::: law Lab only
Capture memory only from your own VMs, and use public training images. Memory holds passwords and private data, so don't share images that you made on a real machine.
:::

1. Download a sample image from [Volatility's memory samples](https://github.com/volatilityfoundation/volatility/wiki/Memory-Samples), and verify it.
2. Run `windows.info`, `pslist`, `pstree`. Draw the process tree, and mark anything that breaks the normal family.
3. Compare `pslist` and `psscan`. Explain any difference.
4. Run `netscan` and `cmdline`. Tie one network connection to a process, then to a command line.
5. On your own Windows VM, take a snapshot, and analyse a clean baseline. Note which `malfind` hits appear on a clean machine.

?! You've got a live server, a suspected intruder, and the business wants it rebooted now. Write what you'd capture in the next ten minutes, in order, and how you'd explain the delay.

## Further reading

- [Volatility 3 documentation](https://volatility3.readthedocs.io/).
- Ligh, Case, Levy and Walters, *The Art of Memory Forensics*.
- [SANS Hunt Evil poster](https://www.sans.org/posters/hunt-evil/).
- [MemProcFS](https://github.com/ufrisk/MemProcFS).
- [ATT&CK T1055, Process Injection](https://attack.mitre.org/techniques/T1055/).
