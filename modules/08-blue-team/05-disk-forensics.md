---
title: Disk forensics
summary: Reconstructing what happened from a disk image. NTFS internals, timestamps that lie, deleted files, the Sleuth Kit and Autopsy, and working so that your findings stand up.
level: intermediate
side: defence
minutes: 55
attack: T1070.004, T1070.006
needs: 0065-forensic-principles
pair: 08-09-anti-forensics-and-reporting
source: NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response | https://csrc.nist.gov/pubs/sp/800/86/final
words: file carving, $MFT, timestomping
---
Lesson 65 and project P11 used forensic tools. This module explains what those tools are reading. An NTFS volume keeps far more history than most people realise, including traces of files that no longer exist. Once you understand where that history lives, you can also tell when someone has tampered with it.

@term file carving = Recovering files from raw disk data by recognising their headers, with no help from the filesystem.
@term file slack = The unused space at the end of a file's last cluster, which can still hold old data.
@term timestomping = Altering a file's timestamps to hide when it really appeared.
@term USN Journal = An NTFS log of file changes, recording what changed and when.

## Concept

### Fundamentals: work on a copy

Never analyse the original. Make a bit-for-bit image with a write blocker, hash both, and record the chain of custody, as in lesson 65. Everything that follows happens on a copy, so that anyone can repeat your work and get the same result. An image captures everything, including deleted data and unallocated space. A logical copy doesn't.

Think of a disk in layers, and of the tools that read each one.

| Layer | Holds | Tool |
|---|---|---|
| Physical | Sectors | `xxd`, `dd` |
| Partition | MBR, GPT | `mmls` |
| Filesystem | Metadata structures | `fsstat`, `fls` |
| File | Content | `icat`, carvers |
| Application | Artifacts | Registry tools, browser parsers |

### NTFS and the MFT

On NTFS, everything is a file, including the metadata. The **$MFT** (Master File Table) has one record per file, usually 1 KB, made of attributes. Small files live inside the record itself, which is called *resident* data.

Two attributes hold timestamps:

| Attribute | Updated by | Notes |
|---|---|---|
| `$STANDARD_INFORMATION` | Windows and user-mode programs | What Explorer shows, and easy to change |
| `$FILE_NAME` | The NTFS driver | Hard to change from user mode |

Each stores four times: Modified, Accessed, Changed (MFT record), and Born. This is **MACB**. If `$SI` created time is earlier than `$FN` created time, that's a classic sign of **timestomping**, though legitimate copies and installers can produce odd patterns too.

### Deleted, not gone

Deleting a file marks its MFT record and clusters as free. The record stays until it's reused. So a `$MFT` often lists files that are long gone. Content may survive in unallocated space, in **slack**, or in volume shadow copies. **File carving** finds data from signatures such as `FF D8` for JPEG, without using metadata. On SSDs, TRIM often erases deleted blocks fast, so recovery there is much less reliable.

### The journals

| Source | Records |
|---|---|
| `$UsnJrnl:$J` | Creates, renames, deletes, with timestamps |
| `$LogFile` | Metadata transactions, for crash recovery |
| Volume Shadow Copies | Earlier versions of files |
| Recycle Bin (`$I`, `$R`) | Original name, path and delete time |

The USN Journal is a superb source. An attacker who deletes a tool may forget that the deletion itself got logged.

### Advanced: building a defensible timeline

Combine the sources into one [timeline](/courses/0065-forensic-principles/), with `$MFT`, USN, event logs, Prefetch and Amcache. Then look for causes and effects: a file appears, Prefetch shows it ran, an event log shows a service starting. Corroboration across independent sources is what turns a guess into a finding.

Watch for time. NTFS uses UTC and FAT uses local time. System clocks can be wrong, so check for skew against a known event.

Linux filesystems differ. ext4 stores a creation time (`crtime`), readable with `debugfs`, and its journal may keep old metadata. See [Linux forensics](/modules/08-07-linux-forensics/).

