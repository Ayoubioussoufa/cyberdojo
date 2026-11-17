---
title: dd
summary: Copies data byte for byte, the classic way to image a disk.
side: defence
use: open
docs: https://www.gnu.org/software/coreutils/manual/html_node/dd-invocation.html
aka: dc3dd, dcfldd
alt: ftk-imager, sleuthkit
---
## What it's for
`dd` copies raw bytes from one place to another: a whole disk to an image file, an image back to a disk, or one slice of a file. In forensics it makes the bit-for-bit copy you analyse instead of the original. `dc3dd` and `dcfldd` are forensic versions that hash the data as they copy and log what they did.

## How it works
It reads blocks from `if=` (the input file) and writes them to `of=` (the output file), with `bs=` setting the block size. A disk is just a file under `/dev`, so `if=/dev/sdb` reads the whole device, including deleted data and free space that a normal copy would skip. `conv=noerror,sync` carries on past unreadable sectors and pads them with zeros so the image keeps the right offsets; on a failing disk use a small block size, since a whole block is padded. `dd` checks nothing: swap `if` and `of` and you overwrite your evidence, which is why examiners connect the source through a write blocker.

## Try it
```
lsblk
sudo dd if=/dev/sdb of=usb.img bs=4M conv=noerror,sync status=progress
sha256sum usb.img
sudo sha256sum /dev/sdb
dd if=usb.img bs=512 count=1 | xxd | head
```

Image a spare USB stick, never a disk you need, and check with `lsblk` which device is which first. Matching hashes of the image and the device show the copy is exact. The last line shows the first sector, where the partition table lives.

## What defenders see
For a defender, `dd` is an acquisition tool: hash before and after, write down who did what and when, and work only on copies, as [disk forensics](/modules/08-05-disk-forensics/) describes. In an attacker's hands the same tool destroys: `dd` writing zeros or random data to a disk device wipes it, and EDR rules that flag writes to raw devices catch it. Open the image with [The Sleuth Kit](/tools/sleuthkit/) or [Autopsy](/tools/autopsy/).

?! Your image's SHA-256 doesn't match the hash you took of the device an hour ago. What are the possible reasons, and which do you rule out first?
