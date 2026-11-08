---
title: theHarvester
summary: Collects email addresses, subdomains and hosts for a domain from public sources.
side: both
use: own
docs: https://github.com/laramies/theHarvester
kali: theharvester
aka: the harvester
alt: amass, subfinder, spiderfoot
---
## What it's for
theHarvester answers one question: what does the public Internet already say about this organisation? Penetration testers run it at the start of an authorised test. Defenders run it on their own domain to see what an attacker would find on day one.

## How it works
It's a passive collector. It sends queries to third-party sources, such as search engines, certificate logs and threat intelligence APIs, then parses the answers and removes duplicates. Your target receives no traffic from most of these sources, which is why this phase is hard to detect. Many sources need a free API key, which you put in its `api-keys.yaml` file. Without keys you get far fewer results, and that's the most common reason for a disappointing first run.

## Try it
::: law Your domain only
Run this on a domain you own or are authorised to assess. Collecting and using other people's personal data can break privacy law, even when it's public.
:::

```
theHarvester -d example.com -b crtsh,duckduckgo -l 200 -f results
```

`-d` is the domain, `-b` the sources, `-l` the result limit, and `-f` saves the output. Read the results and sort them: which subdomains should still exist, and which addresses shouldn't be public?

## What defenders see
Nothing, usually, since the queries go to third parties. So defend by reducing what's exposed. Retire old subdomains, use role addresses such as `security@`, and keep your own results as a baseline. Compare them each quarter, because a new entry is often a forgotten service. See [OSINT and recon](/modules/09-05-osint-and-recon/).

?! You run theHarvester on your employer's domain and find 40 staff email addresses and a subdomain called `old-vpn`. What do you do about each, and in what order?
