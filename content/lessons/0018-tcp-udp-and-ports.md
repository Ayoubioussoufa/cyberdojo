---
title: TCP, UDP and ports
summary: How programs talk across a network, the three-way handshake, flags, and what each looks like to a defender.
month: 2
minutes: 30
builds: explain the TCP handshake and read flags in a capture
source: RFC 9293, Transmission Control Protocol | https://www.rfc-editor.org/rfc/rfc9293
words: port, TCP handshake, socket
---
"Explain the TCP handshake" is a universal interview question. It also explains how port scanners work, why firewalls can tell a new connection from an old one, and why some attacks use UDP.

@term TCP = Transmission Control Protocol: reliable, ordered delivery with a connection set up first.
@term UDP = User Datagram Protocol: fast, connectionless delivery with no guarantee of arrival.
@term TCP handshake (three-way handshake) = The SYN, SYN-ACK, ACK exchange that opens a TCP connection.
@term socket = One end of a network connection: an IP address plus a port.
@term flag = A single bit in a TCP header that signals something, such as SYN, ACK, FIN or RST.
@term ephemeral port = A temporary high-numbered port that a client uses for one connection.

## Ports: which program?

An IP address finds a machine, and a **port** finds the program on it. Ports are numbers from 0 to 65535. Servers listen on [well-known ports](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml), and clients pick a random high **ephemeral port** for each connection. So a connection is identified by four values:

```
source IP : source port   →   destination IP : destination port
192.168.1.50:51234        →   93.184.216.34:443
```

See your own with `ss -tuln`, which lists what's listening.

@drill ports

## TCP: a phone call

**TCP** behaves like a phone call. You connect first, everything arrives in order, and lost pieces are sent again. Before any data moves, the two sides perform the handshake:

```
Client                         Server
  │  ── SYN  seq=100        ──▶  │   "Can we talk?"
  │  ◀─ SYN-ACK seq=300 ack=101  │   "Yes. Can you hear me?"
  │  ── ACK  ack=301        ──▶  │   "Yes."
```

Why three steps? Each side must prove it can both send and receive, and each picks a starting sequence number.

| Flag | Meaning |
|---|---|
| `SYN` | Start a connection |
| `ACK` | I received this |
| `FIN` | I'm done, closing politely |
| `RST` | Abort: nothing here, or something's wrong |
| `PSH` | Deliver this data now |

::: why What the handshake gives defenders and attackers
An open port answers SYN with SYN-ACK. A closed port answers with RST. A filtered port may not answer at all. That's how port scanners work: you'll use it with Nmap in Month 3. And because the handshake proves two-way contact, TCP is hard to spoof from a fake address.
:::

?? A scanner sends SYN to port 8080 and gets RST back. What does that tell you?
+ The host is up, the port closed
- The port is open, a service answered
- A firewall silently dropped that first probe
- The host itself is fully switched off
=> Something replied, so the host is alive, but nothing listens on that port. Silence would suggest filtering.

## UDP: a postcard

**UDP** has no handshake. You send a datagram and hope. There's no retransmission and no ordering, but it's fast and light. DNS, NTP and video calls use it.

| | TCP | UDP |
|---|---|---|
| Connection | Yes, handshake first | No |
| Delivery | Guaranteed, ordered | Best effort |
| Speed | More overhead | Lighter |
| Examples | HTTP, SSH, SMTP | DNS, NTP, VoIP, QUIC |
| Spoofing the source | Hard | Easy |

## Why UDP matters to a defender

Since nothing proves the sender's address, UDP enables **amplification**. An attacker sends a tiny request with the victim's address forged as the source, and a server sends a much bigger reply to the victim. Thousands of servers doing this make a flood. [Cloudflare's explainer](https://www.cloudflare.com/learning/ddos/dns-amplification-ddos-attack/) walks through the DNS version.

@term amplification = An attack where small forged requests make servers send large replies to a victim.

?? Why is UDP useful for amplification attacks, while TCP isn't?
+ UDP has no handshake to verify the source
- UDP packets are always larger than TCP ones
- TCP traffic can never cross the public internet
- UDP encrypts traffic, so filters can't see it
=> With no handshake, a server replies to whatever source address the packet claims.

## How a connection ends

A polite close uses FIN from each side. An abrupt one uses RST. Connections also pass through states you can see with `ss`: `LISTEN` means waiting, and `ESTABLISHED` means active. An unexpected `ESTABLISHED` to a strange address is worth investigating.

?! Explain the three-way handshake to a non-technical friend using your own analogy. Then say what an attacker learns from it.
