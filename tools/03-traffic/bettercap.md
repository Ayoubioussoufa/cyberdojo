---
title: bettercap
summary: A modern framework for network, Wi-Fi and Bluetooth attacks.
side: attack
use: know
docs: https://www.bettercap.org/
kali: bettercap
alt: ettercap, aircrack-ng
---
## What it's for
bettercap is the modern successor to Ettercap, and it covers Ethernet, Wi-Fi and Bluetooth Low Energy. It appears in many red team write-ups, and it's useful to recognise.

## How it works
It's a single Go program with a module for each job: network discovery, ARP and DNS spoofing, Wi-Fi monitoring, and proxies. A web interface and scriptable "caplets" drive those modules. The underlying weaknesses are old ones: unauthenticated ARP and DNS on a LAN, and weak protections around Wi-Fi handshakes.

## Practise safely
Test the defences instead. Check that your Wi-Fi uses WPA3 or at least protected management frames, that your switches have ARP inspection on, and that your browsers refuse bad certificates. Use a legal lab or a training platform for anything more.

## What defenders see
Watch for ARP changes, rogue DHCP or DNS answers, and many deauthentication frames in a wireless IDS. [Wi-Fi security](/modules/15-01-wifi-security/) covers the protections. Endpoint tools can flag it directly if it's installed on a managed machine.

?! Which single switch or Wi-Fi setting would most reduce the risk from this tool on an office network? Give your reason.
