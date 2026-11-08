---
title: Anonymity and Tor
summary: Encryption hides what you say, not who you're talking to. How onion routing works, what it doesn't protect, why it matters for rights, and how defenders handle it at work.
level: advanced
side: both
minutes: 40
attack: T1090.003, T1573
needs: 0039-public-keys-and-tls, 01-10-proxies-pivoting-and-tunnels
pair: 16-03-privacy-engineering
source: Dingledine, Mathewson and Syverson, Tor The Second-Generation Onion Router | https://svn.torproject.org/svn/projects/design-paper/tor-design.pdf
words: onion routing, guard relay, traffic correlation
---
TLS hides the content of your conversation. Your ISP, however, can still see that you connected, when, and for how long. For a journalist or an activist, that alone can be dangerous. Tor exists to separate who you are from what you're doing, and understanding it teaches a lot about threat models.

@term onion routing = Wrapping traffic in layers of encryption and sending it through several relays, each of which removes one layer.
@term guard relay = The first relay in a Tor circuit, which a client keeps using for a long period.
@term traffic correlation = Linking the two ends of a connection by matching their timing and volume.
@term onion service = A service reachable only within Tor, which hides its location as well.

## Concept

### Fundamentals: three hops

A Tor client picks three relays from a public consensus, and builds a circuit, negotiating a separate key with each. It wraps traffic in three layers of encryption.

@flow You > Guard > Middle > Exit > Website

| Relay | Knows | Doesn't know |
|---|---|---|
| Guard | Your IP address | Your destination |
| Middle | Only its two neighbours | You, or the destination |
| Exit | The destination | Your IP address |

No single relay has both ends. Directory authorities publish a signed consensus listing relays. David Chaum's 1981 **mix networks** introduced the idea, and Tor [trades](https://svn.torproject.org/svn/projects/design-paper/tor-design.pdf) some of a mix's strength for low latency, so that you can browse.

### Why guards exist

If you chose a fresh first relay for each circuit, you'd eventually pick a malicious one. Keeping a small set of long-term **guards** reduces how often an attacker holds your first hop.

### Onion services

A service can also hide. Client and service each build circuits to a rendezvous point, and neither learns the other's location. Version 3 addresses are derived from the public key, so an address authenticates the service. Whistleblowing platforms and news organisations run onion services.

### Advanced: what it doesn't do

**Exit relays see plaintext** if the site doesn't use TLS. So use HTTPS.

**Traffic correlation.** An adversary who sees both ends can match timing and volume. Tor doesn't defend against a *global passive adversary*, and it says so in its design.

**Fingerprinting.** Website fingerprinting research tries to infer visited sites from traffic shapes on the first hop.

**People break anonymity more often than the crypto does.** Logging in to a personal account, reusing a username, or opening a downloaded document that phones home all reveal you. The Silk Road's operator was linked to the site through old forum posts, not by breaking Tor. Tor Browser hardens against fingerprinting, and makes users look alike.

**Censorship.** Some countries block known relays. **Bridges** are unlisted relays, and pluggable transports such as obfs4 and Snowflake disguise traffic.

**VPN or Tor?** A VPN moves trust to one company, which sees everything. Tor splits trust across volunteers, at the cost of speed.

**Other systems.** I2P and Nym take different designs. Mixnets add delay and cover traffic, to resist stronger adversaries.

?? What does the guard relay know about a Tor circuit?
+ Your address, but not your destination
- Your destination, but not your address
- Both your address and your destination
- Neither your address nor your destination
=> The guard sees your IP, but only encrypted traffic heading to the middle relay.

## Threat model

Tor has two sides. For human rights workers, journalists and people in repressive places, it's a lifeline. Attackers use it too, for command and control, or for hiding their source ([T1090.003](https://attack.mitre.org/techniques/T1090/003/), multi-hop proxy), and ransomware groups run leak sites as onion services. Its traffic is also [encrypted](https://attack.mitre.org/techniques/T1573/).

For defenders, the point isn't that Tor is bad. It's that a server in your company has no business using it.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Tor Browser | Hardened browser | Using Tor safely |
| Relay Search (Tor Metrics) | Public relay data | Checking an address |
| Exit list | Lists exit IPs | Enriching logs |
| Zeek, JA4 | Spot Tor handshakes | Network monitoring |
| Tails | A live OS routed through Tor | High-risk users |

## Defence

For an organisation:

- **Decide by policy.** Most firms block Tor on servers, and need a reason to allow it on workstations.
- **Block egress by default,** which also stops Tor without needing a list.
- **Enrich logs** with exit node lists. A login from a Tor exit to an admin account should raise concern.
- **Don't block everyone from Tor on a public site without thought.** Many users rely on it for privacy.
- **Detect clients** by process name, known hashes and connections to guard relays.

For someone at risk: threat model first. Who's your adversary, and what do they see? Keep identities apart, and take specialist advice.

## Pitfalls

- **"Tor makes me anonymous."** It's one layer. Your behaviour can undo it.
- **"Using Tor is suspicious."** Using it is legal in most places, and millions do, though laws vary. Check your own.
- **"The dark web is only criminals."** Facebook and the BBC have onion services.
- **Adding random browser extensions.** They make you unique.
- **Running an exit relay casually.** Abuse complaints will arrive at your address.

?? What can a Tor exit relay see in a plain HTTP request?
+ The full content and the destination
- Only the size of each packet
- Only your real home IP address
- Nothing, as it's still fully encrypted
=> Tor's encryption ends at the exit. If the site uses plain HTTP, the exit operator can read everything.

## Exercise

::: law Lab only
Check your local law and your network's policy before you use Tor. Don't run an exit relay, and don't visit illegal content. Do the capture on your own connection.
:::

1. Install Tor Browser. Visit the [Tor Project's check page](https://check.torproject.org/). Use the circuit display to see your three hops.
2. Capture on your own interface while browsing. What can your ISP see? What can't it see?
3. Compare that with a normal HTTPS visit, using the same site.
4. Download the public exit list, and write a Python script that tags addresses in a sample log.
5. Read Tor's own [list of what it doesn't protect against](https://support.torproject.org/faq/staying-anonymous/). Summarise it in five lines.

?! Write a threat model for a journalist contacting a whistleblower in a country with strict surveillance. Say who the adversaries are, what Tor gives, and what it doesn't.

## Further reading

- [Tor: The Second-Generation Onion Router](https://svn.torproject.org/svn/projects/design-paper/tor-design.pdf).
- [Tor Project documentation](https://community.torproject.org/).
- David Chaum, [Untraceable Electronic Mail, Return Addresses, and Digital Pseudonyms](https://dl.acm.org/doi/10.1145/358549.358563).
- [Tor Metrics](https://metrics.torproject.org/).
- [EFF Surveillance Self-Defense](https://ssd.eff.org/).
