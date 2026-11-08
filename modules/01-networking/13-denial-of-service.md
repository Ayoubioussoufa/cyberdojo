---
title: Denial of service
summary: Availability attacks come in three forms, and each fights a different resource. Reflection, amplification, application floods and HTTP/2 Rapid Reset, and the defences for each.
level: advanced
side: both
minutes: 45
attack: T1498.001, T1498.002, T1499
needs: 01-03-tcp-internals, 0018-tcp-udp-and-ports
pair: 01-03-tcp-internals, 01-12-routing-and-bgp, 07-04-network-architecture
source: CISA, Understanding Denial-of-Service Attacks | https://www.cisa.gov/news-events/news/understanding-denial-service-attacks
words: amplification factor, volumetric attack, application-layer attack
---
A denial-of-service attack needs no vulnerability in the usual sense. It only has to make a server spend more than it can afford. The whole subject is about **asymmetry**: what does each request cost the attacker, and what does it cost you?

@term amplification factor = The ratio of the bytes a reflector sends to the victim to the bytes the attacker sent to the reflector.
@term volumetric attack = A denial of service that fills the victim's network capacity with raw traffic.
@term application-layer attack = A denial of service that uses valid-looking requests to exhaust an application's resources.

## Concept

### Fundamentals: three resources

| Type | Resource exhausted | Measured in | Example |
|---|---|---|---|
| Volumetric | Bandwidth | Bits per second | UDP floods, reflection |
| Protocol | Connection state | Packets per second | SYN flood |
| Application | CPU, memory, database | Requests per second | Expensive search queries |

A **distributed** attack (DDoS) comes from many sources, usually a botnet of infected devices, so blocking a single address doesn't help. Defences must match the layer. A rate limit in your app doesn't help if the link in front of it is already full.

### Reflection and amplification

UDP has no handshake, so an attacker can forge the victim's address as the source. A public server then sends its reply to the victim, and that's **reflection**. If the reply is much larger than the request, it's **amplification** as well.

@flow Attacker sends small query with forged source > Reflector > Large reply floods the victim