Encryption changes everything. A BitLocker volume without its recovery key is unreadable, so memory capture or the recovery key from AD or Entra must come before you power off.

?? Why compare `$STANDARD_INFORMATION` and `$FILE_NAME` timestamps?
+ Timestomping tools often change only the first
- The second is stored on another disk
- The first is always in local time
- Windows deletes one of them each reboot
=> User-mode tools can easily set `$SI`, while `$FN` is written by the kernel driver. A mismatch deserves a closer look.

## Threat model

Attackers try to remove tools ([T1070.004](https://attack.mitre.org/techniques/T1070/004/)) and alter timestamps ([T1070.006](https://attack.mitre.org/techniques/T1070/006/)). Both leave second-order traces in the very structures above. See [Anti-forensics](/modules/08-09-anti-forensics-and-reporting/). The defender's advantage is that no attacker can easily clean every journal, and each attempt adds something new to find.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| FTK Imager, `dc3dd` | Image and hash | Acquisition |
| The Sleuth Kit | `mmls`, `fls`, `icat`, `istat`, `blkls` | Command-line analysis |
| Autopsy | GUI over the Sleuth Kit | Browsing a case |
| MFTECmd | Parses `$MFT` and `$J` | Windows timelines |
| Plaso | Super timelines | Merging many sources |
| PhotoRec, Foremost, Scalpel | Carve files | Unallocated space |

## Defence

Forensic readiness means preparing before anything happens.

- **Keep logs off the host**, and with enough retention.
- **Enable useful features:** process auditing, Sysmon, shadow copies where affordable.
- **Escrow disk encryption keys** in AD or Entra, so that responders can read a volume.
- **Keep a jump kit:** write blockers, wiped drives, forms, and tested tools.
- **Sync clocks** by NTP across the estate. Timelines depend on it.
- **Write down the procedure,** so that evidence survives legal scrutiny.

## Pitfalls

- **Booting the suspect machine.** It writes to the disk, changing evidence.
- **Working on the original.** It's unrepeatable.
- **Trusting a single timestamp.** They can be altered, and normal copying changes them too.
- **Assuming deleted files are recoverable on SSDs.** TRIM may have erased them.
- **Saying "the user did it".** A disk shows that an account did something. Attribution to a person needs more.
- **Forgetting cloud sync.** A file may exist elsewhere in OneDrive history.

?? Why image a disk before examining it?
+ Analysis happens on a verifiable, repeatable copy
- Imaging removes any malware from the disk
- Courts forbid reading any original hard drive
- Images recover data that encryption is protecting
=> A hashed image proves that the work reflects the original, and anyone can repeat your analysis.

## Exercise

::: law Lab only
Use disk images you made yourself, or public training images from NIST's CFReDS. Never examine someone else's device without clear authority.
:::

1. Download a test image from [NIST CFReDS](https://cfreds.nist.gov/). Verify its hash.
2. Run `mmls`, `fsstat`, and `fls -r` on it. Find a deleted file, marked with `*`, and recover it with `icat`.
3. On your own Windows VM, create a file and change its date with PowerShell's `(Get-Item f).CreationTime = ...`. Image the VM, parse `$MFT` with MFTECmd, and compare `$SI` with `$FN`.
4. Delete a file on that VM, then find the deletion in the USN Journal.
5. Build a short timeline in Plaso that shows a program being downloaded, run and deleted.

?! Write the wording you'd use in a report for a file with `$SI` dates older than `$FN`. State what it suggests, what else could explain it, and what you'd check next.

## Further reading

- [NIST SP 800-86](https://csrc.nist.gov/pubs/sp/800/86/final).
- Brian Carrier, *File System Forensic Analysis*, the standard text.
- [The Sleuth Kit documentation](https://sleuthkit.org/sleuthkit/docs.php).
- [Eric Zimmerman's tools](https://ericzimmerman.github.io/).
- [SANS Windows Forensic Analysis poster](https://www.sans.org/posters/windows-forensic-analysis/).
