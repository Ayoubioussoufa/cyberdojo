---
title: Flipper Zero
summary: A portable multi-tool for exploring radio, RFID and hardware.
side: both
use: own
docs: https://docs.flipper.net/
alt: proxmark3, hackrf
---
## What it's for
The Flipper Zero is a small, playful device for exploring the physical signals around us: sub-gigahertz radio, RFID and NFC cards, infrared, and hardware pins. It's popular for learning how these everyday systems work, and how weak many of them are.

## How it works
It bundles several radios and interfaces into one device with simple controls. It can read an access card, record and replay a simple remote's signal, or act as an infrared remote. Many of the systems it touches, such as old garage remotes and basic RFID cards, have little or no security, which is the real lesson: convenience long outran protection in these devices.

## Try it
::: law Your devices only
Read and test only cards, remotes and devices you own. Replaying signals to others' property can be theft or trespass, whatever the device.
:::

Read one of your own RFID access cards and look at its type. Many old cards use formats with no cryptography, which is exactly why the newer ones added it.

## What defenders see
The defensive lesson is clear: don't rely on systems that can be trivially copied. Use modern, cryptographically secure access cards, rolling-code remotes, and proper authentication. [Radio](/modules/15-02-radio-bluetooth-cellular/) and [hardware attacks](/modules/15-07-hardware-attacks-and-tees/) cover the principles.

?! Why can an old RFID access card be copied so easily, and what do modern cards do differently?
