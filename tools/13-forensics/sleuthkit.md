---
title: The Sleuth Kit
summary: Command-line tools for file system forensics.
side: defence
use: open
docs: https://www.sleuthkit.org/sleuthkit/docs.php
kali: sleuthkit
aka: tsk
alt: autopsy
---
## What it's for
The Sleuth Kit is the set of command-line tools underneath [Autopsy](/tools/autopsy/). They let you examine a disk image file by file, and they script well for repeatable work.

## How it works
Each tool works at a different layer. `mmls` shows the partition table. `fls` lists files, including deleted ones. `istat` details a single file record, and `icat` copies out its contents by record number. Working at the record level lets you reach data that a normal file copy can't, such as a deleted entry whose record still exists.

## Try it
::: law Your evidence only
Work on images you're authorised to examine.
:::

```
mmls disk.img
fls -r -o 2048 disk.img | head
```

`-o` is the partition offset that `mmls` reported. Find a deleted entry, then recover it with `icat`.

## What defenders see
The command line gives you an exact, scriptable record of each step, which matters for evidence. Hash everything, and never work on the only copy. These same skills recover data after a mistake, not only after an attack.

?! Why can `fls` sometimes list a file that a normal directory listing won't show?
