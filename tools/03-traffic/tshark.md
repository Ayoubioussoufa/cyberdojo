---
title: tshark
summary: Wireshark's dissectors on the command line, for scripts and servers.
side: both
use: open
docs: https://www.wireshark.org/docs/man-pages/tshark.html
kali: tshark
alt: wireshark, tcpdump
---
## What it's for
tshark is Wireshark without the window. It's what you use over SSH, on a server, or to turn a capture into data that you can sort and count.

## How it works
It uses the same dissectors and display filters as Wireshark, so anything you can filter there works here. The `-T fields` output prints just the fields you name, as text. That turns a capture into a table for `sort` and `uniq`, which is the fastest way to answer "which domain was queried most?"

## Try it
```
tshark -r cap.pcap -Y dns -T fields -e dns.qry.name | sort | uniq -c | sort -rn | head
tshark -r cap.pcap -q -z io,phs
tshark -r cap.pcap -q -z conv,tcp
```

`-r` reads a file, `-Y` is a display filter, and `-z` prints statistics. Run the protocol summary first, as it shows what's in a capture at a glance.

## What defenders see
It only reads, so it leaves no trace on a network. Take care on production servers, since dissecting live traffic uses CPU, and there's a long history of dissector bugs. So capture with `tcpdump`, and analyse elsewhere.

?! You've got a 2 GB capture and one question: which internal host talked most to the Internet? Which tshark option do you use first, and why?
