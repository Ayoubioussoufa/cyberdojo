---
title: Zeek
summary: Turns network traffic into rich, structured logs.
side: defence
use: open
docs: https://docs.zeek.org/
kali: zeek
aka: Bro
alt: suricata, arkime
---
## What it's for
Zeek, once called Bro, doesn't mainly look for attacks. It describes what happened on the network, in structured logs. For a hunter, that record is gold: every connection, DNS query, TLS handshake and file transfer, written down.

## How it works
It watches traffic and runs an event engine: a new connection, a DNS reply, an HTTP request. Scripts in its own language react to those events and write logs such as `conn.log` and `dns.log`. So it's really a programmable traffic analyser, not a fixed rule matcher. That's why hunters love it: you can ask questions that no signature anticipated.

## Try it
```
zeek -r sample.pcap
cat conn.log | zeek-cut id.orig_h id.resp_h service duration
```

Run it on a practice capture, and look at `dns.log` and `ssl.log`. Which outside hosts did an internal machine talk to?

## What defenders see
Zeek is a cornerstone of network monitoring. Its logs make [threat hunting](/modules/08-02-threat-hunting/) possible: find the longest connections, rare user agents, or self-signed certificates. It's part of [Security Onion](/tools/security-onion/). It records metadata, not full packets, so it scales to large networks cheaply.

?! Zeek doesn't alert by default, yet hunters prize it. What can you find in its logs that a signature-based IDS would miss?
