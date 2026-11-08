---
title: tcpreplay
summary: Replays captured traffic onto a network, for testing sensors.
side: defence
use: open
docs: https://tcpreplay.appneta.com/
kali: tcpreplay
alt: suricata, zeek
---
## What it's for
Did your IDS actually see that? tcpreplay answers this by replaying a known capture, so you can test a sensor against traffic you already understand.

## How it works
It reads a pcap and writes each packet back to an interface at the original timing, or at a rate you set. Packets aren't reprocessed by a TCP stack, so there's no real conversation, only a recording. So it's for sensors watching traffic, not for servers that need to respond.

## Try it
```
sudo tcpreplay -i eth1 --mbps=10 sample.pcap
```

Use an isolated lab interface. [Malware Traffic Analysis](https://www.malware-traffic-analysis.net/) publishes captures for practice. Check that the expected alerts fire.

## What defenders see
This is a defender's tool. Keep replay on an isolated segment, because a capture may contain malicious traffic and real addresses. Suricata and Zeek can also read pcaps directly, which is simpler when you're only testing rules.

?! Why does replaying a capture test a sensor well, but not a web server?
