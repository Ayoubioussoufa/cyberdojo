---
title: Snort
summary: The original open-source intrusion detection system.
side: defence
use: open
docs: https://docs.snort.org/
kali: snort
alt: suricata, zeek
---
## What it's for
Snort, from 1998, created the open-source IDS, and its rule format became a standard that other tools adopted. It's worth knowing for that shared rule language, and it's still in wide use.

## How it works
Like Suricata, it matches traffic against rules and can run inline to block. Snort 3 added multithreading and a new configuration. Many commercial products speak its rule syntax, so learning a Snort or Suricata rule teaches you both.

## Try it
```
snort -r sample.pcap -c /etc/snort/snort.conf -A console
```

Read the alerts, then open one of the matching rules and work out exactly what it looked for. The [rule writing module](/modules/07-02-ids-rule-writing/) has the grammar.

## What defenders see
As with any IDS, placement and tuning decide its worth. Too many rules bury the signal, so enable the categories that fit your environment, and review alerts regularly. Encrypted payloads limit what it sees.

?! Why is a shared rule language across different products useful to a defender who changes jobs or tools?
