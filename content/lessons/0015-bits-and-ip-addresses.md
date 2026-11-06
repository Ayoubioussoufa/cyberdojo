---
title: Bits and IP addresses
summary: How computers count, what an IPv4 address really is, and which addresses are public or private.
month: 2
minutes: 25
builds: convert between binary and decimal, and read any IP address
source: Practical Networking, Ed Harmoush | https://www.practicalnetworking.net/
words: bit, byte, private address
---
Every attack and every defence on a network comes down to moving small numbered chunks of data from one address to another. To read that traffic you need to read the addresses, and they're made of bits.

@term bit = The smallest unit of data: a single 0 or 1.
@term byte = Eight bits, able to hold a number from 0 to 255.
@term binary = Counting with only two digits, 0 and 1.
@term IPv4 = The original internet addressing scheme, using 32-bit addresses like 192.168.1.10.
@term IPv6 = The newer addressing scheme, using 128-bit addresses like 2001:db8::1.
@term private address = An IP address reserved for internal networks, not reachable directly from the internet.
@term packet = One small chunk of data sent across a network, with addresses on the front.
@term network = Two or more devices connected so they can exchange data.

## Why binary

Inside a computer, everything is on or off, so everything is built from two digits. A single digit is a **bit**. Eight bits make a **byte**.

Each position in a byte has a value, doubling from right to left:

| 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |

Add up the positions holding a 1: 128 + 64 + 1 = **193**. To go the other way, take the biggest value that fits and repeat. For 200: 128 fits (72 left), 64 fits (8 left), 8 fits (0 left), so `11001000`.

With all eight bits on you get 255, so a byte holds 0 to 255. That's why you never see `192.300.1.1`.

@drill binary

?? What's the largest number that one byte can hold?
+ 255, when all eight bits are on
- 256, because bytes count upwards from one
- 128, the value of the highest bit
- 1024, because computers love powers of two
=> 128+64+32+16+8+4+2+1 = 255. Counting zero, that's 256 possible values.

## What an IPv4 address is

An **IPv4 address** is a 32-bit number. Humans write it as four bytes in decimal, separated by dots:

```
192      .168      .1        .10
11000000 .10101000 .00000001 .00001010
```

Think of it like a phone number: the first part says which network, and the last part says which device. How many bits belong to each part changes from network to network. That's what subnetting is about in the next lesson.

A **packet** carries a source and a destination address, like an envelope. Routers read the destination and pass it along, hop by hop.

?? How many bits are in an IPv4 address?
+ 32, written as four bytes
- 8, written as one byte
- 48, written in hexadecimal here
- 128, written with colons here
=> Four bytes of eight bits. 48 bits is a MAC address, and 128 bits is IPv6.

## Public and private addresses

Four billion IPv4 addresses aren't enough for every phone and laptop. So [RFC 1918](https://www.rfc-editor.org/rfc/rfc1918) sets aside ranges for private use. Anyone can reuse them internally, and they're never routed on the public internet:

| Range | Typical use |
|---|---|
| `10.0.0.0` – `10.255.255.255` | Large organisations |
| `172.16.0.0` – `172.31.255.255` | Medium networks, Docker |
| `192.168.0.0` – `192.168.255.255` | Home and small office |

Your laptop probably has a `192.168.x.x` address right now. A home router swaps it for one public address when traffic leaves. That's **NAT**, and you'll meet it properly in Month 3.

A few others you'll see:

| Address | Meaning |
|---|---|
| `127.0.0.1` | Loopback: this machine, talking to itself |
| `169.254.x.x` | Link-local: no address could be obtained. In clouds, `169.254.169.254` is the metadata service, which you'll learn to protect in Month 13 |
| `192.0.2.x`, `198.51.100.x`, `203.0.113.x` | [Reserved for documentation](https://www.rfc-editor.org/rfc/rfc5737), which is why this course uses them |

?? A log shows a login from `192.168.1.50`. What can you conclude?
+ It came from an internal private network address
- It came from a server located in Asia
- It came straight in from the public internet
- It was forged, since that address isn't valid
=> That's a private RFC 1918 address, so the source is on an internal network or behind a VPN. It might still be an attacker who's already inside.

?? Which of these can't be a valid IPv4 address?
+ `10.20.300.4`
- `172.31.255.255`
- `198.51.100.0`
- `192.0.2.1`
=> Each part is one byte, so it can't exceed 255.

## IPv6, briefly

IPv6 uses 128 bits, written in hexadecimal: `2001:db8::1`. There are enough addresses that NAT isn't needed. Here's what matters for security today: many networks run IPv6 quietly alongside IPv4, and [a defender who only monitors IPv4 has a blind spot](https://www.rfc-editor.org/rfc/rfc9099).

?! Explain why a home router lets ten devices share one public address, in your own words. It's fine to guess: your AI tutor will correct you.
