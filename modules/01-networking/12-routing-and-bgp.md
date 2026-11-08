---
title: Routing and BGP security
summary: The Internet's routing rests on networks believing each other's announcements. How BGP works, what hijacks have done, and how RPKI is slowly replacing belief with proof.
level: advanced
side: both
minutes: 45
attack: T1557, T1584
needs: 01-02-ip-layer-and-icmp
pair: 01-13-denial-of-service
source: RFC 4271, A Border Gateway Protocol 4 | https://www.rfc-editor.org/rfc/rfc4271
words: autonomous system, BGP hijack, RPKI
---
Encryption protects what's inside a packet, but routing decides where that packet goes. BGP, which glues the Internet's networks together, was designed for a small community that knew each other. It still mostly works on trust. When that fails, whole countries have dropped off the Internet, and cryptocurrency has been stolen.

@term autonomous system (AS) = A network under one administration, identified by a number, that makes its own routing decisions.
@term BGP hijack = Announcing a route to addresses you don't hold, so that traffic is sent to you.
@term RPKI = A cryptographic system that lets address holders state which network may originate their prefixes.
@term ROA (route origin authorization) = A signed RPKI record naming the AS allowed to announce a prefix.

## Concept

### Fundamentals: inside and between networks

Inside one organisation, an **interior gateway protocol** finds the best paths. **OSPF** is a common one: each router floods link-state information, every router builds the same map, then runs a shortest-path calculation. Enabling authentication on OSPF stops a rogue device on a segment from injecting routes.

Between organisations, there's one protocol: **BGP**. Each **autonomous system** tells its neighbours which prefixes it can reach, along with the path of AS numbers to get there. BGP is a *path vector* protocol, and it runs over TCP port 179. Routers pick paths based on policy and cost, and on two rules that matter here:

1. **Longest prefix wins.** A `/24` beats a covering `/16`, whatever the path length.
2. **Announcements aren't verified.** Classic BGP has no way to prove that an AS may announce a prefix.

Put those together and you have the problem.

### Hijacks and leaks

A **hijack** announces someone else's prefix. A more specific announcement draws traffic from almost everywhere.

