---
title: VPN internals
summary: How IPsec, WireGuard and OpenVPN really work, why their designs differ so much, and why the VPN appliance at your edge is so often the way in.
level: intermediate
side: defence
minutes: 50
attack: T1133, T1190, T1572
needs: 03-08-tls-internals, 0021-firewalls-and-segmentation
pair: 07-03-sensors-and-tls-inspection, 07-07-zero-trust-in-depth
source: RFC 4301, Security Architecture for the Internet Protocol | https://www.rfc-editor.org/rfc/rfc4301
words: IPsec, IKE, WireGuard
---
A VPN builds a private tunnel over a public network. The idea is simple, yet the three common designs barely resemble each other. Understanding why tells you a lot about protocol design. It also explains an uncomfortable fact: the box that's meant to protect remote access has become one of the most exploited devices on the Internet.

@term IPsec = A suite of protocols that authenticates and encrypts IP packets.
@term IKE (Internet Key Exchange) = The protocol that IPsec peers use to authenticate each other and agree keys.
@term ESP (Encapsulating Security Payload) = The IPsec protocol that encrypts and authenticates packets.
@term cryptokey routing = WireGuard's design, in which a peer's public key is tied to the addresses it may use.

## Concept

### Fundamentals: what a VPN must do

Any VPN solves the same four problems: authenticate the peers, agree on keys, encapsulate the packets, and route them. The differences lie in layer and complexity.

| | IPsec | OpenVPN | WireGuard |
|---|---|---|---|
| Layer | 3, in the kernel | User space over TLS | 3, in the kernel |
| Transport | ESP (IP protocol 50), or UDP 4500 | UDP or TCP | UDP |
| Key exchange | IKEv2 | TLS | Noise framework |
| Crypto agility | Large menus | Large menus | None: fixed choices |
| Code size | Very large | Large | About 4,000 lines in the kernel |

### IPsec

