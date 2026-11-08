---
title: Wifite
summary: Automates Wi-Fi security testing, and shows which networks resist it.
side: both
use: know
docs: https://github.com/derv82/wifite2
kali: wifite
alt: aircrack-ng, kismet
---
## What it's for

Wifite automates the Wi-Fi testing that [Aircrack-ng](/tools/aircrack-ng/) does by hand, working through nearby networks and reporting which are weak. For a defender, the lesson is sobering and useful: it shows how quickly a poorly configured wireless network is identified, and therefore how much the configuration matters.

## How it works

It wraps the underlying suite, scans for networks, and for each applies the relevant checks automatically, from the long-broken WEP to WPA2 handshakes and the WPS feature that many routers ship with enabled. WPS, a convenience feature for adding devices with a PIN, has a well-known weakness, which is why security guidance says to turn it off. The automation means the weak configurations stand out at once, which is exactly what you want to fix.

## Practise safely

Study which settings make a network resist it, using your own access point. Turn WPS off, choose WPA3 or WPA2 with a long random passphrase, and confirm your router no longer presents the weaknesses this kind of tool looks for. For any hands-on testing, use only your own equipment, since testing others' Wi-Fi is illegal.

## What defenders see

The defensive checklist falls straight out of what it targets: never use WEP, disable WPS, prefer WPA3, and use a long passphrase or enterprise authentication. A wireless IDS detects the deauthentication frames and capture attempts that precede handshake collection. Harden the access point, and the automation finds nothing. [Wi-Fi security](/modules/15-01-wifi-security/) gives the full picture.

?! WPS was added for convenience. Why is "turn off WPS" a standard hardening step, and what does leaving it on risk?
