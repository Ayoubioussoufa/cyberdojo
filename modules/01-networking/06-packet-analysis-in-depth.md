---
title: Packet analysis in depth
summary: From a kernel-level capture filter to fingerprinting TLS clients without decrypting them. tcpdump, BPF, tshark, TLS key logs, JA3 and JA4, and flow records.
level: intermediate
side: both
minutes: 60
attack: T1040, T1557
needs: 0020-reading-packets, 01-03-tcp-internals
pair: 08-08-network-and-cloud-forensics
source: Wireshark User's Guide | https://www.wireshark.org/docs/wsug_html_chunked/
words: capture filter, display filter, JA4
---
Lesson 20 had you read a capture. A working analyst has a harder problem: the capture is 40 GB, most of it's encrypted, and the question arrived after the fact. This module is about choosing what to capture, cutting it down fast, and learning what still leaks when the content is hidden.

@term BPF (Berkeley Packet Filter) = A small filtering language that runs in the kernel and decides which packets a capture receives.
@term TLS fingerprint = A hash of the options in a TLS ClientHello, which tends to identify the client software.
@term flow record = A one-line summary of a connection: addresses, ports, protocol, bytes and times.
@term encrypted traffic analysis = Learning about encrypted sessions from their metadata, such as sizes, timing and handshakes.

## Concept

### Fundamentals: where a capture comes from

`libpcap` asks the kernel for a copy of the packets on an interface. Filtering in user space would mean copying everything first, so **BPF** filters run inside the kernel, on each packet, before the copy. This is why a capture filter saves real CPU, and a display filter doesn't.

| | Capture filter | Display filter |
|---|---|---|
| Runs | In the kernel, during capture | In Wireshark, after capture |
| Language | BPF: `host 10.0.0.5 and port 443` | Wireshark's own: `ip.addr == 10.0.0.5 && tcp.port == 443` |
| If you get it wrong | The packet is gone for good | Change the filter and look again |

So capture wide when disk allows, and narrow with display filters. Reach for capture filters when traffic is heavy. Keep whole packets unless you have a reason not to: the default snap length in modern tcpdump captures the full packet, and truncating with `-s` can break later reassembly.

### tcpdump as a precise instrument

```
tcpdump -i eth0 -nn -w out.pcap 'host 10.0.0.5 and not port 22'
tcpdump -r out.pcap -nn 'tcp[tcpflags] & (tcp-syn|tcp-ack) == tcp-syn'
tcpdump -i eth0 -G 3600 -W 24 -C 100 -w 'cap-%H.pcap'
```

`-nn` skips name lookups, which matters because reverse DNS during an incident can tip off an attacker who controls that zone. BPF can also read raw bytes: `tcp[13]` is the flags byte, so `tcp[13] & 2 != 0` means SYN is set. The third line is a ring buffer, the usual way to keep the most recent hours on a busy sensor.

### tshark for scale

Wireshark loads everything into memory. For a big file, use `tshark` to extract fields into text and use the tools you already know:

```
tshark -r big.pcap -Y 'dns.flags.response == 0' -T fields -e dns.qry.name | sort | uniq -c | sort -rn | head
```

`capinfos` summarises a file, and `editcap` and `mergecap` split and join them. Wireshark's own menus remain the fastest way to orient yourself: *Statistics* shows conversations, endpoints and protocol hierarchy, and *Analyze > Expert Information* lists retransmissions and oddities.

### Decrypting TLS in your own lab

TLS 1.3 uses ephemeral keys, so a server's private key can't decrypt a capture. Instead, many clients will write their session secrets to a file if `SSLKEYLOGFILE` is set. Give that file to Wireshark under *TLS > (Pre)-Master-Secret log filename*, and the traffic decrypts. It's for debugging your own clients, and that key log file is as sensitive as the traffic itself.

### Advanced: what leaks without decryption

The **ClientHello** is sent in the clear. It carries the TLS version, cipher list, extensions and the server name (SNI), unless Encrypted Client Hello hides it. Different software makes different choices, so a hash of those choices works as a fingerprint.

