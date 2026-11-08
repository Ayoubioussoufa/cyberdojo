---
title: Sensors and TLS inspection
summary: Where to put network sensors, how TAPs differ from SPAN ports, what next-generation firewalls really add, and the honest trade-offs of breaking TLS to inspect it.
level: intermediate
side: defence
minutes: 45
attack: T1573, T1040
needs: 0023-ids-and-network-monitoring, 03-07-pki-in-depth
pair: 01-14-quic-and-http3, 07-06-vpn-internals
source: CISA, HTTPS Interception Weakens TLS Security | https://www.cisa.gov/news-events/alerts/2017/03/16/https-interception-weakens-tls-security
words: network TAP, SPAN port, TLS inspection
---
A detection rule can't fire on a packet the sensor never saw. So before tuning anything, ask where visibility comes from. Now that nearly everything is encrypted, there's a harder question too: should you break that encryption to look inside? Both are design decisions with real costs.

@term network TAP = A hardware device that copies every packet on a link to a monitoring port.
@term SPAN port = A switch port configured to receive a mirrored copy of other ports' traffic.
@term TLS inspection = Terminating TLS at a middlebox, reading the traffic, then opening a new TLS connection to the destination.
@term NGFW (next-generation firewall) = A firewall that adds application identification, user awareness and intrusion prevention to port-based filtering.

## Concept

### Fundamentals: placing sensors

Ask what question each location answers.

| Location | Sees | Misses |
|---|---|---|
| Internet edge, outside firewall | Everything aimed at you, much of it noise | Internal movement |
| Inside firewall | What got through, after NAT | The original internal source, if NAT sits inside |
| Server VLAN core | East-west traffic | Workstation-to-workstation |
| Host agent | Process context, plaintext | Devices with no agent |
| Cloud | VPC flow logs, traffic mirroring | Much of what managed services do |

Many intrusions never cross the Internet edge after the first step, so a perimeter-only sensor misses all of the [lateral movement](/modules/01-10-proxies-pivoting-and-tunnels/).

### TAP or SPAN

| | TAP | SPAN |
|---|---|---|
| Form | Hardware on the link | Switch configuration |
| Fidelity | Sees everything, including errors | Switch may drop copies under load |
| Failure | Passive TAPs fail safe | Depends on the switch |
| Cost | Hardware, and a change window | Free, instantly |

A busy full-duplex link can carry twice its speed in total, so one mirror port can't always keep up. Use SPAN to start, and a TAP where evidence quality matters. In the cloud, traffic mirroring or VPC flow logs take these roles.

### What an NGFW adds

Classic firewalls decide by address and port. An NGFW adds **application identification** by looking at traffic patterns, **user identity** from a directory, plus IPS and URL filtering. So a rule can say "allow Finance to use this SaaS app", instead of "allow 443". The price is complexity and cost, and its application ID is inference, so encrypted traffic reduces what it can tell. NGFWs and VPN appliances also sit on the edge with high privileges, which has made them prime targets. See [VPN internals](/modules/07-06-vpn-internals/).

### TLS inspection

To read HTTPS, a device must be in the middle. It presents a certificate from a company CA that's installed on managed devices, decrypts, inspects, then re-encrypts to the real server.

@flow Client > TLS to inspection proxy > Plaintext inspected > New TLS to the server

What you gain is real: malware delivery and data leaving over HTTPS become visible, and so does phishing content.

### Advanced: what it costs