IPsec has two phases. **IKEv2** ([RFC 7296](https://www.rfc-editor.org/rfc/rfc7296)) authenticates the peers, with certificates or a pre-shared key, and creates **security associations**: one-way agreements on keys and algorithms, identified by an SPI. Then **ESP** ([RFC 4303](https://www.rfc-editor.org/rfc/rfc4303)) protects the data. An older protocol, AH, authenticates without encrypting.

| Mode | Protects | Typical use |
|---|---|---|
| Transport | The payload | Host to host |
| Tunnel | The whole original packet | Site to site |

NAT breaks protocols without ports, so **NAT traversal** wraps ESP in UDP 4500. IPsec is powerful, interoperable and standard across vendors. Its complexity is its weakness: many options, many misconfigurations. Avoid IKEv1 aggressive mode with pre-shared keys, because it exposes material that can be attacked offline.

### OpenVPN

OpenVPN carries a control channel of ordinary TLS, plus a data channel, in user space over one port. It's easy to run through firewalls, and it can use TCP 443. Running TCP inside TCP can cause bad performance, known as TCP meltdown, so prefer UDP.

### WireGuard

[WireGuard](https://www.wireguard.com/papers/wireguard.pdf) takes the opposite view to crypto agility. There's one set of primitives: Curve25519, ChaCha20-Poly1305, BLAKE2s. If one breaks, you upgrade the whole protocol. Each peer has a key pair, and **cryptokey routing** ties a public key to its allowed IPs. So a config is a short list of peers. There are no negotiation or downgrades. A peer that's not authenticated gets no response at all, so scanners can't see it. The small codebase is far easier to audit, and it's been formally analysed.

It has trade-offs for enterprises. There's no built-in user management or dynamic addressing, so that's added by tools such as Tailscale or Netbird. Static keys need rotating, and it has no post-quantum handshake by default, though a pre-shared key can be mixed in as a layer.

### Advanced: the edge device problem

SSL VPN appliances have become a top initial access route. CISA's [Known Exploited Vulnerabilities catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) repeatedly lists flaws in Ivanti, Fortinet, Palo Alto, Citrix and SonicWall gear. There are structural reasons:

- They face the Internet and parse complex, unauthenticated input.
- They hold credentials and sit inside your network.
- They run closed firmware with no EDR.
- Patching them needs an outage window.

A compromised gateway gives an attacker a trusted position, and often a stream of user credentials. That's why [Zero Trust](/modules/07-07-zero-trust-in-depth/) moves away from one big network entrance, and why CISA has [urged replacing SSL VPNs](https://www.cisa.gov/resources-tools/resources/modern-approaches-network-access-security) with modern access approaches.

?? What does ESP tunnel mode add over transport mode?
+ It encrypts the original IP header too
- It removes the need for any keys
- It replaces TCP with a faster protocol
- It forwards packets with no IP addresses
=> Tunnel mode wraps the whole original packet in a new one, which hides internal addresses between two gateways.

## Threat model

| Technique | ATT&CK |
|---|---|
| External remote services | [T1133](https://attack.mitre.org/techniques/T1133/) |
| Exploiting public-facing appliances | [T1190](https://attack.mitre.org/techniques/T1190/) |
| Tunnelling inside a VPN | [T1572](https://attack.mitre.org/techniques/T1572/) |

A VPN doesn't check that a laptop is clean. Once connected, a stolen session has whatever the network allows.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| strongSwan | IPsec on Linux | Site-to-site in a lab |
| `wg`, `wg-quick` | WireGuard tools | Small tunnels |
| OpenVPN | TLS-based VPN | Restrictive networks |
| `ike-scan` | Fingerprints IKE | Auditing your own gateway |
| Wireshark | Decodes IKE and ESP | Watching a handshake |
| CISA KEV | Lists exploited flaws | Prioritising edge patching |

## Defence

- **Patch edge devices first.** Treat a KEV entry on a gateway as an emergency, and subscribe to vendor advisories.
- **Require phishing-resistant MFA** on all remote access.
- **Limit what a VPN reaches.** Assign per-group access, and avoid full network access.
- **Hide management interfaces** from the Internet.
- **Log and forward**, as appliances can be wiped. Watch for new local accounts, and impossible travel in logins.
- **Consider ZTNA or WireGuard-based overlays** in place of a large SSL VPN appliance.
- **Keep the crypto strong.** Use IKEv2 and AEAD, and turn off IKEv1 and weak groups.

## Pitfalls

- **"VPN means secure."** It means encrypted to the gateway. What the user can reach next is a separate question.
- **Split tunnelling without thought.** It keeps the device on the Internet directly, and so bypasses your web filtering.
- **Shared pre-shared keys.** One leak compromises every peer.
- **Trusting a commercial VPN for privacy.** It moves your trust to the provider.
- **Assuming a patched device is clean.** If it was exploited before the patch, a backdoor may remain. Vendors publish integrity checks.

?? What does WireGuard's cryptokey routing tie together?
+ A peer's public key and allowed addresses
- A user's password and their home directory
- A server's certificate and its DNS name
- A client's MAC address and its VLAN
=> Each public key maps to the addresses that the peer may use, so identity and routing are one simple table.

## Exercise

::: law Lab only
Build tunnels only between your own VMs. Bypassing a network's rules with a VPN can break your school's or employer's policy.
:::

1. Set up WireGuard between two VMs. Capture on the outer interface: what can you see? Then capture on `wg0`.
2. Set up strongSwan between two more VMs. Capture the IKEv2 exchange, and find the SA and authentication steps.
3. Change `AllowedIPs` on one WireGuard peer, and work out why traffic stops.
4. Scan your WireGuard port with `nmap -sU`. Explain the result.
5. Look up three VPN appliance entries in CISA's KEV catalog. What did each one allow?

?! Your company runs an SSL VPN appliance with a new critical flaw and no patch. Write what you'd do in the first four hours.

## Further reading

- [RFC 4301](https://www.rfc-editor.org/rfc/rfc4301) and [RFC 7296](https://www.rfc-editor.org/rfc/rfc7296).
- [The WireGuard paper](https://www.wireguard.com/papers/wireguard.pdf).
- [OpenVPN documentation](https://openvpn.net/community-resources/).
- [CISA KEV catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog).
- [NIST SP 800-77r1](https://csrc.nist.gov/pubs/sp/800/77/r1/final), a guide to IPsec VPNs.
