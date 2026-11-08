---
title: Netcat
summary: Reads and writes raw data over network connections.
side: both
use: open
docs: https://nmap.org/ncat/guide/index.html
kali: ncat
aka: nc, ncat
alt: socat, nmap
---
## What it's for
Netcat is the Swiss Army knife of networking. It opens a connection or listens on a port, then passes bytes between the network and your terminal. It's used to test ports, debug services and move files in a lab.

## How it works
It's a thin layer over TCP and UDP sockets. Whatever you type goes down the socket, and whatever arrives is printed. So a text protocol such as HTTP can be spoken by hand. There are several versions: traditional, OpenBSD, and Nmap's `ncat`, and their flags differ. [Netcat and socat](/modules/01-01-netcat-and-socat/) walks through it, and Linux's `nc` is often the OpenBSD one.

## Try it
```
nc -zv 192.168.56.10 22 80
nc -l 9000
nc 127.0.0.1 9000
```

`-z` checks a port without sending data. Run the last two in separate terminals, and type in each. Then try speaking HTTP to a local server.

## What defenders see
Attackers like it since it's small and often present. Alert on `nc` starting on a server, or on any process listening on an unexpected port. Don't install it on production systems. [EDR](/modules/06-06-edr-internals/) sees the process, and flow logs show a long connection on an odd port.

?! What's the difference between a port being reachable with `nc -zv` and the service on it working properly?
