---
title: arp-scan
summary: Discovers every device on the local network segment through ARP.
side: both
use: own
docs: https://github.com/royhills/arp-scan
kali: arp-scan
alt: netdiscover, nmap
---
## What it's for
Firewalls can hide a host from ping, but a host can't hide from ARP on its own segment, since it needs ARP to communicate. arp-scan lists everything nearby.

## How it works
On a local link, a machine asks "who has this IP?" and the owner answers with its MAC address. arp-scan sends one such request per address and collects the replies. The first half of a MAC identifies the manufacturer, so it can guess the device type. ARP doesn't cross routers, so this only sees your own subnet.

## Try it
::: law Your network only
Use it on your home or lab network.
:::

```
sudo arp-scan --localnet
sudo arp-scan 192.168.56.0/24
```

Identify each device. Is there anything you can't explain?

## What defenders see
A burst of ARP requests from one host shows up on switches and in Zeek's logs. Network access control and an up-to-date inventory turn "unknown device" into an alert, which makes this a useful weekly check in small offices.

?! Why can't a host's firewall hide it from an ARP scan on the same segment?
