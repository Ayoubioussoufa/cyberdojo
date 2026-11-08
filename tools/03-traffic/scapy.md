---
title: Scapy
summary: Builds, sends and decodes packets from Python.
side: both
use: own
docs: https://scapy.readthedocs.io/
kali: python3-scapy
alt: hping3, wireshark
---
## What it's for
Scapy is a Python library for working with packets. You can build any packet layer by layer, which makes it ideal for learning protocols and for testing your own defences.

## How it works
Packets are Python objects, and the `/` operator stacks layers. Scapy fills in sensible defaults, such as checksums. It sends packets through raw sockets, and matches answers to questions. So where other tools decide what's possible, here you write the logic yourself, even for a protocol you've just invented.

## Try it
::: law Your lab only
Sending crafted packets to other people's systems can be illegal, and can knock over fragile devices.
:::

```python
from scapy.all import IP, ICMP, sr1
reply = sr1(IP(dst="192.168.56.10") / ICMP(), timeout=2)
reply.show()
```

Run it as root inside a lab. Then change the TTL, and see what comes back.

## What defenders see
Crafted packets can be odd, with rare options or TTLs, and IDS rules look for those. Scapy is a great way to test those rules, by generating a known packet and checking that an alert fires. See [IDS rule writing](/modules/07-02-ids-rule-writing/).

?! How would you use Scapy to prove that a new IDS rule works?
