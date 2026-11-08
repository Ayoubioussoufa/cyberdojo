---
title: crt.sh
summary: Searches public Certificate Transparency logs by domain.
side: both
use: own
docs: https://crt.sh/
aka: certificate transparency
alt: amass, subfinder
---
## What it's for
Every publicly trusted TLS certificate must be recorded in public logs, and [crt.sh](https://crt.sh/) lets you search them. So it shows the names people got certificates for, including ones never meant to be seen.

## How it works
Certificate Transparency logs are append-only, and browsers require proof that a certificate was logged. crt.sh indexes those logs. Since certificates list hostnames, the logs become a passive map of a domain's subdomains. They're also a safeguard: if someone gets a certificate for your domain, it appears there.

## Try it
::: law Your domain only
The logs are public, but keep your follow-up to domains you own.
:::

```
curl -s 'https://crt.sh/?q=%25.example.com&output=json' | jq -r '.[].name_value' | sort -u
```

`%25` is an encoded `%`, the wildcard. Look for names you didn't expect.

## What defenders see
Watching CT logs is itself a defence. Tools and services alert you when a new certificate names your domain, which catches mis-issuance and phishing lookalikes. Remember that internal names in public certificates leak for ever, so use a private CA or wildcard certificates for those.

?! You find a certificate for `vpn.example.com` that your team didn't request, issued yesterday. What are the likely explanations, and what do you do first?
