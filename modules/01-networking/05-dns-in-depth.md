---
title: DNS in depth
summary: The internet's phone book trusts answers that it can barely verify. Poisoning, rebinding, tunnelling and takeover, then DNSSEC and encrypted DNS, and what each really fixes.
level: intermediate
side: both
minutes: 60
attack: T1071.004, T1568.002, T1590.002, T1584.001
needs: 0019-dns-and-dhcp, 01-02-ip-layer-and-icmp
pair: 08-02-threat-hunting, 06-02-command-and-control
source: RFC 1034, Domain Names, Concepts and Facilities | https://www.rfc-editor.org/rfc/rfc1034
words: cache poisoning, DNSSEC, DNS rebinding
---
DNS is the most useful thing on a network to an attacker, and often the least watched. Almost every machine may reach a resolver, almost every firewall allows it, and it was designed in the 1980s for a network of colleagues. Lesson 19 covered how a lookup works. Here you'll attack each assumption behind it, then look at what the fixes really deliver.

@term DNS cache poisoning = Getting a resolver to store a false answer, so that it hands the lie to everyone who asks.
@term DNSSEC = Signatures added to DNS records, so that a resolver can verify that an answer came from the zone's owner.
@term DNS rebinding = Making a domain name point first at an attacker's server, then at an internal address, to get past the browser's same-origin policy.
@term dangling record = A DNS record that still points to a service which no longer exists, so someone else can claim it.

## Concept

### Fundamentals: who trusts whom

A stub resolver on your laptop asks a **recursive resolver**, which walks down from the root to the TLD to the **authoritative** server, then caches the result for the record's TTL.

@flow Stub > Recursive resolver > Root > TLD > Authoritative > Answer cached for TTL

Classic DNS runs over UDP port 53, with no encryption. A resolver accepts a reply if it matches the outstanding question, the source, the port and a 16-bit transaction ID. Answers also carry extra records in their additional section, which is an obvious thing to abuse. So resolvers apply **bailiwick** rules: a server may only speak for the names in its own zone.

### Poisoning

An off-path attacker can't see the query, so they must guess the transaction ID and win a race with the true server. With only 65,536 IDs and a predictable source port, the race can be won. Dan Kaminsky [showed in 2008](https://www.kb.cert.org/vuls/id/800113) that an attacker needn't wait for TTLs to expire: asking for random subdomains forces a fresh race every time, and a forged delegation in the reply takes over the whole domain.

The emergency fix was **source port randomisation**, which multiplies the guesswork. It's a stopgap, not a cryptographic solution, and later research has found ways to infer the port.

### Rebinding

The browser's same-origin policy compares names, not addresses. Suppose a victim visits `attacker.example`, whose answer has a very short TTL. The page loads from the attacker's server. A moment later, the name resolves to `192.168.1.1`. The browser still sees the same origin, so the attacker's script can now talk to the victim's router or an internal admin panel.

### Tunnelling

A resolver will relay any query for a domain to that domain's authoritative server. So a machine with no internet route can still reach an attacker's name server, by spelling data in subdomains: `aGVsbG8.c2.attacker.example`. Replies return in TXT or other record types. It's slow, but it passes many firewalls.

### Takeover and enumeration

When a company removes a cloud service but leaves its CNAME behind, that **dangling record** points to a name someone else may register. They then serve content on the company's own subdomain, with cookies and trust to match.

Attackers map subdomains from certificate logs, and from misconfigured **zone transfers** (AXFR), which hand over a whole zone. DNSSEC's NSEC records can also reveal names, which NSEC3 was designed to reduce.

### Advanced: what the fixes actually fix

| Mechanism | Protects | Doesn't protect |
|---|---|---|
| **DNSSEC** | Integrity of records, resolver to authority | Confidentiality, or the last hop to your laptop unless validated locally |
| **DoT** (RFC 7858), port 853 | Privacy on one hop | Whether the record itself is true |
| **DoH** (RFC 8484), port 443 | Same, and it blends with web traffic | Same |
| **DoQ** (RFC 9250) | Same, over QUIC | Same |

A chain of **DS**, **DNSKEY** and **RRSIG** records runs from the root down. If one link fails, a validating resolver returns SERVFAIL. Note the trade-off with DoH: it stops local snooping, and it also blinds enterprise monitoring when browsers bypass the company resolver.

?? What does DNSSEC give you that DNS over HTTPS doesn't?
+ Proof that a record really came from the zone
- Encryption of every query between you and the resolver
- Hiding of your queries from the network you use
- Protection against all forms of DNS based data tunnelling
=> DNSSEC signs records but encrypts nothing. DoH encrypts one hop but can't prove that the data is true.

