---
title: SpiderFoot
summary: Automates OSINT collection across more than 200 modules, with a web interface.
side: both
use: own
docs: https://github.com/smicallef/spiderfoot
kali: spiderfoot
alt: theharvester, maltego, recon-ng
---
## What it's for
SpiderFoot takes a domain, address or name, and collects everything it can find across many sources, then presents it in a browsable web interface.

## How it works
Its modules react to events. When one finds a new subdomain, that event triggers others to look up its addresses, certificates and leaks, which trigger more. So a single seed spreads out automatically. That's powerful, but scans grow fast, and modules that touch the target are mixed in with passive ones, so choose the scan type with care.

## Try it
::: law Your domain only
Choose passive scans unless you've got authorisation for active ones.
:::

```
spiderfoot -l 127.0.0.1:5001
```

Then open `http://127.0.0.1:5001`, and start a passive scan of your domain. Keep it bound to localhost, since it has no login by default.

## What defenders see
Passive modules leave nothing on your side. Use it as a periodic self-assessment: look at leaked credentials, exposed services and old documents, and assign an owner to each.

?! Why is event-driven collection both useful and risky during an authorised assessment?
