---
title: whois
summary: Looks up who registered a domain or holds an IP address range.
side: both
use: open
docs: https://www.icann.org/rdap
kali: whois
alt: dig, shodan
---
## What it's for
`whois` tells you who registered a domain, when it expires, and which organisation holds an IP range. Analysts use it to assess a suspicious domain, and to find the right abuse contact.

## How it works
Registries and regional Internet registries keep this data. The client asks the right server over port 43. Since GDPR, most personal details for domains are redacted. ICANN has replaced WHOIS with RDAP, a newer protocol that returns structured JSON over HTTPS. The old text format varies by registry, so it's awkward to parse, while RDAP is consistent.

## Try it
```
whois example.com
whois 8.8.8.8
```

Look at the creation date, registrar and name servers. For an IP, find the network range and abuse contact.

## What defenders see
A domain registered yesterday is a strong phishing signal, so many mail filters and SIEM rules weigh domain age. Registrar lock and multi-factor login protect your own domains from hijacking. The creation date is the field you'll use most in triage.

?! A user reports an email linking to a domain you've never seen. What three facts from `whois` would you check, and what would each tell you?
