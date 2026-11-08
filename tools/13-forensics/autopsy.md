---
title: Autopsy
summary: A graphical workbench for examining disk images.
side: defence
use: open
docs: https://www.autopsy.com/
kali: autopsy
aka: Sleuth Kit
alt: volatility, ftk-imager
---
## What it's for
Autopsy is a free, graphical forensic platform built on The Sleuth Kit. Examiners use it to work through a disk image methodically: files, deleted data, browser history and more.

## How it works
It reads a forensic image, parses the file systems, and builds a timeline and a browsable tree. Ingest modules extract specific things, such as web activity, email and pictures. Crucially, it reads the image without changing it, and it records what you did, which is what makes the work defensible in a dispute. The Sleuth Kit provides the same power on the command line.

## Try it
::: law Your evidence only
Examine images you're authorised to, and keep the original read-only.
:::

Make a small disk image of a USB stick you own with `dd`, open it in Autopsy, delete a file before imaging, and see whether you can recover it. Use practice images from [Digital Corpora](https://digitalcorpora.org/) for more.

## What defenders see
Forensics is the defender's craft after an incident. Keep a clear chain of custody, hash the image before and after to prove it's unchanged, and document each step. [Disk forensics](/modules/08-05-disk-forensics/) goes deeper.

?! Why must a forensic tool read a disk image without writing to it, and how do you prove nothing changed?
