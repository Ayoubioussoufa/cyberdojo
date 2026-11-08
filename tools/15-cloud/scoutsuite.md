---
title: ScoutSuite
summary: Reviews a cloud account's security and shows it in one report.
side: both
use: own
docs: https://github.com/nccgroup/ScoutSuite
alt: prowler
---
## What it's for
ScoutSuite, from NCC Group, audits a cloud account and produces a single HTML report of its security posture across many services. It's a common tool for a cloud security review.

## How it works
Using read-only access, it gathers configuration from the provider's APIs across services such as storage, identity, compute and networking. Then it applies rules and presents the findings in a browsable report, grouped by service and severity. Its strength is the single clear picture of a whole account, which is useful for a one-off assessment.

## Try it
::: law Your account only
Use read-only credentials and an account you're authorised to assess.
:::

```
scout aws --profile audit
```

Run it against a lab account, open the report, and compare its findings with [Prowler's](/tools/prowler/) on the same account. Where do they agree?

## What defenders see
Use it as a periodic review and to brief non-specialists, since the report is readable. For continuous checking, a scheduled tool fits better. As always in the cloud, identity and public exposure are where to look first.

?! Why might you run two different cloud auditors against the same account?
