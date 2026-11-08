---
title: NetworkMiner
summary: Extracts files, hosts and credentials from a capture.
side: defence
use: open
docs: https://www.netresec.com/?page=NetworkMiner
alt: wireshark, arkime
---
## What it's for
Wireshark shows packets. NetworkMiner shows what they carried: hosts, files, images, messages and logins. It's a quick way to answer "what happened in this capture?"

## How it works
It reassembles TCP streams, parses protocols, and writes out what it finds, organised by host. So instead of following streams, you browse a list of the files transferred. It runs on Windows and, through Mono, on Linux. The free edition handles most of this, though it can't take a live capture over every protocol.

## Try it
Open a practice pcap from [Malware Traffic Analysis](https://www.malware-traffic-analysis.net/) in a VM, and list the hosts and transferred files. Don't open extracted files on your own machine, since they can be real malware.

```
sha256sum extracted_file
```

Hash each file, and look up the hash rather than running it.

## What defenders see
It's an analyst's tool. Credentials shown in its output are real, so treat results as sensitive. Any plain-text login it finds on your network is a finding in itself.

?! You extract an executable from a capture. Why do you hash it rather than run it, and where do you look up the hash?
