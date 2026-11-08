---
title: FTK Imager
summary: Creates forensic disk and memory images, preserving the evidence.
side: defence
use: open
docs: https://www.exterro.com/digital-forensics-software/ftk-imager
alt: autopsy, dd
---
## What it's for
Before you analyse evidence, you must copy it correctly. FTK Imager is a free, widely used tool for making a forensic image of a disk or of memory, without altering the original.

## How it works
It reads a drive block by block and writes an exact copy, computing a hash as it goes. A write blocker, in hardware or software, stops any write reaching the source. The hash is the proof: if the image hashes the same later, it hasn't changed. It can also capture live memory and preview a drive before imaging.

## Try it
::: law Your evidence only
Image only devices you're authorised to, and use a write blocker.
:::

On Linux you can image with `dd` or `dcfldd`:

```
sudo dcfldd if=/dev/sdX of=usb.img hash=sha256 hashlog=usb.hashes
```

Image a USB stick you own, then verify the hash. Never write to the source device.

## What defenders see
Correct imaging is the foundation of everything after it. A broken chain of custody, or a missing hash, can sink a case. Store images securely, keep the original untouched, and record who did what and when.

?! What does hashing the image at capture time let you prove weeks later in a dispute?
