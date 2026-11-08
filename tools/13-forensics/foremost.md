---
title: foremost
summary: Recovers files from a disk image by their content, not the file system.
side: defence
use: open
docs: https://foremost.sourceforge.net/
kali: foremost
aka: scalpel
alt: autopsy, binwalk
---
## What it's for
When a file system is damaged or a file is deleted, its directory entry may be gone, but the data often remains. foremost recovers files by recognising their contents, a technique called file carving. `scalpel` is a similar, faster tool.

## How it works
Many file types start and end with known byte markers: a JPEG, a PDF, a ZIP. foremost scans the raw image for these markers and copies out whatever lies between them. It ignores the file system entirely, so it works even when that's destroyed. The cost is that fragmented files come out broken, since carving assumes the data is contiguous.

## Try it
::: law Your evidence only
Carve only images you're authorised to examine.
:::

```
foremost -t jpg,pdf -i disk.img -o recovered/
```

`-t` lists the types to recover. Delete a photo from a test image, then carve it back.

## What defenders see
Carving recovers evidence that normal tools miss, and it recovers your own lost files after a mistake. Its weakness, fragmentation, is worth understanding, since a half-recovered file can mislead. Verify what you recover before relying on it.

?! Why does file carving struggle with a fragmented file, and what might a recovered fragment look like?
