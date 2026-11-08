---
title: binwalk
summary: Finds and extracts files hidden inside other files, especially firmware.
side: both
use: open
docs: https://github.com/ReFirmLabs/binwalk
kali: binwalk
alt: exiftool, foremost
---
## What it's for
A firmware image or an odd file often contains other files inside it. binwalk finds them, which makes it a staple of firmware analysis and of capture-the-flag puzzles.

## How it works
It scans for the signatures that mark the start of known formats, such as a compressed archive, a file system or an embedded image. When it finds them, it can carve out and extract each part. That's how you get from a single firmware blob to the file system inside, where the interesting files live.

## Try it
::: law Your files only
Analyse firmware you're allowed to, such as for your own device.
:::

```
binwalk firmware.bin
binwalk -e firmware.bin
```

`-e` extracts what it finds. Try it on a firmware image for one of your own devices, and look for a file system inside.

## What defenders see
For a defender, this reveals what's inside a suspicious file or a device's firmware: hard-coded keys, extra binaries, or a hidden partition. [Firmware and IoT](/modules/15-06-firmware-and-iot/) covers the wider picture. Treat extracted contents as untrusted.

?! How does binwalk know where one embedded file ends and another begins?
