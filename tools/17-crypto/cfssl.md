---
title: CFSSL
summary: Cloudflare's toolkit for running your own certificate authority.
side: defence
use: open
docs: https://github.com/cloudflare/cfssl
kali: golang-cfssl
alt: openssl, step-ca
---
## What it's for
Internal services need certificates too, and buying each one is impractical. CFSSL, from Cloudflare, helps you run a private certificate authority to issue them, which is common for internal and service-to-service TLS.

## How it works
It issues, signs and bundles certificates, driven by JSON configuration rather than OpenSSL's many flags, which makes automated issuance far cleaner. A private CA signs certificates that your own systems trust. [PKI in depth](/modules/03-07-pki-in-depth/) explains why that chain of trust works, and why the CA's signing key is the crown jewel.

## Try it
::: law Your lab only
Run a CA for your own services.
:::

```
cfssl genkey -initca ca-csr.json | cfssljson -bare ca
```

Create a small lab CA, issue a certificate for a test service, and have a client trust your CA and connect over TLS.

## What defenders see
Running a CA is a serious responsibility. The signing key must be protected above almost anything else, since whoever holds it can impersonate every service it signs. Keep certificate lifetimes short and automate renewal, since the industry is moving fast toward very short-lived certificates. `step-ca` is a popular alternative.

?! Why is a private CA's signing key one of the most sensitive secrets in an organisation?
