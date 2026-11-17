---
title: ping
summary: Checks whether a host answers and how long a round trip takes.
side: both
use: open
docs: https://man7.org/linux/man-pages/man8/ping.8.html
alt: traceroute, fping, hping3
---
## What it's for
`ping` is the first network test anyone runs: is that host reachable, and how quickly does it answer? It exists on every operating system.

## How it works
It sends ICMP echo requests and waits for echo replies, then reports the round-trip time of each, and at the end the packet loss and the minimum, average and maximum times. The TTL in each reply hints at how many routers the packet crossed and at the remote system, since Linux usually starts at 64 and Windows at 128. No reply doesn't prove a host is down: many firewalls drop ICMP echo, so a silent host may still serve its website.

## Try it
```
ping -c 4 example.com
ping -c 4 -s 1472 -M do 192.168.1.1
ping -6 -c 4 ::1
```

`-c 4` stops after four packets (Windows uses `-n 4`). The second line sends a full-size packet that must not be split, which tests the path's MTU on your own network. Ping your router, then a site on another continent, and compare the times.

## What defenders see
A burst of echo requests across a whole subnet is a ping sweep, one of the oldest discovery techniques, and IDS rules for it are common. Unusually large or regular ICMP payloads can carry data out of a network, which the [IP layer and ICMP](/modules/01-02-ip-layer-and-icmp/) module covers. Choose deliberately which ICMP types your firewall allows: blocking all of it breaks path MTU discovery.

?! A server doesn't answer `ping`, but its website loads. Explain how both can be true, and name a better test of whether the host is up.
