---
title: Suricata
summary: Inspects network traffic for known threats and logs rich metadata.
side: defence
use: open
docs: https://docs.suricata.io/
kali: suricata
alt: zeek, snort
---
## What it's for
Suricata watches network traffic and raises alerts when it matches a rule. It also logs a detailed record of every connection, so it's both an intrusion detection system and a source of network evidence.

## How it works
It reads packets, rebuilds streams, and identifies the protocol regardless of port. Rules describe what to alert on, and it processes traffic across many threads to keep up with fast links. In IDS mode it watches a copy of traffic and alerts. In IPS mode it sits inline and can drop packets, which is powerful and risky, since a bad rule then blocks real traffic. Its `eve.json` output, with one event per line, is often more useful than the alerts. [IDS rule writing](/modules/07-02-ids-rule-writing/) covers the rule language.

## Try it
```
suricata -r sample.pcap -l ./out
ls out/
```

Read `out/eve.json` with `jq`. Replay a practice capture from [Malware Traffic Analysis](https://www.malware-traffic-analysis.net/) with [tcpreplay](/tools/tcpreplay/), and watch alerts appear.

## What defenders see
This is the defender's tool. Place sensors where they see the traffic you care about, tune out noisy rules so real alerts aren't buried, and feed `eve.json` into your [SIEM](/modules/08-01-siem-query-languages/). Remember that encrypted traffic hides payloads, so lean on metadata such as TLS fingerprints and the server name.

?! You turn on a new rule set and get 5,000 alerts an hour. What's gone wrong, and how do you make the alerts useful again?
