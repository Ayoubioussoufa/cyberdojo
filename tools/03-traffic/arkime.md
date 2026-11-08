---
title: Arkime
summary: Records full packets at scale and makes them searchable.
side: defence
use: open
docs: https://arkime.com/
aka: Moloch
alt: zeek, wireshark
---
## What it's for
Arkime, once called Moloch, keeps a full packet record of your network, and lets you search it. When an alert fires, you can go back and see exactly what happened.

## How it works
Capture nodes write raw packets to disk as pcap files, while session metadata goes to Elasticsearch or OpenSearch. So you search the metadata quickly, then pull only the packets you need. Disk is the main cost, and teams decide how many days they keep, so retention is a budget decision. TLS traffic stays encrypted, though metadata such as the server name and fingerprints remains useful.

## Try it
Run it inside [Security Onion](/tools/security-onion/) in a lab. Then find a session through its web interface, and download the pcap.

```
tshark -r session.pcap -q -z conv,tcp
```

Use this on the downloaded session.

## What defenders see
It's a defender's system, and it holds sensitive data, so restrict access to it, keep an audit trail, and set a retention period that fits your privacy duties. Sensors should sit where they see the traffic you care about, as described in [Sensors and TLS inspection](/modules/07-03-sensors-and-tls-inspection/).

?! Why does Arkime store metadata separately from the packets? What does that make cheap, and what stays expensive?
