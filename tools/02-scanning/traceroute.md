---
title: traceroute
summary: Shows the path packets take, hop by hop.
side: both
use: open
docs: https://www.bitwizard.nl/mtr/
kali: traceroute
aka: mtr, tracert
alt: nmap, dig
---
## What it's for
traceroute shows each router between you and a destination. Windows calls it `tracert`. **mtr** combines it with ping, and it keeps measuring. They're the first tools to reach for when a connection is slow or broken.

## How it works
Each IP packet has a TTL, which every router lowers by one. When it reaches zero, the router drops the packet and sends back an ICMP Time Exceeded message, revealing its address. So traceroute sends packets with TTL 1, 2, 3 and so on. Each hop reveals itself in turn. Silent hops show as `*`, which usually means that a router doesn't answer, not that it's broken.

## Try it
```
traceroute example.com
mtr -r -c 10 example.com
```

`-r` prints a report, and `-c` sets the count. Loss at one hop that doesn't continue to later hops is usually harmless: that router just gives ICMP low priority.

## What defenders see
Firewalls can limit these replies to hide internal paths. Unusual routes can point to a [BGP problem](/modules/01-12-routing-and-bgp/), so a baseline of normal paths to key services is useful.

?! mtr shows 40% loss at hop 5, but 0% at hops 6 to 9. Is there a real problem? Explain why.
