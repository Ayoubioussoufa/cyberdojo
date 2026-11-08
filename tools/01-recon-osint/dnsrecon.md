---
title: dnsrecon
summary: Enumerates a domain's DNS records and checks for common misconfigurations.
side: both
use: own
docs: https://github.com/darkoperator/dnsrecon
kali: dnsrecon
alt: dig, fierce, amass
---
## What it's for
dnsrecon runs a set of standard DNS checks in one go: it lists records, tests for zone transfers, and can guess subdomains from a wordlist.

## How it works
It's a scripted wrapper around DNS queries. A standard run asks for SOA, NS, MX, A, AAAA and TXT records. It tests each name server for AXFR, which is a request for the whole zone. A properly set server refuses. Brute mode tries each word in a list as a subdomain, and it detects wildcard DNS, where every name resolves, since that would make all guesses look real.

## Try it
::: law Your domain only
Zone transfer tests and brute force touch the target's servers. Use your own domain or lab.
:::

```
dnsrecon -d example.com -t std
dnsrecon -d example.com -t axfr
```

`-t` picks the test. A secure server should refuse the second command.

## What defenders see
Server logs record AXFR attempts, and many failed lookups from one client stand out. Allow zone transfers only to named secondaries, preferably with TSIG keys. Split DNS keeps internal names away from public servers.

?! What does a successful zone transfer give an outsider that normal lookups don't? How do you prevent it?
