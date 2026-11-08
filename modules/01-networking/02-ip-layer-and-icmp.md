---
title: The IP layer and ICMP
summary: Every field in an IPv4 header exists for a reason, and most have been abused. Learn TTL, fragmentation and ICMP as a defender who can read them.
level: foundation
side: both
minutes: 45
attack: T1095, T1046
needs: 0015-bits-and-ip-addresses, 0016-subnetting, 0017-ethernet-arp-layers
pair: 0020-reading-packets
source: RFC 791, Internet Protocol | https://www.rfc-editor.org/rfc/rfc791
words: TTL, fragmentation, path MTU discovery
---
IP makes one promise: it will try. It delivers each packet independently, with no guarantee of arrival, order or truth. Almost everything interesting about network security follows from that last word, because nothing in an IP header proves that it's honest.

@term MTU (maximum transmission unit) = The largest packet a link can carry in one piece.
@term path MTU discovery = Finding the smallest MTU on a route by sending packets marked "don't fragment" and watching for errors.

## Concept

### Fundamentals: reading the header

An IPv4 header is usually 20 bytes. These are the fields worth knowing.

| Field | Job | Security angle |
|---|---|---|
| Version, IHL | IPv4, and the header length | Options lengthen the header, and some parsers mishandle them |
| Total length | Size of the whole packet | Disagreement with reality was the root of old crashes |
| Identification | Groups a packet's fragments | A counter on some systems, which leaks information (idle scan) |
| Flags, offset | DF, MF, position of a fragment | Overlaps and tiny fragments confuse sensors |
| TTL | Hop limit, reduced by one at each router | Hints at the sender's OS and distance |
| Protocol | What's inside: 1 ICMP, 6 TCP, 17 UDP | Lets a firewall choose its rules |
| Source, destination | Addresses | The source isn't verified by anything |

**TTL** stops looping packets, and it isn't a time any more. Each router decrements it, and at zero drops the packet and may send an ICMP *time exceeded* back. Traceroute turns this into a map: it sends packets with TTL 1, 2, 3 and so on, and each router that kills one reveals itself.

Operating systems start from different values, commonly 64 for Linux, 128 for Windows and 255 for network gear. So a packet arriving with TTL 118 probably came from a Windows host about ten hops away. It's a hint, not proof, because a sender can set any TTL.

### Fragmentation

If a packet is larger than the next link's MTU, a router can split it, and only the final destination reassembles it. Modern hosts avoid this. They set the **DF** (don't fragment) bit, and a router that can't forward the packet drops it and returns ICMP type 3, code 4, *fragmentation needed*. That's **path MTU discovery**, and it's why "block all ICMP" is bad advice: drop those messages and large packets vanish silently while small ones work. The symptom is a connection that opens and then hangs.

### Advanced: why fragments fool sensors

Reassembly isn't fully specified. When fragments overlap, operating systems have historically disagreed on which bytes win. A sensor that reassembles differently from the target sees a different stream, and can be fooled. Ptacek and Newsham [described this class in 1998](https://users.ece.cmu.edu/~adrian/731-sp04/readings/Ptacek-Newsham-ids98.pdf): *insertion* (the sensor accepts what the target rejects) and *evasion* (the target accepts what the sensor rejects). A low TTL gives the same effect, as a packet can reach the sensor but expire before the target.

The lesson outlives the technique: **a monitor sees what it reconstructs, not what the endpoint sees.** Modern IDS engines model the target's behaviour to reduce this.

### ICMP

ICMP is IP's error and control channel.

| Type | Meaning |
|---|---|
| 0 / 8 | Echo reply / request (ping) |
| 3 | Destination unreachable, with a code saying why |
| 5 | Redirect: "use this other gateway" |
| 11 | Time exceeded (traceroute) |

?? A TCP session opens, then hangs on the first large transfer. A new firewall rule drops all ICMP. What's the likely cause?
+ Path MTU discovery lost its fragmentation needed messages
- The handshake failed since ICMP carries SYN packets
- TTL values reached zero once ping was blocked
- Routers stopped forwarding TCP once ICMP was filtered
=> Small packets, including the handshake, pass. Large ones with DF set get dropped, and the error that would say so is filtered.

## Threat model

