---
title: Layer 2 attacks and switch defences
summary: Local networks were designed for trusted neighbours. See how VLANs, the MAC table, spanning tree and DHCP are abused, and which switch features answer each attack.
level: intermediate
side: both
minutes: 50
attack: T1557.002, T1557.003, T1040
needs: 0017-ethernet-arp-layers, 0019-dns-and-dhcp
pair: 07-04-network-architecture
source: NIST SP 800-115, Technical Guide to Information Security Testing | https://csrc.nist.gov/pubs/sp/800/115/final
words: 802.1Q, DHCP snooping, dynamic ARP inspection
---
Layer 2 has no login. Any device plugged into a port is believed: its MAC address, its ARP replies, its bridge messages and its DHCP offers. So an attacker who reaches the local network, through a wall socket or a compromised laptop, can often become the middle of everyone's traffic. Lesson 17 showed ARP spoofing. This is the rest of the family, and the switch features that end it.

@term 802.1Q = The Ethernet standard that adds a VLAN tag to a frame.
@term CAM table = The switch's table mapping MAC addresses to ports.
@term DHCP snooping = A switch feature that allows DHCP server messages only from trusted ports and records who holds which address.
@term dynamic ARP inspection = A switch feature that drops ARP messages which don't match the DHCP snooping table.
@term BPDU = The control message that switches exchange to run the spanning tree protocol.

## Concept

### Fundamentals: VLANs and trunks

A switch learns which MAC address sits on which port and stores that in its **CAM table**. A **VLAN** divides one switch into several logical ones. Between switches, a *trunk* link carries many VLANs by adding a 4-byte **802.1Q** tag to each frame. The tag's 12-bit VLAN ID allows 4094 usable VLANs. Frames on the trunk's *native VLAN* travel untagged.

A VLAN is a broadcast boundary. It's a security boundary only if the switch configuration holds and routing between VLANs is filtered.

### MAC flooding

The CAM table has finite room. Fill it with thousands of fake source addresses, and many switches can't learn new ones. Traffic to an unknown MAC is flooded out of every port, so the switch starts acting like a hub, and a sniffer sees frames that it shouldn't. The defence is to limit the number of MAC addresses per port.

### VLAN hopping

**Switch spoofing.** Some switches negotiate trunks automatically, using DTP on Cisco gear. A host that pretends to be a switch can be granted a trunk, and then reach every VLAN on it.

**Double tagging.** An attacker on the native VLAN sends a frame with two tags. The first switch strips the outer tag, because that's the native VLAN, and forwards it across the trunk. The next switch reads the inner tag and delivers it into the victim's VLAN. It works in one direction only, so replies don't return. That's still enough for one-way attacks.

### Spanning tree

Switched networks have redundant links, so loops are possible, and a loop would melt the network. **Spanning tree** elects a root bridge, the one with the lowest ID, and blocks redundant paths. Nothing authenticates a **BPDU**. A device can announce a better ID, become the root, and reshape where traffic flows. Malformed floods of BPDUs can destabilise the whole network.

### DHCP

A **rogue DHCP server** answers first and hands out the attacker's gateway or DNS, which puts them on-path for every new client. **Starvation** exhausts the real server's pool with fake requests, so the rogue server becomes the only one that answers.

### Advanced: the defences chain together

The defences are a stack, each building on the one below.

@flow DHCP snooping records MAC, IP and port > Dynamic ARP inspection validates ARP against it > IP Source Guard validates source addresses against it

Add **MACsec** (802.1AE), which encrypts and authenticates frames hop by hop, and **802.1X**, which authenticates a device before the port opens at all. Then layer 2 stops depending on trust in whatever plugs in. See Network architecture.

?? Why is double tagging limited to one direction?
+ Replies carry no double tag, so they stay in their VLAN
- Trunk links carry traffic in one direction at any one time
- Switches always drop any frame whose outer tag was stripped off
- The native VLAN encrypts replies with a key that attackers lack
=> The trick relies on the frame the attacker builds. The victim's reply is an ordinary frame, which goes nowhere near the attacker's VLAN.

## Threat model

These attacks assume local access: a physical port, compromised host, or guest network. They sit between initial access and credential theft.

