---
title: Layers, Ethernet and ARP
summary: The layer model everyone uses, how data moves on a local network, and how ARP spoofing abuses that trust.
month: 2
minutes: 30
builds: explain ARP spoofing and how it appears in traffic, an exit-gate item
source: RFC 826, the Address Resolution Protocol | https://www.rfc-editor.org/rfc/rfc826
words: MAC address, ARP, switch
---
Networking would be impossible to reason about without layers. Each one solves one problem and trusts the layer below. Attackers love the gaps between them, and the first gap you'll see is ARP.

@term protocol = An agreed set of rules for how two systems communicate.
@term OSI model = A seven-layer reference model of networking, used mostly as shared vocabulary.
@term TCP/IP model = The four-layer model that describes how the internet actually works.
@term encapsulation = Wrapping data in a header at each layer, like an envelope inside an envelope.
@term MAC address = A hardware address on a network card, used to deliver frames on a local network.
@term frame = A chunk of data on a local network, addressed by MAC.
@term switch = A device that forwards frames between machines on the same local network.
@term router = A device that forwards packets between different networks.
@term ARP = Address Resolution Protocol: finds the MAC address that belongs to an IP on the local network.
@term VLAN = A way of splitting one physical switch into separate virtual networks.
@term MITM (man in the middle) = An attack where someone secretly sits between two parties and relays or changes their traffic.

## Layers: envelopes inside envelopes

| TCP/IP layer | OSI layers | Job | Examples | Address |
|---|---|---|---|---|
| Application | 7, 6, 5 | What the programs are saying | HTTP, DNS, SSH | Names, URLs |
| Transport | 4 | Which program, and reliability | TCP, UDP | Ports |
| Internet | 3 | Which machine, across networks | IP, ICMP | IP addresses |
| Link | 2, 1 | The next hop on this wire | Ethernet, Wi-Fi | MAC addresses |

@stack
Application | HTTP, DNS, SSH | your data
Transport | TCP, UDP | adds ports
Internet | IP | adds addresses
Link | Ethernet, Wi-Fi | adds MAC addresses

When you send data, each layer wraps it with its own header. This is **encapsulation**, like putting a letter in an envelope, then in a bigger envelope. Each router opens only as far as it needs to.

@flow HTTP request > TCP header added > IP header added > Ethernet frame sent

People say "layer 3" or "layer 7" all the time, using OSI numbers: layer 2 means switching, layer 3 means routing, layer 4 means ports, layer 7 means applications.

@drill layers

?? Which layer's address changes at each hop?
+ The Link layer's MAC addresses
- The Internet layer's IP addresses
- The Transport layer's port numbers
- The Application layer's web addresses
=> A frame only travels one hop, so routers build a new one each time. The IP addresses stay the same.

## MAC addresses and switches

An IP address says where a packet is finally going. A **MAC address** says who gets it on *this* wire. It's 48 bits, written like `aa:bb:cc:11:22:33`, and it only matters on the local network.

A **switch** learns which MAC address sits on which port, and it sends each frame only there. A **router** connects networks: it strips the frame, reads the IP packet, and builds a new frame for the next hop.

::: key
The IP addresses stay the same for the whole journey. The MAC addresses change at every hop.
:::

?? A packet goes from your laptop through a router to a server. What does your laptop use as the destination MAC?
+ The MAC address of the local router
- The MAC address of the final server
- The MAC address of the internet provider
- No MAC address, because routers ignore them
=> MAC addresses only work locally. Your laptop hands the frame to the router, and the router builds a new frame for its next hop.

## ARP: "who has this IP?"

Your laptop knows the router's IP but needs its MAC. So it shouts to everyone on the local network, using [ARP](https://www.rfc-editor.org/rfc/rfc826):

```
Who has 192.168.1.1? Tell 192.168.1.50.         broadcast
192.168.1.1 is at aa:bb:cc:11:22:33.            reply
```

Your laptop stores the answer in a cache. See yours with `ip neigh`.

?? Why does a laptop need ARP before talking to its router?
+ It knows the IP, but needs the MAC
- It knows the MAC, but needs the IP
- It needs a password to join the network
- It needs the router to assign a port
=> Frames on the local wire are addressed by MAC, so an IP address alone isn't enough.

## ARP spoofing

Here's the flaw: **ARP has no authentication.** Anyone on the local network can answer, even without being asked, and machines generally believe the reply.

An attacker on your network sends: "192.168.1.1 is at *my* MAC." Your laptop updates its cache and sends its traffic to the attacker, who passes it on so nothing looks wrong. That's a **man-in-the-middle** position.

@flow Victim > Attacker's machine > Real router > Internet

**How it looks in traffic:**

- Lots of unrequested ARP replies.
- One MAC address claiming two IP addresses.
- The gateway's MAC suddenly changing.

**Defences:** Dynamic ARP Inspection on managed switches, network segmentation, and above all encryption. With TLS, an attacker in the middle sees only scrambled data.

::: law
ARP spoofing on a network you don't own, including a café or university Wi-Fi, is an attack on other people's traffic. Only try it between your own lab VMs.
:::

?? Why does ARP spoofing work at all?
+ ARP replies are accepted without any authentication
- Switches forward all traffic to every port
- IP addresses change every time you reconnect
- Routers publish their passwords on local networks
=> ARP was designed for a trusted network. Many old protocols share this flaw, and it's a pattern you'll see again.

## VLANs

A **VLAN** splits one physical switch into several virtual ones. Guests, staff and servers can share hardware but not a network, and traffic between them has to pass through a router or firewall where it can be checked. You'll build this kind of segmentation in Month 3.

?! In Wireshark, how would you recognise ARP spoofing? Describe what you'd look for.

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [Wireshark wiki: ARP, with sample captures](https://wiki.wireshark.org/AddressResolutionProtocol)
- [MITRE ATT&CK T1557.002, ARP cache poisoning, with detections](https://attack.mitre.org/techniques/T1557/002/)
