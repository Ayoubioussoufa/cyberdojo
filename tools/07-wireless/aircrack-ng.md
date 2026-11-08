---
title: Aircrack-ng
summary: The classic Wi-Fi testing suite, and the case for WPA3 and long passphrases.
side: both
use: own
docs: https://www.aircrack-ng.org/documentation.html
kali: aircrack-ng
alt: wifite, kismet
---
## What it's for

Aircrack-ng is the best-known Wi-Fi security suite, and it's in Kali's top 10. It lets you test the security of a wireless network you own: whether its encryption is sound, and whether its passphrase would survive an offline attack. Studying it is the clearest way to understand why old Wi-Fi security failed and what to use instead.

## How it works

The suite has parts for each step: putting a wireless card into monitor mode to see traffic, capturing frames, and analysing them. For a WPA2 network, security rests on a passphrase and a handshake exchanged when a device joins. If that handshake is captured, the passphrase can be tested offline, exactly like a password hash, so a short or common passphrase is the weakness. The older WEP standard was broken outright and must never be used. WPA3 strengthens the handshake so this offline testing no longer works the same way.

## Try it

::: law Your network only
Test only a wireless network you own. Capturing or interfering with others' Wi-Fi is illegal in most countries, regardless of the tool.
:::

On your own access point, see which security mode it offers, and check whether WPA3 is available. Set a long, random passphrase. The lesson is that passphrase length and a modern standard, not the tool, decide the outcome.

## What defenders see

Use WPA3 where you can, and WPA2 only with a long, random passphrase that defeats offline guessing. For organisations, enterprise authentication (802.1X) avoids a shared passphrase altogether. A wireless intrusion detection system can spot the deauthentication frames and monitor-mode activity that often precede a capture. [Wi-Fi security](/modules/15-01-wifi-security/) covers the protocols in depth.

?! Why does a captured WPA2 handshake turn Wi-Fi security into the same problem as storing a password, and what defeats that?