| Technique | ATT&CK |
|---|---|
| ARP cache poisoning | [T1557.002](https://attack.mitre.org/techniques/T1557/002/) |
| DHCP spoofing | [T1557.003](https://attack.mitre.org/techniques/T1557/003/) |
| Sniffing after flooding | [T1040](https://attack.mitre.org/techniques/T1040/) |

Being on-path lets an attacker capture credentials from cleartext protocols, relay authentication, or downgrade connections. See [LAN and legacy protocols](/modules/01-08-lan-and-legacy-protocols/).

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Wireshark | Shows ARP, STP and DHCP on the wire | Seeing what's happening on a segment |
| `arpwatch` | Reports changes in MAC-to-IP pairs | Low-cost ARP monitoring |
| `ip neigh` | Shows the host's ARP table | Checking a gateway's MAC address |
| `bridge`, `ovs-vsctl` | Linux and Open vSwitch switching | Building a virtual lab with VLANs |
| Scapy | Builds any frame | Reproducing a concept in a lab |
| Yersinia, bettercap | Layer 2 attack frameworks | Authorised testing only, to prove a control works |

## Defence

| Attack | Control |
|---|---|
| MAC flooding | Port security: limit MAC addresses per port |
| Switch spoofing | Disable auto-negotiation. Set access ports explicitly, with DTP off |
| Double tagging | Use an unused VLAN as native, and tag the native VLAN on trunks |
| Rogue root bridge | BPDU Guard on edge ports, Root Guard toward the access layer |
| Rogue DHCP, starvation | DHCP snooping with rate limits |
| ARP spoofing | Dynamic ARP inspection |
| Rogue device | 802.1X, and shut unused ports |
| Passive tapping | MACsec, or TLS everywhere above |

**Detection.** Switches log port-security violations, DAI drops, and BPDU Guard errors. Send those to your SIEM: they're rare and high-signal. Also watch for two MACs claiming a gateway's IP, and for DHCP offers from an unknown server.

## Pitfalls

- **"VLANs are a firewall."** They separate broadcast domains. Without filtering between VLANs, a router will join them happily.
- **"Switches make sniffing impossible."** Flooding, spoofing and port mirrors all defeat that.
- **"Wi-Fi is different."** Clients on one access point often share a broadcast domain unless client isolation is on.
- **Enabling DAI before snooping.** Without a binding table, it drops legitimate ARP traffic, and static hosts need explicit entries. Roll out in monitor mode first.
- **Trusting one control.** 802.1X can be bypassed by hiding behind an authorised device unless MACsec or similar protects the session.

?? Which control depends on the DHCP snooping binding table?
+ Dynamic ARP inspection
- Port security limits
- BPDU Guard filtering
- Root Guard protection
=> Dynamic ARP inspection checks each ARP message against the MAC, IP and port pairs that DHCP snooping recorded. That's also why it can't be enabled first.

## Exercise

::: law Lab only
These techniques disrupt real networks and intercept other people's traffic. Use isolated VMs, for instance Open vSwitch or GNS3 on a host-only network, and never a network that you share.
:::

1. Build two VLANs on Open vSwitch with one VM on each. Confirm they can't ping each other, and capture on a trunk port to find the 802.1Q tag in Wireshark.
2. Add a third VM with `arpwatch`, then restart a VM and read what it logs.
3. Run two DHCP servers on the same segment in your lab, and watch which one a client chooses. Now write down the switch feature that would stop the second server, and explain how it decides which port to trust.
4. Compare the ARP table on a client with a capture of ARP traffic. Write a Zeek or Wireshark filter that shows any IP claimed by two MACs.
5. On paper, design the port configuration for an office access switch: access VLAN, native VLAN, BPDU Guard, DHCP snooping, DAI and 802.1X.

?! A penetration test report says "attacker gained on-path position from a meeting-room wall port". List the controls, in order, that you would deploy, and say which failure each one covers.

## Further reading

- [NIST SP 800-115](https://csrc.nist.gov/pubs/sp/800/115/final), for how technical testing is planned and scoped.
- [RFC 2131](https://www.rfc-editor.org/rfc/rfc2131), the DHCP specification.
- [RFC 826](https://www.rfc-editor.org/rfc/rfc826), the short ARP specification.
- Fred Baker and others, [RFC 3704](https://www.rfc-editor.org/rfc/rfc3704), on filtering spoofed traffic at the network edge.
