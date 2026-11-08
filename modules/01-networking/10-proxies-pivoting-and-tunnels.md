---
title: Proxies, pivoting and tunnels
summary: How traffic gets relayed through hosts and hidden inside other protocols, why one foothold can open a whole network, and how to catch east-west movement.
level: advanced
side: both
minutes: 55
attack: T1090.001, T1090.002, T1572, T1021
needs: 01-09-ssh-internals-and-forwarding, 01-01-netcat-and-socat, 0021-firewalls-and-segmentation
pair: 01-09-ssh-internals-and-forwarding, 07-04-network-architecture, 08-02-threat-hunting
source: RFC 1928, SOCKS Protocol Version 5 | https://www.rfc-editor.org/rfc/rfc1928
words: pivot, SOCKS proxy, east-west traffic
---
Segmentation assumes that a firewall stands between two networks. But one machine with a foot in both is a bridge, and an attacker who controls it can route through it. Pivoting is the name for that, and tunnelling is how the traffic hides on the way. These are also the skills of any network engineer, which is why telling them apart in logs takes care.

@term pivot = Using a compromised host to reach networks that the attacker can't reach directly.
@term SOCKS proxy = A proxy that relays any TCP or UDP connection for a client, without understanding the protocol inside.
@term east-west traffic = Traffic between hosts inside a network, as opposed to traffic in and out of it.
@term dual-homed host = A machine with interfaces on two networks.

## Concept

### Fundamentals: kinds of proxy

A proxy makes a connection on your behalf, and the kinds differ in who it serves.

| Type | Serves | Example |
|---|---|---|
| Forward | Clients going out | A company web proxy |
| Reverse | Servers being reached | Nginx in front of an app |
| Transparent | Clients, who don't know | Network-level interception |
| SOCKS | Any client, any TCP or UDP | `ssh -D`, Tor's local port |

