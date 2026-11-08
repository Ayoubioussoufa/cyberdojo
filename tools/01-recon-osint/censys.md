---
title: Censys
summary: Searches Internet-wide scan data on hosts and certificates.
side: both
use: own
docs: https://docs.censys.com/
alt: shodan
---
## What it's for
Censys, like [Shodan](/tools/shodan/), lets you search scan data about the Internet. It grew out of research on ZMap at the University of Michigan, and it's strong on certificates and structured data.

## How it works
Censys scans continuously, identifies services by protocol even on unusual ports, and stores structured records. You can query fields, such as a certificate's subject or a service's software. Analysts use certificate fields to link infrastructure: a fingerprint shared across hosts can reveal a whole set of attacker servers.

## Try it
::: law Look, don't touch
Search your own organisation. Don't connect to systems you find unless you're authorised.
:::

In the web interface, search for your organisation's name or a certificate you own, and list every host that presents it. Compare with your inventory.

```
curl -I https://example.com
```

Use a command like this one only to confirm that your own service is really what the record says.

## What defenders see
Scanners appear in logs as normal background noise. Publishers of scan data offer opt-out, but hiding from one scanner doesn't remove the exposure. Use the results as an external audit of what's open, and watch for certificates you didn't issue.

?! How can one TLS certificate fingerprint help an analyst find more of an attacker's servers?
