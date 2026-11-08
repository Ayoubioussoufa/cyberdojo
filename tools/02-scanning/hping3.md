---
title: hping3
summary: Sends custom TCP, UDP and ICMP packets, for testing firewalls.
side: both
use: own
docs: https://www.kali.org/tools/hping3/
kali: hping3
aka: hping
alt: scapy, nmap
---
## What it's for
hping3 lets you build a packet by hand from the command line. It's useful for testing whether a firewall rule really does what you intended.

## How it works
Normally the kernel builds packets for you. hping3 writes them itself through raw sockets, so you pick the flags, ports and TTL. Then it shows the reply. If you send a lone SYN to a port and get nothing back, then something dropped it, and sending again with other flags tells you whether the firewall tracks state.

## Try it
::: law Your lab only
Test your own firewall in a lab. Its flood options are a denial-of-service tool, so don't use them on anything you don't own.
:::

```
sudo hping3 -S -p 80 -c 3 192.168.56.10
sudo hping3 -A -p 80 -c 3 192.168.56.10
```

`-S` sets SYN, `-A` sets ACK, and `-c` limits the count. A stateful firewall should drop an ACK that belongs to no connection.

## What defenders see
Unusual flag combinations and packets with no matching connection stand out, and a stateful firewall logs them as invalid. Floods of crafted packets are handled by [rate limits and SYN cookies](/modules/01-13-denial-of-service/).

?! How could hping3 show you that a firewall is stateless?
