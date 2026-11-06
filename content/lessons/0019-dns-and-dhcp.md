---
title: DNS and DHCP
summary: How names become addresses, how a device gets on a network, and how both get abused.
month: 2
minutes: 30
builds: trace a DNS lookup with dig, and explain DNS tunneling
source: Cloudflare Learning Center, What is DNS? | https://www.cloudflare.com/learning/dns/what-is-dns/
words: DNS, resolver, DHCP
---
You type `example.com`, but packets need IP addresses. DNS does the translation, and nearly everything on a network depends on it. That makes DNS logs one of a defender's best data sources, and DNS one of an attacker's favourite hiding places.

@term DNS (Domain Name System) = The internet's system for translating names like example.com into IP addresses.
@term resolver = The DNS server that does the lookup work for your device.
@term authoritative server = The DNS server that holds the official records for a domain.
@term DNS record = One entry in DNS, such as an A record mapping a name to an address.
@term TTL (time to live) = How long a DNS answer may be cached.
@term DHCP = A protocol that automatically gives a device an IP address and network settings.
@term DNS tunneling = Hiding data inside DNS queries and answers to sneak it past defences.
@term gateway (default gateway) = The router a device sends traffic to when the destination isn't on its local network.

## How a lookup works

DNS is a giant distributed phone book, organised as a tree. Your computer asks a **resolver**, usually run by your provider or your company, which does the walking:

@flow Your device > Resolver > Root server > .com server > Authoritative server > Answer back and cached

@seq Device | Resolver | DNS servers
Device > Resolver: Where's example.com?
Resolver > DNS servers: Root, then .com, then the domain
DNS servers > Resolver: 93.184.216.34
Resolver > Device: 93.184.216.34, cached

1. Your device checks its own cache, then asks the resolver.
2. The resolver asks a root server: "where's `.com`?"
3. It asks the `.com` server: "where's `example.com`?"
4. It asks that domain's **authoritative** server, which gives the answer.
5. The resolver caches it for the record's **TTL**, so the next lookup is instant.

The protocol is defined in [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035). It uses port 53, mostly over UDP.

## Records you'll meet

| Type | Holds | Example |
|---|---|---|
| `A` | IPv4 address | `example.com → 93.184.216.34` |
| `AAAA` | IPv6 address | |
| `CNAME` | Alias to another name | `www → example.com` |
| `MX` | Mail server | Used in phishing analysis |
| `TXT` | Free text | SPF and DKIM email records (Month 9) |
| `NS` | Authoritative servers | |
| `PTR` | Reverse: address to name | |

::: try On your VM
```
dig example.com
dig example.com MX +short
dig +trace example.com        walks the whole tree
```
Check how long the `ANSWER` is cached, in seconds, and run it twice to watch the TTL count down.
:::

?? A record has a TTL of 3600. What does that mean?
+ Resolvers may cache answers for an hour
- The domain expires in about an hour
- The server takes 3600 milliseconds to answer
- Only 3600 clients may ask each day
=> The TTL says how many seconds an answer stays valid in a cache. It's also why DNS changes don't take effect everywhere at once.

## DHCP: joining a network

When you connect to Wi-Fi, how do you get an address? **DHCP**. The exchange has [four steps](https://www.rfc-editor.org/rfc/rfc2131), often remembered as DORA:

@seq New device | DHCP server
New device > DHCP server: Discover: anyone there?
DHCP server > New device: Offer: use this address
New device > DHCP server: Request: I'll take it
DHCP server > New device: Ack: it's yours

It gives you an IP address, a subnet mask, your default **gateway** and your DNS server. Notice the risk: a rogue DHCP server can tell victims to use the attacker's gateway or DNS, like ARP spoofing but wider. Managed switches counter it with DHCP snooping.

DHCP logs also matter in investigations: they tell you which device held an IP at a particular time.

?? Why is a rogue DHCP server dangerous?
+ It can give victims the attacker's own gateway address
- It can turn off every switch on the network
- It can read the passwords stored on each laptop
- It can make DNS records expire everywhere at once
=> Whoever gives you your gateway and DNS server can see or redirect your traffic.

## How DNS is abused

| Abuse | How it works | What you'd see |
|---|---|---|
| **Spoofing / cache poisoning** | Fake answers send victims to the wrong address | Answers that don't match expected servers |
| **Tunneling** | Data is encoded inside queries to a domain the attacker controls | Long random subdomains, huge query volumes, many TXT records |
| **Amplification** | Small forged queries trigger large replies at a victim | Floods of unsolicited DNS replies |
| **Newly registered domains** | Malware calls home to fresh domains | Lookups of names younger than a few days |

Here's why tunneling works: firewalls often let DNS through, and a resolver will happily forward a query to the attacker's server. A query like this one is smuggling data:

```
aGVsbG8gd29ybGQ.x9k2.evil.example
```

Normal subdomains are short and readable. Long base64-looking ones repeated thousands of times aren't normal.

@term base64 = An encoding that represents any data as printable text. It's reversible by anyone.

?? In DNS logs, which pattern most suggests tunneling?
+ Thousands of long random subdomains, one domain
- Many lookups of a popular news website
- One lookup of a mail server's address
- Regular lookups of the company's own domain
=> Tunneling needs lots of queries that carry encoded data, so it shows up as long, high-entropy names under a single domain.

?! Why would an attacker choose DNS, rather than HTTP, to sneak data out of a locked-down network?
