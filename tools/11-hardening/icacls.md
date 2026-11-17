---
title: icacls
summary: Shows and changes who may read, write or run files and folders on Windows.
side: both
use: open
docs: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/icacls
alt: chmod, powershell
---
## What it's for
Windows files and folders carry access control lists (ACLs): lists of entries, each granting or denying rights to a user or a group. `icacls` displays and edits them from the command line, which is how you check that a service's folder, a share or a secret file is locked down. It's the Windows counterpart of [chmod](/tools/chmod/).

## How it works
Each entry names an account and its rights: `F` full control, `M` modify, `RX` read and execute, `R` read and `W` write. Letters in brackets say how an entry spreads: `(OI)` means files below inherit it, `(CI)` that subfolders do, and `(I)` that it came from the parent folder. A deny entry beats an allow entry. Most rights arrive by inheritance, so changing a parent folder changes everything beneath it.

## Try it
```
icacls C:\ProgramData
icacls "C:\Program Files\MyApp"
icacls C:\lab\secret.txt /inheritance:r /grant:r "%USERNAME%:F"
icacls C:\lab /save acl-backup.txt /t
```

The third line removes the inherited entries and leaves only you, with full control. The last saves every ACL under a folder, so you can compare or restore them later.

## What defenders see
Weak permissions are a classic route to SYSTEM: if ordinary users may write to the folder of a program that runs as a service, anyone can replace that program. Check the folders of services and scheduled tasks for `(M)`, `(W)` or `(F)` granted to `Users`, `Authenticated Users` or `Everyone`. The [Windows privilege escalation](/modules/02-08-windows-privilege-escalation/) module explains the pattern from the defender's side.

?! `icacls "C:\Program Files\Backup"` shows `BUILTIN\Users:(OI)(CI)(M)`, and the backup service runs as SYSTEM from that folder. Why is this serious?
