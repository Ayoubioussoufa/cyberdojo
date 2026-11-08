---
title: Wireshark
summary: Captures packets and shows each protocol in readable form.
side: both
use: open
docs: https://www.wireshark.org/docs/wsug_html_chunked/
kali: wireshark
alt: tshark, tcpdump
---
## What it's for
Wireshark lets you see what's really on the wire. Network engineers use it to debug, and analysts use it to investigate alerts. Once you can read a capture, networks stop being mysterious.

## How it works
It captures through libpcap, or Npcap on Windows, by putting an interface into promiscuous mode. Then its dissectors decode each layer into named fields. It has two separate filter languages, and mixing them up is the first mistake everybody makes. **Capture filters** decide what gets saved, and **display filters** decide what you see in what you saved. Follow TCP Stream rebuilds a conversation.

## Try it
```
http.request
dns && !(dns.flags.response == 1)
tcp.flags.syn == 1 && tcp.flags.ack == 0
ip.addr == 192.168.56.10
```

These are display filters. Capture your own browsing for a minute, then find a DNS query and its reply. For encrypted traffic, see [packet analysis](/modules/01-06-packet-analysis-in-depth/).

## What defenders see
Passive capture can't be seen on the wire, although a promiscuous interface can sometimes be detected. Captures hold passwords and personal data, so treat them as sensitive. Use only on networks where you've got permission.

?! What's the practical difference between a capture filter and a display filter? When would you need each?