An HTTP proxy understands HTTP, and the `CONNECT` method asks it for a raw tunnel, which is how HTTPS passes through. SOCKS5 ([RFC 1928](https://www.rfc-editor.org/rfc/rfc1928)) works one layer lower, so it can carry anything. Applications must be pointed at it, or wrapped by a tool such as `proxychains`, which redirects their socket calls.

### Three levels of relay

| Level | What moves | Limitation |
|---|---|---|
| Port forward | One port to one destination | Needs one rule per service |
| SOCKS proxy | TCP, and sometimes UDP, to anywhere | Needs application support, and no raw packets |
| Layer 3 tunnel (TUN) | Whole IP packets | Requires more setup, feels like a real route |

A TUN interface makes a remote network look local. Tools like `ligolo-ng` and VPN software work this way. The practical difference is scanning. Nmap's SYN scan needs raw packets, so it can't pass through a SOCKS proxy. It has to fall back to a slow connect scan, and a TUN route doesn't have that problem.

### The pivot

A foothold on a dual-homed host lets an attacker relay traffic into a network they can't otherwise reach. Each new host may open another segment, and chains of two or three pivots are common in real intrusions.

@flow Attacker > Internet-facing host > Internal app server > Database network

Attackers usually make the relay connect **outward**, from the victim toward them. Firewalls tend to allow that, and it survives NAT. The reverse tunnel from [SSH](/modules/01-09-ssh-internals-and-forwarding/) is the simplest form, and `chisel` does similar work over HTTP and WebSockets, so it looks like web traffic.

### Advanced: hiding in protocols

If a firewall allows one protocol, data can be wrapped inside it. That's encapsulation, the same idea as lesson 17, used on purpose.

| Carrier | Why it works | Weakness |
|---|---|---|
| HTTPS | Allowed everywhere, encrypted | Destination, timing and TLS fingerprint still show |
| DNS | Resolvers relay queries | Slow and very noisy |
| ICMP | Often allowed outward | Unusual payload sizes and volumes |
| WebSockets | Long-lived by design | One long-lived session to an unusual host |
| SSH over 443 | Port-based filters are fooled | Protocol detection sees SSH, not TLS |

Application-layer inspection breaks the simple form, as a sensor can spot SSH on port 443. Encryption and legitimate relays make that harder. Attackers increasingly use well-known cloud services and tunnelling products that admins already use, including legitimate remote access tools, because those blend in.

?? Why can't a normal Nmap SYN scan go through a SOCKS proxy?
+ SOCKS relays connections, and can't carry raw crafted packets
- SOCKS encrypts traffic, which prevents reading any SYN-ACK replies
- SYN scans need an administrator account on the target
- Proxies always drop traffic that's aimed at privileged ports
=> A SOCKS proxy makes a full connection for you. It has no way to deliver a hand-built packet, so only connect scans work through it.

## Threat model

A pivot joins two stages: post-compromise discovery and lateral movement.

| Technique | ATT&CK | Detection idea |
|---|---|---|
| Internal proxy | [T1090.001](https://attack.mitre.org/techniques/T1090/001/) | A host that newly accepts and relays connections |
| External proxy | [T1090.002](https://attack.mitre.org/techniques/T1090/002/) | Unusual outbound long-lived sessions |
| Protocol tunnelling | [T1572](https://attack.mitre.org/techniques/T1572/) | Protocol doesn't match port or volume |
| Remote services | [T1021](https://attack.mitre.org/techniques/T1021/) | Logons from an unusual source |

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `ssh -L/-R/-D` | Forwarding on any Linux host | The first and simplest option |
| `proxychains` | Forces an app through a SOCKS proxy | Tools with no proxy setting |
| `socat` | One-off relay | A quick forward in a lab |
| `chisel` | Tunnel over HTTP and WebSockets | Learning what HTTP-only egress allows |
| `ligolo-ng` | TUN-based pivoting | Routing a whole subnet in a lab or authorised test |
| Zeek, NetFlow | Records who spoke to whom | Finding relays from the defender's side |

## Defence

**Limit the bridges.** Inventory dual-homed hosts: each one is a risk. Allow only the connections each segment needs, between named hosts and ports, rather than "any internal". See Network architecture.

**Force egress through inspection.** Default-deny outbound, a proxy for web traffic, and an allow-list on servers. A server that can't start outbound connections can't call home.

**Detect relaying.** A relay has a distinctive shape: one process receives and sends similar volumes, at the same times.

- Newly listening ports on servers: `ss -ltnp`, or Sysmon event 3.
- Unusual east-west flows, such as a web server speaking SMB to a workstation.
- Long-lived sessions with steady small packets. See Threat hunting.
- Tunnel binaries and renamed copies, using hash lists, or better still, behaviour.
- Authentication where the source host is itself a server that should never initiate logins.

**Control remote tools.** Allow-list remote management software, and flag anything else on a server.

## Pitfalls

- **"Firewalls stop lateral movement."** They limit it, but only if the rules between segments are specific.
- **"Outbound HTTPS is safe."** It's the most common cover for command and control.
- **"Our VPN is the boundary."** A single compromised laptop on the VPN is now inside it.
- **Mistaking admins for attackers.** Admins tunnel too. Have a policy that makes legitimate tunnels known and approved, so that the rest stand out.
- **Forgetting latency.** Tunnelled interactive sessions have telltale timing, which you can use in analysis.

?? Which network flow is the strongest sign of pivoting?
+ A web server opening SMB sessions to several workstations
- A laptop sending HTTPS to a popular software website
- A DNS server resolving many names for internal users
- An admin bastion accepting SSH from the IT subnet
=> Servers rarely start SMB to workstations. Traffic against the expected direction is a classic east-west signal.

## Exercise

::: law Lab only
Build this with your own VMs on isolated host-only networks. Don't tunnel out of a work, school or provider network: it can break the rules, or the law.
:::

Build three VMs: `outside`, `pivot` with two interfaces, and `inside`, reachable only from `pivot`. Put a small web server on `inside`.

1. Confirm that `outside` can't reach `inside`.
2. Reach the web server through an SSH local forward. Then reach it through `ssh -D` and `proxychains curl`.
3. Run `nmap -sT` through the proxy, then try `-sS`. Explain the difference in results and in speed.
4. On `pivot`, record what `ss -tnp` shows during each method. Capture on both interfaces, and compare the source addresses that `inside` sees.
5. Turn on Zeek or firewall logging on `pivot`, and write a rule that alerts when `pivot` opens connections to the inside network from a process that shouldn't.
6. Set `AllowTcpForwarding no`, and show which method stops working.

?! Your network has one flat server VLAN. Draw (in words) the three changes that would most reduce an attacker's ability to pivot, and say what each one would break.

## Further reading

- [RFC 1928](https://www.rfc-editor.org/rfc/rfc1928), the SOCKS5 protocol.
- [ATT&CK T1090, Proxy](https://attack.mitre.org/techniques/T1090/), with procedure examples from real groups.
- [ATT&CK T1572, Protocol Tunneling](https://attack.mitre.org/techniques/T1572/), including detection advice.
- [NSA and CISA: Top Ten Cybersecurity Misconfigurations](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-278a), on flat networks and more.
- [Zeek conn.log](https://docs.zeek.org/en/master/logs/conn.html), for finding long sessions and unusual flows.
