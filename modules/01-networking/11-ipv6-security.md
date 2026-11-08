---
title: IPv6 security
summary: IPv6 replaces ARP, DHCP assumptions and address scanning with new mechanisms and new attacks. It's probably already running on your network, whether you meant it to be or not.
level: advanced
side: both
minutes: 50
attack: T1557, T1046
needs: 01-02-ip-layer-and-icmp, 01-04-layer-2-attacks
pair: 07-01-iptables-and-nftables
source: RFC 8200, Internet Protocol Version 6 | https://www.rfc-editor.org/rfc/rfc8200
words: NDP, SLAAC, router advertisement
---
Most operating systems enable IPv6 by default and often prefer it. So a network whose firewalls, monitoring and policies were all written for IPv4 may have a second, unwatched network running over the same wires. That gap, not any flaw in IPv6 itself, is where most of the risk lives.

@term NDP (Neighbor Discovery Protocol) = The ICMPv6-based protocol that replaces ARP and also finds routers and prefixes.
@term SLAAC = Stateless address autoconfiguration: a host builds its own IPv6 address from a router's advertised prefix.
@term router advertisement = An ICMPv6 message in which a router announces itself and the network's prefix.
@term RA Guard = A switch feature that blocks router advertisements from ports that shouldn't send them.

## Concept

### Fundamentals: what changed

Addresses are 128 bits, written in hex groups, with `::` standing for a run of zeros. An interface normally holds several at once.

| Range | Meaning |
|---|---|
| `fe80::/10` | Link-local, on every interface, never routed |
| `fc00::/7` | Unique local, private use |
| `2000::/3` | Global unicast, publicly routable |
| `ff00::/8` | Multicast |

There's no broadcast and, in the usual design, no NAT. Each host may have a publicly routable address, so the implicit "protection" of IPv4 NAT is gone, and a stateful firewall has to do that job on purpose.

The header is simpler: 40 bytes, with no checksum and no fragmentation by routers. Hop Limit replaces TTL. Options move to chained **extension headers**.

### NDP replaces ARP

| Message | ICMPv6 type | Purpose |
|---|---|---|
| Router Solicitation | 133 | "Any routers here?" |
| Router Advertisement | 134 | "I'm a router, here's the prefix" |
| Neighbor Solicitation | 135 | "Who has this address?" (like ARP) |
| Neighbor Advertisement | 136 | "I do" |
| Redirect | 137 | "Use this gateway instead" |

