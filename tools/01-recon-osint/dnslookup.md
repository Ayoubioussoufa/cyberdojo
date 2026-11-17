---
title: dnslookup
summary: Sends DNS queries over plain DNS or over encrypted DNS (HTTPS, TLS, QUIC) and shows the answer.
side: both
use: open
docs: https://github.com/ameshkov/dnslookup
alt: dig, nslookup
---
## What it's for
Most DNS tools speak only classic DNS, which crosses the network unencrypted on port 53. `dnslookup`, an open-source command-line tool from AdGuard's developers, also speaks the encrypted protocols: DNS over TLS (DoT), DNS over HTTPS (DoH), DNS over QUIC (DoQ) and DNSCrypt. It's how you check that an encrypted resolver works, and what it answers.

## How it works
You give it a name and, if you want, a server. The server's address picks the protocol: `tls://` for DoT on port 853, `https://` for DoH, `quic://` for DoQ, and a plain address for classic DNS. It sends one query and prints the full reply in the same layout as [dig](/tools/dig/), plus how long the exchange took. Environment variables set the options, such as `RRTYPE=MX` for the record type, which keeps the command line short.

## Try it
```
dnslookup example.com
dnslookup example.com 1.1.1.1
dnslookup example.com tls://1.1.1.1
dnslookup example.com https://cloudflare-dns.com/dns-query
RRTYPE=TXT dnslookup example.com https://dns.google/dns-query
```

Compare the time of the plain query with the encrypted ones. Then capture both with [tcpdump](/tools/tcpdump/): the plain query shows the name in clear text, the encrypted one doesn't.

## What defenders see
Encrypted DNS protects users from snooping, and it also blinds a network's defenders: queries to a DoH server look like ordinary HTTPS. Organisations that rely on DNS logs for detection therefore run their own resolver and block outside DoH where policy allows, while browsers and malware can both bypass it. Knowing which resolvers your machines really use, which `dnslookup` lets you test, is the first step. See [DNS in depth](/modules/01-05-dns-in-depth/).

?! Your company's DNS logs show nothing for a laptop that clearly browses the web. Name two ways it could be resolving names without your resolver, and how you'd confirm each.
