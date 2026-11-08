---
title: tcpdump
summary: Captures packets from the command line with almost no overhead.
side: both
use: open
docs: https://www.tcpdump.org/manpages/tcpdump.1.html
kali: tcpdump
alt: wireshark, tshark
---
## What it's for
tcpdump is on nearly every Unix server. When you need to know whether packets are really arriving, this is usually the fastest way to find out.

## How it works
It uses libpcap and BPF, a small filter that runs in the kernel. Filtered packets get copied to the tool, so unwanted traffic costs almost nothing. That's why it's safe enough for busy servers. Filters use their own syntax, such as `host`, `port` and `net`, which is the same as Wireshark's capture filters.

## Try it
```
sudo tcpdump -i eth0 -n port 53
sudo tcpdump -i eth0 -n -w web.pcap 'tcp port 443 and host 192.168.56.10'
tcpdump -n -r web.pcap | head
```

`-n` skips name lookups, and `-w` writes a file for Wireshark. Prefer writing to a file over reading the live output.

## What defenders see
Keep captures short, and protect them, as they may contain sensitive data. An attacker with root could use it too, so `tcpdump` running unexpectedly on a production host is worth an alert. Zeek and Suricata do this continuously for defenders.

?! Why is it safer to run tcpdump on a busy server than to run Wireshark there?