**SLAAC** lets a host pick an address from an advertised prefix with no server involved. Early versions embedded the MAC address in the address (EUI-64), which let hosts be tracked as they moved between networks. Privacy extensions ([RFC 8981](https://www.rfc-editor.org/rfc/rfc8981)) use random, temporary addresses, which helps privacy, and complicates log analysis.

### Attacks

Like ARP, NDP has no authentication by default.

**Rogue router advertisements.** Anyone on the link can announce themselves as a router with a better preference. Hosts adopt that route, which puts the attacker on-path for every IPv6 flow. It's like rogue DHCP, but with no server to outrun.

**Rogue DHCPv6.** Windows asks for DHCPv6 by default even on IPv4-only networks. If an attacker answers, they become the host's DNS server, and name resolution then gives them a route to capture or relay authentication. The `mitm6` tool demonstrates this, and it's a [well-documented path](https://blog.fox-it.com/2018/01/11/mitm6-compromising-ipv4-networks-via-ipv6/) in Windows networks. Note that this attacks an **IPv4 network** through IPv6 that nobody configured.

**Tunnels.** Transition methods like Teredo and 6to4 can wrap IPv6 in IPv4 or UDP, which carries traffic past filters that only know IPv4.

### Advanced: scanning and extension headers

A single `/64` holds 2^64 addresses, so brute force scanning is hopeless. Attackers don't do that. They use DNS, certificate logs, patterns such as `::1`, low-byte addresses, and hitlists built from observed traffic. On the local link, one multicast ping to `ff02::1` reveals every neighbour.

Extension headers cause trouble for inspection. A firewall must walk a chain of unknown length to find the transport header. Long chains or fragmented headers have been used to dodge filters. [RFC 7112](https://www.rfc-editor.org/rfc/rfc7112) requires that the entire header chain sit in the first fragment, and hardware that can't parse the chain often drops such packets, so policy has to decide.

?? A network is declared IPv4 only, but laptops have `fe80::` addresses. What's the risk?
+ Hosts can be attacked over unmonitored IPv6 on the link
- Packets fail as IPv6 addresses collide with the IPv4 ones
- The addresses can be routed directly from the public Internet
- Laptops will send their IPv4 traffic through a slower path
=> Link-local IPv6 works out of the box. An attacker on that link can use NDP and DHCPv6 while IPv4-only tools see nothing.

## Threat model

| Stage | Technique | ATT&CK |
|---|---|---|
| Discovery | Multicast pings, hitlists | [T1046](https://attack.mitre.org/techniques/T1046/) |
| Credential access | On-path through rogue RA or DHCPv6 | [T1557](https://attack.mitre.org/techniques/T1557/) |
| Stealth | Tunnels and dual-stack blind spots | No specific technique, though the effect matches protocol tunnelling |

This attack assumes a position on the local link, as in [Layer 2 attacks](/modules/01-04-layer-2-attacks/).

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `ip -6 addr`, `ip -6 route`, `ip -6 neigh` | Show IPv6 state | Checking what's really configured |
| `ping -6 ff02::1%eth0` | Multicast ping to the link | Finding neighbours |
| `rdisc6` | Requests router advertisements | Seeing who claims to be a router |
| Nmap `-6` | Scans IPv6 targets | Testing your own firewall |
| THC-IPV6, `mitm6` | IPv6 attack toolkits | Authorised tests in a lab |
| Wireshark | Decodes ICMPv6 and NDP | Reading the messages |

## Defence

**Decide, don't default.** Either run IPv6 properly, or disable it deliberately where it isn't used. Microsoft [advises preferring IPv4 over IPv6](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/configure-ipv6-in-windows) through a registry setting rather than disabling it outright, since some components expect it.

**Secure the link.**

- **RA Guard** ([RFC 6105](https://www.rfc-editor.org/rfc/rfc6105)) and **DHCPv6 Guard** on access ports.
- ND inspection, the IPv6 cousin of dynamic ARP inspection.
- SEND ([RFC 3971](https://www.rfc-editor.org/rfc/rfc3971)) adds cryptographic protection, though few systems implement it.

**Match your IPv4 policy.** Every firewall rule needs an IPv6 twin, and a stateful default deny inbound replaces what NAT did by accident. On Linux, `inet` tables in nftables hold one ruleset for both families. Don't drop ICMPv6 wholesale: it's essential here, as NDP and path MTU depend on it. [RFC 4890](https://www.rfc-editor.org/rfc/rfc4890) lists what to allow.

**Monitor.** Make sure your IDS, SIEM parsers and asset tools understand IPv6. Log neighbour tables, because privacy addresses change. Without that mapping, an IPv6 address in a log can't be tied to a machine. Alert on any new router on a segment.

## Pitfalls

- **"We don't use IPv6."** Your hosts probably do, on the link at least.
- **"NAT was our security."** It was a side effect. Replace it with an explicit firewall.
- **"IPv6 is too big to scan."** Attackers don't scan it blindly.
- **"Block ICMPv6 like ICMP."** You'll break the network in hard-to-diagnose ways.
- **"Our logs cover it."** Check whether your tools parse, store and search these addresses, including the compressed forms.

?? Why must an IPv6 network not simply drop all ICMPv6?
+ NDP and path MTU discovery both depend on it
- Hosts lose the IPv4 routes they learned from ICMPv6
- Routers need it to encrypt all the link-local traffic
- All DNS replies are carried inside ICMPv6 error messages
=> ICMPv6 carries Neighbor Discovery, and routers don't fragment in IPv6. Drop it and basic connectivity fails.

## Exercise

::: law Lab only
Run this on an isolated lab network. Rogue advertisements disrupt everyone on a segment, so never send them on a shared network.
:::

1. On two lab VMs, list IPv6 addresses with `ip -6 addr`. Identify each kind, then ping one VM's link-local address from the other, naming the interface.
2. Capture while running `ping -6 ff02::1%eth0`. Find the Neighbor Solicitation and Advertisement messages.
3. Run `radvd` on a lab VM to act as a router. Watch a second VM configure itself by SLAAC, then read its routing table.
4. Write a firewall that allows outbound and established traffic, and denies new inbound, for both families, in one nftables `inet` table. Test it using `nmap -6`.
5. Search your lab SIEM or logs for an IPv6 address. Does the parser store it? Does a search for its full form find its compressed one?

?! You're asked to "turn off IPv6 to be safe" across 5,000 Windows laptops. Write a short reply covering what you'd actually recommend, and why.

## Further reading

- [RFC 8200](https://www.rfc-editor.org/rfc/rfc8200), the IPv6 specification.
- [RFC 4861](https://www.rfc-editor.org/rfc/rfc4861), on Neighbor Discovery.
- [RFC 9099](https://www.rfc-editor.org/rfc/rfc9099), operational security considerations for IPv6.
- [mitm6 write-up by Fox-IT](https://blog.fox-it.com/2018/01/11/mitm6-compromising-ipv4-networks-via-ipv6/), on the real risk to IPv4 networks.
- [NIST SP 800-119](https://csrc.nist.gov/pubs/sp/800/119/final), guidelines for secure deployment of IPv6.