## Threat model

| Technique | ATT&CK | Note |
|---|---|---|
| C2 over DNS | [T1071.004](https://attack.mitre.org/techniques/T1071/004/) | Tunnels and beacons |
| Domain generation | [T1568.002](https://attack.mitre.org/techniques/T1568/002/) | Many names, one registered |
| Reconnaissance of DNS | [T1590.002](https://attack.mitre.org/techniques/T1590/002/) | Zone data, subdomains |
| Hijacking domains | [T1584.001](https://attack.mitre.org/techniques/T1584/001/) | Takeover of names |

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `dig +trace` | Walks the delegation yourself | Debugging, or teaching the hierarchy |
| `dig +dnssec`, `delv` | Shows and validates signatures | Checking a chain of trust |
| `dig axfr @ns zone` | Requests a zone transfer | Testing your own name servers |
| Zeek `dns.log` | Logs every query | Hunting tunnels and DGAs |
| Passive DNS | History of what resolved to what | Investigating infrastructure |
| `dnsrecon`, Amass | Subdomain enumeration | Authorised assessments of your own estate |

## Defence

- **Run validating resolvers**, and force internal clients through them. Block outbound 53, 853 and known DoH endpoints, so that "use our resolver" is true.
- **Restrict zone transfers** to named secondaries, and sign them with TSIG.
- **Stop rebinding.** Have resolvers refuse public names that return private addresses, as with dnsmasq's `--stop-dns-rebind`. Services should check the `Host` header and require authentication even on internal networks.
- **Audit dangling records.** Inventory every CNAME against live services, and automate that.
- **Sign your zones** with DNSSEC if you can operate it carefully, since a broken signature takes your domain off the internet for validating resolvers.

**Detect tunnelling and DGAs** with features, not lists: long labels, high entropy, many unique subdomains under one domain, heavy TXT or NULL queries, and bursts of NXDOMAIN. Response Policy Zones let you block known-bad names at the resolver.

## Pitfalls

- **"DNSSEC encrypts DNS."** It signs. Encryption is a separate layer.
- **"DoH is always a privacy win."** It moves trust to the DoH provider and can remove your own visibility.
- **"Port 53 is just DNS."** Anything can run there, and DNS itself can carry anything.
- **"Low TTLs are suspicious."** Content delivery networks use them all the time. Combine signals.
- **Blocking on entropy alone.** Legitimate CDNs, telemetry services and anti-spam lookups can produce long random-looking names. Tune with a known-good baseline.
- **Forgetting internal DNS.** Active Directory depends on it, and it's a target of its own.

?? A script from `attacker.example` reaches a router's admin page at 192.168.1.1. What made that possible?
+ The same-origin check compares names, not IP addresses
- The router's admin page disabled its TLS certificate
- The victim's resolver signed replies with DNSSEC keys
- The attacker's domain uses a long cache lifetime
=> That's DNS rebinding. The name stays the same while its address changes, and the browser's policy looks only at the name.

## Exercise

::: law Lab only
Query public DNS normally, but only test zone transfers against servers you run. Run tunnels only in your own lab, between your own VMs and to a domain you control.
:::

1. Run `dig +trace example.com`, and label each step with the server type.
2. Compare `dig +dnssec cloudflare.com` and `delv cloudflare.com`. Find the RRSIG, and note what `delv` says about validation.
3. Run your own BIND or Unbound in the lab. Configure a test zone, allow AXFR from anywhere, retrieve the zone with `dig axfr`, then restrict it and confirm the refusal.
4. Log your lab's DNS with Zeek for a day of normal use. Write a query that ranks domains by unique subdomains, and look at what comes out on top. What normal services look most like tunnels?
5. Write a Python function that scores a label by length and Shannon entropy. Test it on real names and on base32 text.

?! Your CISO asks whether to enable DoH across all company laptops. Give a recommendation with the trade-offs, and say what you'd do about monitoring.

## Further reading

- [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034) and [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035), the original specifications.
- [CERT VU#800113](https://www.kb.cert.org/vuls/id/800113), on the 2008 cache poisoning flaw.
- [RFC 8484](https://www.rfc-editor.org/rfc/rfc8484) (DoH) and [RFC 7858](https://www.rfc-editor.org/rfc/rfc7858) (DoT).
- [ICANN's DNSSEC overview](https://www.icann.org/resources/pages/dnssec-what-is-it-why-important-2019-03-05-en), for the operator's view.
- [Zeek's dns.log reference](https://docs.zeek.org/en/master/logs/dns.html), for the fields you'd hunt on.
