---
title: ip
summary: Shows and changes a Linux host's addresses, routes and neighbours.
side: both
use: open
docs: https://man7.org/linux/man-pages/man8/ip.8.html
kali: iproute2
aka: ifconfig
alt: ss
---
## What it's for
`ip` is the Linux command for the network set-up itself: which addresses an interface has, where traffic is routed, and which neighbours are known on the local network. It replaced the older `ifconfig`, `route` and `arp`, and comes with [ss](/tools/ss/) in the iproute2 package. On Windows, `ipconfig` and `route print` answer the same questions.

## How it works
Each kind of object has its own subcommand: `ip addr` for addresses, `ip link` for interfaces, `ip route` for the routing table, and `ip neigh` for the ARP (IPv4) and neighbour (IPv6) cache. They all talk to the kernel over netlink. Reading needs no privileges and changing anything needs root. Changes made with `ip` are lost at reboot unless your network manager saves them.

## Try it
```
ip -br addr
ip route
ip route get 1.1.1.1
ip neigh
ip -s link
```

`-br` gives a brief one-line view, and `-s` adds packet and error counters. `ip route get` shows which interface and gateway a packet to that address would use. Find your default gateway, then find its MAC address in `ip neigh`.

## What defenders see
`ip neigh` is a quick check for ARP spoofing: if two addresses on your LAN share one MAC address, or your gateway's MAC suddenly changes, someone may be in the middle, as [layer 2 attacks](/modules/01-04-layer-2-attacks/) explains. An unexpected extra route or interface on a server, such as a tunnel device, deserves an explanation. Attackers run these commands too, to learn where they've landed.

?! Yesterday `ip neigh` showed your gateway `192.168.1.1` at one MAC address. Today it shows the MAC of another device on your LAN. What may be happening, and how do you confirm it?