[CISA's table of amplification factors](https://www.cisa.gov/news-events/alerts/2014/01/17/udp-based-amplification-attacks) gives the scale:

| Protocol | Rough bandwidth amplification |
|---|---|
| DNS | 28 to 54 |
| NTP | 556.9 |
| Memcached | 10,000 to 51,000 |

In [February 2018](https://github.blog/news-insights/company-news/ddos-incident-report/), GitHub took a 1.35 Tbps attack that used memcached reflection, and its traffic was back under control within about 10 minutes, thanks to DDoS mitigation. The fix on the reflector side is simple: don't expose such services on the Internet.

### Application-layer attacks

Here the traffic looks real. Only a cost imbalance gives it away.

- **Slow attacks.** Slowloris holds many connections open by sending a header very slowly, which ties up servers that dedicate a thread to each connection.
- **Expensive requests.** A search with no index, an endless pagination, a report export, or a regular expression with catastrophic backtracking (ReDoS). One request costs the attacker nothing, and costs you seconds of CPU.
- **Resource bombs.** A compressed file or XML that expands enormously, such as the billion laughs attack.

### Advanced: HTTP/2 Rapid Reset

HTTP/2 multiplexes streams over one connection, and a client can open a stream and cancel it right away. In 2023, [attackers abused exactly that](https://cloud.google.com/blog/products/identity-security/how-it-works-the-novel-http2-rapid-reset-ddos-attack) (CVE-2023-44487). The cancelled stream doesn't count against the concurrency limit, but the server has already begun work. Google reported a peak of 398 million requests per second, from a botnet of only about 20,000 machines. The lesson is that a protocol's feature for efficiency can invert the cost asymmetry.

?? Why does forging a source address work for UDP reflection, but not to complete TCP?
+ UDP needs no handshake, so a reply needs no proof
- UDP packets are always encrypted, which hides the forged sender
- TCP servers keep a list of every banned address worldwide
- Routers check UDP checksums but they never check TCP ones
=> TCP needs a completed three-way handshake, which a forged source can't finish. A single UDP request gets an answer with no such check.

## Threat model

| Variant | ATT&CK |
|---|---|
| Direct network flood | [T1498.001](https://attack.mitre.org/techniques/T1498/001/) |
| Reflection amplification | [T1498.002](https://attack.mitre.org/techniques/T1498/002/) |
| Endpoint or application exhaustion | [T1499](https://attack.mitre.org/techniques/T1499/) |

Motives range from extortion ("pay or we'll keep this up") and hacktivism to rivalry. DDoS can also be a **smokescreen**, drawing attention while something else happens, so during an attack, keep watching your other alerts. Booter and stresser services sell attacks by the hour, and they're illegal even if someone calls them load testing.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `ss -s`, `nstat` | Show connection and protocol counters | Confirming a state attack |
| NetFlow, `iftop` | Show who's sending the traffic | Finding top sources and protocols |
| `hey`, `wrk`, `k6` | Load testing | Measuring your own capacity |
| `dig` | Compares request and response sizes | Measuring amplification on your own resolver |
| Web server metrics | Latency and concurrency | Spotting application pressure |

## Defence

**Network layer.** You can't filter your way out of a full link from behind that link, so capacity must sit upstream. Use a scrubbing service or a CDN, which relies on **anycast** to spread the load across many locations. Prepare your ISP contact and a mitigation runbook before you need them.

**Stop being a reflector.** Close open resolvers, memcached, NTP `monlist`, and SSDP to the Internet. Apply [BCP 38](https://www.rfc-editor.org/rfc/rfc2827) to stop spoofing at the source. This protects other people, and it's your duty as a network operator. Protocol design helps too: QUIC limits what a server may send to an unvalidated address.

**Protocol layer.** SYN cookies, connection timeouts, and a modern event-driven reverse proxy handle slow attacks.

**Application layer.** This is on you:

- Rate limit per account or token, and not only per IP.
- Put hard limits on page size, query complexity, body size and file decompression.
- Add time limits to database queries.
- Cache expensive results, and queue heavy work.
- Add a client challenge when under attack.
- Design a degraded mode, in which read-only pages stay up.

**Detection.** Baseline normal traffic. Watch for shifts in protocol mix, for spikes in source ports such as UDP 53 or 123 arriving at a host that didn't ask, and for a rising error rate with latency.

## Pitfalls

- **"A WAF stops DDoS."** A WAF behind your link can't help when the link's full.
- **"Rate limiting by IP is enough."** Botnets and shared addresses both defeat that.
- **"Cloud scales, so we're safe."** Autoscaling turns a denial of service into a large invoice. Set budget alerts and limits.
- **"It's only availability."** For a hospital or payment system, availability is the primary concern.
- **Testing in production without warning.** Your own load test can look identical to an attack, and cloud providers have rules for testing.

?? A public API endpoint costs 3 seconds of database time per call. What should you do first?
+ Limit, cache or queue the expensive work behind that endpoint
- Buy a much larger upstream link from your Internet provider
- Enable TLS 1.3 to raise the attacker's costs per request
- Block UDP port 53 traffic at your network's outer edge
=> That's an application-layer imbalance. A few clients can exhaust it, and more bandwidth or edge filtering won't touch the root cause.

## Exercise

::: law Lab only
Never point any load or flood tool at a system that you don't own. Attacks, and booter services, are criminal offences in many countries. Use your own VMs on a host-only network.
:::

1. Measure amplification safely. On your own resolver, run `dig @<your-resolver> example.com ANY +bufsize=4096` while capturing. Divide the response bytes by the request bytes.
2. Start a small Flask or Nginx app in your lab. Add an endpoint that does a slow operation. Use `hey -n 200 -c 20` against it from another VM, and record the latency.
3. Add a timeout, a cache or a rate limit. Measure again, and chart before and after.
4. Watch `ss -s` while running the test. Explain what you see in the counters.
5. Write a one-page DDoS runbook for a small company: who to call, what to switch on, what to tell customers, and what you'd keep watching.

?! Pick an endpoint in an application you know. Calculate the cost asymmetry roughly, then describe how you'd limit it without hurting real users.

## Further reading

- [CISA, Understanding Denial-of-Service Attacks](https://www.cisa.gov/news-events/news/understanding-denial-service-attacks), a plain overview.
- [CISA, UDP-Based Amplification Attacks](https://www.cisa.gov/news-events/alerts/2014/01/17/udp-based-amplification-attacks), with the factor table.
- [GitHub's incident report](https://github.blog/news-insights/company-news/ddos-incident-report/) on the 2018 attack.
- [Google on HTTP/2 Rapid Reset](https://cloud.google.com/blog/products/identity-security/how-it-works-the-novel-http2-rapid-reset-ddos-attack), a modern protocol-level case.
- [OWASP Denial of Service Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html), for application defences.