| Incident | What happened |
|---|---|
| [YouTube, 2008](https://www.ripe.net/about-us/news/youtube-hijacking-a-ripe-ncc-ris-case-study/) | Pakistan Telecom announced a YouTube `/24` to block it locally. It leaked worldwide, and YouTube dropped off for hours |
| [Route 53, 2018](https://blog.cloudflare.com/bgp-leaks-and-crypto-currencies/) | Attackers hijacked Amazon DNS prefixes, sent users to a fake MyEtherWallet site, and stole cryptocurrency |
| [Cloudflare and Verizon, 2019](https://blog.cloudflare.com/how-verizon-and-a-bgp-optimizer-knocked-large-parts-of-the-internet-offline-today/) | A route leak through a small ISP disrupted large parts of the web |

A **route leak** is usually an accident: routes get passed on against policy. The effect can be identical, and the two are hard to tell apart from outside.

Hijacks defeat more than availability. Controlling traffic to a domain's server, for a few minutes, may be enough to pass a certificate authority's validation and get a real certificate. That's why CAs now validate from several network locations.

### Advanced: origin validation and path validation

**RPKI** starts with the regional registries that allocate addresses. Address holders sign a **ROA** saying "this AS may originate this prefix, up to this length". Routers fetch validated data, and mark each route as valid, invalid or not found. Dropping invalid routes is **route origin validation**.

Note what it doesn't do. RPKI proves the *origin* only. An attacker can forge a path ending in the correct AS, and origin validation accepts it. **BGPsec** signs the whole path, but it's heavy and barely deployed. **ASPA**, an ongoing IETF effort, records which providers an AS uses, to catch leaks and forged paths more cheaply.

Keep ROAs tight. A ROA with a generous `maxLength` lets attackers announce a more specific prefix with your own AS as the origin, which passes validation. [RFC 9319](https://www.rfc-editor.org/rfc/rfc9319) advises against that.

?? A router sees your `/16` and an attacker's `/24` inside it. Which is used?
+ The `/24`, as the longest matching prefix always wins
- The `/16`, as the shorter prefix covers more hosts
- Both of them, sharing traffic through equal cost balancing
- Whichever announcement was made first, until a later change
=> Forwarding always prefers the most specific match, which is why a more specific hijack spreads so well.

## Threat model

These attacks need a network that can speak BGP: a rogue or compromised AS, or a careless one. That places them in the reach of states, and of some criminals who buy transit from lax providers. Effects:

- **Black hole:** traffic is dropped, so it's a denial of service.
- **Interception:** traffic is passed on through the attacker, who's now on-path ([T1557](https://attack.mitre.org/techniques/T1557/)).
- **Impersonation:** a fake service answers, as with Route 53.

Attackers can also compromise a router or the management account at a registrar or registry ([T1584](https://attack.mitre.org/techniques/T1584/)). Sending spam from briefly hijacked, unused prefixes has also been documented.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| [RIPEstat](https://stat.ripe.net/) | History of a prefix, routing status | Investigating an address block |
| [Cloudflare Radar](https://radar.cloudflare.com/routing) | Routing anomalies | Following a live incident |
| [BGPStream](https://bgpstream.caida.org/) | Real-time and historical BGP data | Research |
| Routinator, rpki-client | RPKI validators | Running validation at your network |
| FRRouting | Open-source routing in Linux | Building a BGP lab |
| `traceroute`, RIPE Atlas | See paths from many locations | Checking whether a change is global |

## Defence

**If you hold addresses:** create ROAs for every prefix, with a tight `maxLength`. Monitor your prefixes with an external service, so that you learn about a hijack in minutes.

**If you run a network:** filter what your customers can announce, drop RPKI-invalid routes, and follow [MANRS](https://manrs.org/) (Mutually Agreed Norms for Routing Security), which covers filtering, anti-spoofing, coordination and global validation. [RFC 7454](https://www.rfc-editor.org/rfc/rfc7454) gives operational practice. Protect the BGP session itself with TCP-AO and the TTL security check of [RFC 5082](https://www.rfc-editor.org/rfc/rfc5082).

**If you run a service:** assume that the network path can be attacked. TLS with valid certificates turns interception into a visible failure. Lock down certificate issuance with CAA records, watch Certificate Transparency for unexpected certificates, and don't let a DNS or registrar account be the single point of failure.

## Pitfalls

- **"TLS makes routing irrelevant."** It protects confidentiality and integrity. A hijack can still cause an outage or help mis-issue a certificate.
- **"RPKI stops hijacks."** It stops origin hijacks, where validators are deployed. Forged paths remain.
- **"Every hijack is an attack."** Most incidents are mistakes. Report facts first, and intent later.
- **Loose `maxLength`.** It reopens the hole that ROAs close.
- **Treating BGP as someone else's problem.** Your cloud or ISP dependency means their routing is your risk.

?? What can a validator conclude about a forged path ending in the right origin AS?
+ RPKI accepts it, as the origin is right
- RPKI rejects it, as every hop is signed
- It's marked as a leak by the registry
- The route is dropped as its path changed
=> RPKI checks only the origin AS against the ROA, so a forged path that ends correctly still passes.

## Exercise

::: law Lab only
Do the hands-on part only in a virtual lab with private AS numbers. Announcing real prefixes without authorisation disrupts the Internet and has legal consequences.
:::

1. Choose a large public prefix. Look it up in RIPEstat, and note its origin AS and RPKI status.
2. Read the RIPE report on the 2008 YouTube incident. Write a five-line timeline with the longest-prefix rule explained.
3. Build two FRRouting containers with private ASNs and an eBGP session. Announce a `/16` from one. Add a third router announcing a `/24` inside it, and watch which path wins with `vtysh`.
4. Run `dig CAA` for a few domains. What does a CAA record add here?
5. Look up your university or ISP on [MANRS](https://manrs.org/) or in an RPKI monitor. Do they publish ROAs?

?! Your bank's website sits behind one cloud provider. Write a risk statement on BGP hijacking, using the language from lesson 60, and suggest two practical controls.

## Further reading

- [RFC 4271](https://www.rfc-editor.org/rfc/rfc4271), the BGP-4 standard.
- [RFC 6480](https://www.rfc-editor.org/rfc/rfc6480), the RPKI architecture.
- [RFC 7454](https://www.rfc-editor.org/rfc/rfc7454), on BGP operations and security.
- [MANRS](https://manrs.org/), the community standards for routing security.
- Goldberg, [Why Is It Taking So Long to Secure Internet Routing?](https://queue.acm.org/detail.cfm?id=2668966), a clear account of the deployment problem.