**Weaker security, sometimes.** The client can no longer verify the real server: it trusts the proxy to do that. [Durumeric and others](https://zakird.com/papers/https_interception.pdf) (2017) found that many products lowered connection security, and CISA [warned](https://www.cisa.gov/news-events/alerts/2017/03/16/https-interception-weakens-tls-security) that some failed to validate certificates properly.

**A new crown jewel.** All plaintext passes through one box, and its CA key can impersonate any site to every employee. If it's breached, the attacker has everything.

**Breakage and blind spots.** Certificate pinning, mutual TLS and many apps fail, so you add exceptions, and attackers can hide in exceptions. QUIC and Encrypted Client Hello reduce visibility further.

**Law and ethics.** Reading employees' banking or health sessions raises legal issues, especially under [GDPR](/modules/12-05-eu-regulation/). Exempt those categories, and tell staff.

**Alternatives.** Metadata such as SNI, JA4 and timing, endpoint telemetry, and a secure web gateway agent on the device can often see the same plaintext with less risk. EDR and browser telemetry see content after decryption, at the only place it's already legitimately plain.

?? Why can a SPAN port miss packets under load?
+ The switch drops mirrored copies when oversubscribed
- The sensor encrypts packets before they arrive
- The mirror port rewrites every source address
- The switch copies only headers by default
=> A mirror port has one link's capacity, and a switch gives mirroring low priority. So copies are dropped when traffic peaks.

## Threat model

Attackers count on [encrypted channels](https://attack.mitre.org/techniques/T1573/) and on gaps between sensors. If they reach a span point or a proxy, they gain [network sniffing](https://attack.mitre.org/techniques/T1040/) at scale, so monitoring infrastructure is a target too. Keep its management network separate.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Suricata, Zeek | Network sensors | Open-source monitoring |
| Security Onion | A complete sensor distribution | A lab or small SOC |
| Arkime | Packet capture and search | Keeping history |
| VPC Flow Logs, Traffic Mirroring | Cloud visibility | Cloud networks |
| mitmproxy | An open-source TLS proxy | Studying inspection in a lab |
| `capinfos`, `ethtool -S` | Show capture and interface drops | Checking your sensor isn't missing traffic |

## Defence

- **Draw a visibility map.** For each network segment, write what sees it and what doesn't.
- **Measure drops** on sensors, and alert on them. Silent loss looks like a quiet network.
- **Isolate sensor management**, and use a one-way or receive-only capture interface.
- **If you inspect TLS:** use a strong internal CA with a protected key, validate upstream certificates strictly, block weak suites, log exemptions, exempt health and banking, and publish a policy.
- **Prefer endpoint visibility** where you own the device.

## Pitfalls

- **"We monitor the perimeter."** Attackers spend most of their time inside it.
- **Mirroring more than the port can carry.** You'll silently lose packets.
- **Inspecting without validating.** A proxy that accepts invalid certificates makes users less safe than no proxy.
- **Assuming inspection sees everything.** Exceptions, QUIC and pinned apps all bypass it.
- **Forgetting to decrypt for the IDS.** A sensor behind TLS sees only metadata, unless it gets the decrypted copy.

?? What does TLS inspection cost a company, even when it works?
+ A new trusted point holding all plaintext
- A permanent ban on every cloud service
- A full rewrite of its internal applications
- A legal duty to publish its keys
=> The proxy sees everything and can impersonate any site, so it becomes one of the most valuable systems to protect.

## Exercise

::: law Lab only
Run interception only on your own VMs. Intercepting other people's TLS without consent is illegal in many places.
:::

1. Install Security Onion, or Suricata and Zeek, on a VM. Mirror traffic from a lab bridge with `tc` or Open vSwitch. Confirm that the sensor sees it.
2. Install `mitmproxy`. Trust its CA on one client VM, browse, and read decrypted traffic.
3. On that client, view a site's certificate. Whose name is on the issuer line? What can the browser no longer check?
4. Try a pinned application or `curl --cacert` against the proxy, and record what breaks.
5. Draw a visibility map for your lab, marking each blind spot.

?! Your CISO wants to inspect all outbound TLS. Write the case for it, the case against it, and a recommendation with exemptions.

## Further reading

- [CISA alert on HTTPS interception](https://www.cisa.gov/news-events/alerts/2017/03/16/https-interception-weakens-tls-security).
- Durumeric and others, [The Security Impact of HTTPS Interception](https://zakird.com/papers/https_interception.pdf).
- [Security Onion documentation](https://docs.securityonion.net/).
- [NIST SP 800-92](https://csrc.nist.gov/pubs/sp/800/92/final), a guide to log management.
- [AWS VPC Traffic Mirroring](https://docs.aws.amazon.com/vpc/latest/mirroring/what-is-traffic-mirroring.html).
