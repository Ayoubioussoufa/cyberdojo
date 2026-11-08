---
title: fierce
summary: Finds non-contiguous IP space and hostnames for a domain through DNS.
side: both
use: own
docs: https://github.com/mschwager/fierce
kali: fierce
alt: dnsrecon, amass
---
## What it's for
fierce is a small DNS reconnaissance tool. It looks for hosts belonging to an organisation, including those outside the obvious address range.

## How it works
It guesses common subdomains, then looks at the addresses that come back. If a hit sits in a network, it scans nearby addresses with reverse lookups, on the idea that neighbours often belong to the same organisation. That's how it finds address space that a simple list of names misses. It's lighter than Amass and quick to run in a lab.

## Try it
::: law Your domain only
Use a domain you own or a lab zone.
:::

```
fierce --domain example.com --subdomains www mail vpn
```

Then read which addresses it found, and which neighbours it checked.

## What defenders see
Repeated reverse lookups across a range, and many failed lookups, show up in DNS logs. Avoid descriptive names such as `vpn-backup`, and don't publish reverse records for internal hosts.

?! Why does looking at neighbouring addresses work? When would it give false results on a cloud provider's network?