Because the source address is unverified, **spoofing** is possible wherever networks don't filter it. That makes blind attacks and reflection possible, as in [Denial of service](/modules/01-13-denial-of-service/).

ICMP has a payload field that few people inspect, so it can carry data for covert channels. That's [T1095](https://attack.mitre.org/techniques/T1095/), a non-application-layer protocol used for command and control. Ping sweeps and TTL analysis support discovery ([T1046](https://attack.mitre.org/techniques/T1046/)). ICMP redirects can reroute a host's traffic on a local network if the host accepts them.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `ip addr`, `ip route` | Show addresses and routing | Checking what a host believes about the network |
| `ip route get <addr>` | Shows the route for one destination | Answering "which interface would this use?" |
| `ping -M do -s <size>` | Linux ping with DF set | Measuring path MTU by hand |
| `traceroute`, `tracepath`, `mtr` | Map the hops | `tracepath` also reports path MTU, and `mtr` shows loss over time |
| Wireshark | Decodes every field | Reading what the summary hides |
| Scapy | Builds and dissects packets | Lab experiments with header fields |

## Defence

- **Filter spoofed sources at the edge.** [BCP 38 (RFC 2827)](https://www.rfc-editor.org/rfc/rfc2827) is the standard: don't let packets leave with a source you don't own. Unicast reverse-path forwarding does this on routers, and `rp_filter` does it on Linux.
- **Filter ICMP by type, not wholesale.** Allow fragmentation-needed and time-exceeded. Drop redirects at the edge.
- **Ignore redirects on hosts.** On Linux, set `net.ipv4.conf.all.accept_redirects=0`.
- **Normalise traffic.** Reassemble at a firewall or sensor before inspection, and drop overlapping fragments, which have no good reason to exist.
- **Watch for oddities.** ICMP echoes with large or high-entropy payloads, or steady volume to one host, are worth a hunt rule. See Threat hunting.

## Pitfalls

- **"TTL is a number of seconds."** Not in practice: it's a hop count.
- **"Blocking ping makes a host invisible."** Other probes still answer. Nmap treats ping as just one discovery method.
- **"A source IP identifies the sender."** For a completed TCP session it means something. For a single UDP or ICMP packet it means nothing.
- **"Traceroute shows the path."** It shows one path, for one protocol and moment. Routers may hide, and load balancers split the probes. `mtr` over time shows more.
- **Trusting TTL for OS identification.** It's a clue to combine with others.

?? Which value best suggests a Windows host about ten hops away?
+ An arriving TTL of about 118
- An arriving TTL of about 54
- An arriving TTL of about 245
- An arriving TTL of about 11
=> Windows commonly starts at 128, and ten routers bring that down to 118. It's still only a hint, as a sender can set any value.

## Exercise

::: law Lab only
Do this between your own lab VMs on a host-only network. Don't send crafted or malformed packets to networks you don't own.
:::

1. Run `ip route get 1.1.1.1` on a lab VM and explain each word of the output.
2. Capture ICMP in Wireshark while running `ping` between two VMs. Find the identifier, the sequence number and the TTL. Work out the sender's starting TTL.
3. Find your link's MTU by hand. Use `ping -M do -s 1472 <peer>`, since 1472 + 8 (ICMP) + 20 (IP) = 1500. Add one, and read the error.
4. Lower one VM's MTU with `sudo ip link set dev <if> mtu 1200`. Repeat step 3, then run `tracepath`. Restore it afterwards.
5. Add a firewall rule that drops all ICMP, and try a large `curl` download through it from another VM. Write down what fails and why, then remove the rule.

?! Your company's firewall policy says "drop all ICMP for security". Write three sentences to the team that owns it, saying what this breaks, and exactly what you'd allow instead.

## Further reading

- [RFC 791](https://www.rfc-editor.org/rfc/rfc791), the IPv4 specification, which is short and readable.
- [RFC 792](https://www.rfc-editor.org/rfc/rfc792), for ICMP.
- [RFC 2827](https://www.rfc-editor.org/rfc/rfc2827), on source address filtering.
- Ptacek and Newsham, [Insertion, Evasion, and Denial of Service](https://users.ece.cmu.edu/~adrian/731-sp04/readings/Ptacek-Newsham-ids98.pdf), the classic IDS evasion paper.
- [The Scapy documentation](https://scapy.readthedocs.io/), for experiments with headers in your lab.