| Method | Idea | Notes |
|---|---|---|
| **JA3** | MD5 of ClientHello fields in order | Published by Salesforce in 2017. Browsers randomising extension order weakened it |
| **JA3S** | Same for the ServerHello | Client and server together are stronger |
| **[JA4](https://github.com/FoxIO-LLC/ja4)** | Readable format, sorted extensions, covers QUIC | Designed to survive randomisation |

A fingerprint identifies a *TLS library and configuration*, not a person, and it isn't a verdict. Attackers can imitate a browser's handshake. Sizes and timing go further: research on encrypted traffic has inferred website visits and even speech patterns. So encryption hides content and much less of the behaviour.

**Flow records** give up content entirely, in exchange for covering everything cheaply. NetFlow and IPFIX record who talked to whom, how much and when. For a year of retention, flows are often the only thing you still have.

?? Why must a display filter be avoided for reducing load on a busy sensor?
+ It runs only after every packet has reached user space
- It can only match packets from a saved capture file
- It's unable to filter on IP addresses or on ports
- It silently deletes each of the packets it doesn't match
=> The kernel has already copied each packet by then. A BPF capture filter drops packets before that copy happens.

## Threat model

Sniffing is an attacker's technique too: [T1040](https://attack.mitre.org/techniques/T1040/). After reaching a host or a span port, or going on-path ([T1557](https://attack.mitre.org/techniques/T1557/)), they look for cleartext credentials, tokens, and internal protocols that were assumed to be private. Packet capture tools on a server are a finding, as is an interface suddenly in promiscuous mode.

Defenders capture to prove what happened. Logs state what a program claimed, whereas packets show what crossed the wire.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `tcpdump` | Captures on any Linux box | On a server, with no GUI |
| Wireshark | Deep dissection, stream following | Understanding one conversation |
| `tshark` | Wireshark's dissectors from the command line | Large files, scripting |
| Zeek | Turns traffic into structured logs | Continuous monitoring |
| Arkime | Indexes and stores full packet capture | Keeping history you can search |
| Scapy | Crafts and parses packets in Python | Experiments, custom parsers |

## Defence

- **Encrypt internal traffic.** Assume someone can capture on any segment, as Zero Trust does.
- **Protect capture points.** Span ports and sensors see everything, so they're high-value systems. Isolate their management.
- **Keep the right depth.** A common design is full packets for days, Zeek logs for weeks, and flows for a year.
- **Use fingerprints as enrichment, not as blocks.** A rare JA4 from a server that should only use one client is worth a look.
- **Watch for sniffing.** Alert on promiscuous mode, on `tcpdump` running on production, and on `CAP_NET_RAW` being added to a service.

## Pitfalls

- **Capturing on the wrong interface or side of NAT.** You'll think that traffic never happened. Check where your capture point sits.
- **Checksum errors on your own host.** Network cards often calculate checksums after capture (offloading), so outbound packets look wrong in Wireshark. They're usually fine.
- **Packet loss in the capture.** A dropped packet at the sensor can look like network loss. Check `tcpdump`'s "dropped by kernel" line.
- **Assuming a JA3 hash proves malware.** Common libraries share hashes with many legitimate programs.
- **Forgetting the law.** Capturing other people's traffic may be illegal interception, even for a good reason.

?? What can you conclude from one matching JA4 fingerprint alone?
+ The client's TLS stack resembles a known one
- The session came from a known criminal group
- The traffic's contents can now be read directly
- The host has certainly been infected by malware
=> A fingerprint describes how a TLS library is configured. Many unrelated programs can share it, and it can be imitated.

## Exercise

::: law Lab only
Capture only your own traffic in your own lab. Capturing other people's traffic without consent can be illegal interception, on a shared or university network too.
:::

1. Start a capture with `tcpdump -nn -w lab.pcap` on a lab VM, browse a few sites and resolve some names, then stop it.
2. Using only `tshark`, list the top 10 queried names, and every SNI: `tshark -r lab.pcap -Y 'tls.handshake.type == 1' -T fields -e tls.handshake.extensions_server_name`.
3. In Wireshark, compare *Statistics > Protocol Hierarchy* with your expectations. Explain anything that surprises you.
4. On a lab VM, set `SSLKEYLOGFILE=$HOME/keys.log`, run `curl https://example.com`, and capture it. Load the key file in Wireshark, then read the decrypted request. Delete the key file afterwards.
5. Write a BPF filter that captures SYN packets alone, with no SYN-ACKs. Test it with a simple connection, and explain the bytes it reads.

?! Design a retention plan for a 1 Gbps link with 5 TB of storage. Say what you'd keep (packets, Zeek logs, flows), for how long, and what question each layer answers.

## Further reading

- [Wireshark User's Guide](https://www.wireshark.org/docs/wsug_html_chunked/), and its display filter reference.
- [tcpdump and pcap-filter manuals](https://www.tcpdump.org/manpages/pcap-filter.7.html), the reference for BPF expressions.
- [JA4+ fingerprinting](https://github.com/FoxIO-LLC/ja4), the method and its specification.
- [Zeek documentation](https://docs.zeek.org/en/master/), for turning packets into logs.
- McCanne and Jacobson, [The BSD Packet Filter](https://www.tcpdump.org/papers/bpf-usenix93.pdf), the 1993 paper behind all of it.
