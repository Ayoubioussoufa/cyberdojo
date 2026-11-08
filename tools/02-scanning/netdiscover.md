---
title: netdiscover
summary: Finds hosts on a local network, actively or just by listening.
side: both
use: own
docs: https://github.com/netdiscover-scanner/netdiscover
kali: netdiscover
alt: arp-scan
---
## What it's for
netdiscover does a similar job to [arp-scan](/tools/arp-scan/), with one important extra: it can find hosts by listening only.

## How it works
In active mode it sends ARP requests across a range. In passive mode it sends nothing, and records the ARP traffic it hears. Passive mode is slower but silent, and that matters on fragile networks, such as industrial ones, where even light scanning can upset old devices.

## Try it
::: law Your network only
Use it on your own lab network.
:::

```
sudo netdiscover -r 192.168.56.0/24
sudo netdiscover -p -i eth0
```

The second line listens only. Leave it for a few minutes, and compare the two lists.

## What defenders see
Passive mode can't be seen on the wire. Active mode can, as with any ARP sweep. Defenders may use the passive approach themselves on OT networks, to build an inventory without any risk.

?! Why might you choose passive discovery on a factory network, even though it's slower?
