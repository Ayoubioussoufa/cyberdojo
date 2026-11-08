---
title: Prowler
summary: Audits a live cloud account against security best practices.
side: both
use: own
docs: https://docs.prowler.com/
alt: scoutsuite, trivy
---
## What it's for
Checkov reads your code; Prowler inspects what's actually running. It audits a live AWS, Azure, Google Cloud or Kubernetes account against hundreds of checks, and maps them to standards such as CIS and PCI.

## How it works
It uses your read-only credentials to call the cloud provider's APIs and examine real settings: public buckets, users without multi-factor, over-permissive policies, logging that's switched off. Because it sees the running state, it catches things that code scanning misses, such as changes made by hand in the console.

## Try it
::: law Your account only
Use read-only credentials for an account you own or are authorised to audit.
:::

```
prowler aws --profile audit -M html
```

Run it against a free-tier lab account, open the HTML report, and fix the top finding, such as enabling MFA on an account.

## What defenders see
This is a core cloud defence. Run it on a schedule, track the findings over time, and prioritise identity issues, since in the cloud a weak permission is often the whole attack path. [AWS attack paths](/modules/10-01-aws-attack-paths/) shows why.

?! Why does scanning a live cloud account find risks that scanning its Terraform code never could?
