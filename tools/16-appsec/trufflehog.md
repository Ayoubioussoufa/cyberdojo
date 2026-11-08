---
title: TruffleHog
summary: Finds secrets and checks whether they still work.
side: both
use: open
docs: https://github.com/trufflesecurity/trufflehog
alt: gitleaks
---
## What it's for
TruffleHog finds secrets in code, like [Gitleaks](/tools/gitleaks/), with one notable addition: for many kinds of key, it can verify whether the secret is still live by testing it against the service.

## How it works
It scans repositories, file systems and other sources against hundreds of secret detectors. When it finds a candidate credential, a verifier makes a harmless API call to check whether it's active. That verification cuts the noise sharply, since a live key is urgent while a long-revoked one is only cleanup. It's the feature that sets it apart.

## Try it
::: law Your secrets only
Only verify credentials you own. Testing someone else's key against a service is unauthorised access.
:::

```
trufflehog git file://. --only-verified
```

Scan a test repository that contains one of your own revoked keys, and see how it reports a verified versus an unverified finding.

## What defenders see
Verification lets you act on the live secrets first. As with any secret found, rotate it before anything else. Build this into your pipelines, and remember that the scan results themselves list where your secrets are, so handle them carefully.

?! Why does checking whether a found secret is still active help a response team prioritise?
