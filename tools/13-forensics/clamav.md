---
title: ClamAV
summary: An open-source antivirus engine, often used on mail and file servers.
side: defence
use: open
docs: https://docs.clamav.net/
kali: clamav
alt: yara
---
## What it's for
ClamAV is the best-known open-source antivirus. It's commonly used to scan email attachments and uploaded files on servers, rather than as desktop protection.

## How it works
It matches files against a signature database, updated by `freshclam`, and it can also use YARA rules. A daemon, `clamd`, keeps the signatures in memory so that scans are fast, which suits a mail gateway checking every attachment. Like any signature scanner, it catches known threats and misses novel ones, so it's one layer, not the whole defence.

## Try it
```
freshclam
clamscan -r --infected /path/to/scan
```

Update the signatures, then scan a folder. The [EICAR test file](https://www.eicar.org/download-anti-malware-testfile/) is a harmless standard string that every scanner flags, so use it to prove scanning works.

## What defenders see
Use it to scan what enters your systems: email, uploads and file shares. Combine it with other checks, since signatures alone aren't enough. Keep signatures current, and watch that the scanner itself stays healthy, as a silently broken scanner is worse than none.

?! Why is a signature scanner better suited to a mail gateway than to catching a brand-new, targeted attack?
