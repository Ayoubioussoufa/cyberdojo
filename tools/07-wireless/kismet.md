---
title: Kismet
summary: Passively detects and maps wireless devices and networks.
side: defence
use: own
docs: https://www.kismetwireless.net/docs/
kali: kismet
alt: aircrack-ng
---
## What it's for

Kismet listens to wireless networks without transmitting. It detects access points and devices across Wi-Fi, and with the right hardware Bluetooth and other radios too. For a defender it's a wireless monitor: it finds rogue access points, unexpected devices, and networks you didn't know were there.

## How it works

It puts a wireless card into monitor mode and records the management frames that devices broadcast constantly, building a live list of access points and clients with their signal strength and capabilities. Because it only listens, it's silent and safe to run continuously. That passive stance is what makes it a monitoring tool rather than an intrusive one, and it's ideal for sensitive environments where even probing is unwelcome.

## Try it

::: law Your environment only
Monitor your own premises. Logging others' devices can raise privacy issues.
:::

Run Kismet with a compatible wireless adapter, and watch the access points and clients around you appear. Identify your own network, then look for anything you can't account for, such as an access point advertising your company's name that you didn't deploy.

## What defenders see

A rogue access point, one impersonating your network to lure devices, is a real threat that passive monitoring catches. Use Kismet to baseline the wireless devices that should be present, then alert on new or impersonating access points. This is the wireless side of knowing your estate, and it complements the controls in [Wi-Fi security](/modules/15-01-wifi-security/).

?! Why is a passive, listen-only tool especially suitable for continuous wireless monitoring in a sensitive environment?
