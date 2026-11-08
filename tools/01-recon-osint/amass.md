---
title: Amass
summary: Maps a domain's external attack surface through DNS, certificates and scraping.
side: both
use: own
docs: https://owasp.org/www-project-amass/
kali: amass
aka: OWASP Amass
alt: theharvester, subfinder
---
## What it's for
Amass, an OWASP project, builds the fullest list of an organisation's domains and subdomains it can. Attack surface teams use it to find assets that nobody listed.

## How it works
It combines sources: certificate logs, search engines, archives and DNS APIs. In active mode it also resolves names, tries zone transfers, and guesses names from wordlists and patterns. So active mode sends traffic to the target's name servers, and passive mode doesn't. Results go into a local graph database, so a later run can show what changed since the last one, which is the feature that makes it useful for monitoring rather than for one-off lists.

## Try it
::: law Your domain only
Passive mode queries third parties. Active mode touches the target's servers, so it needs authorisation.
:::

```
amass enum -passive -d example.com -o subs.txt
```

`enum` finds names, `-passive` keeps to third-party sources, and `-o` writes a file. Then compare with your asset inventory.

## What defenders see
Passive runs leave nothing on your side. Active runs show up as bursts of DNS queries for names that don't exist, known as NXDOMAIN floods, which DNS logs reveal clearly. The defence is an accurate inventory and the removal of unused records, particularly dangling records that invite subdomain takeover.

?! Why might a defender schedule Amass every week rather than run it once? What exactly would they look at in the output?
