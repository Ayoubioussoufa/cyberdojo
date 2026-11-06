---
title: Cloud detection and posture
summary: Reading CloudTrail, responding to a leaked key, posture scanning with Prowler, and protecting Entra and Microsoft 365.
month: 14
minutes: 40
builds: a key-compromise playbook, and a measured posture improvement
source: Prowler documentation | https://docs.prowler.com/
words: CloudTrail event, posture management, key rotation
---
Cloud makes logging easier: nearly everything is an API call, and API calls can be recorded. This lesson is about using those records.

@term posture management (CSPM) = Continuously checking cloud configuration against best practice.
@term Prowler = An open-source tool that audits cloud security posture.
@term key rotation = Replacing a credential with a new one.

## Reading CloudTrail

Each event answers: **who** (`userIdentity`), **what** (`eventName`), **where from** (`sourceIPAddress`), **when** (`eventTime`).

| Worth a detection | Why |
|---|---|
| `StopLogging` on a trail | Someone's blinding you |
| A new access key created for another user | Possible persistence |
| Unusual `AssumeRole` | Possible movement |
| A bucket policy opened to everyone | Data exposure |

@drill log-source

## A leaked key: the response

@flow Disable the key > Review CloudTrail > Scope what it could reach > Rotate dependents > Check for persistence > Fix the leak path > Prevent

Prevention means short-lived credentials, OIDC for pipelines, and secret scanning.

?? A key appears on public GitHub. What comes first?
+ Deactivate the key, then review its activity
- Delete the repository, then wait and see
- Email the whole company about the mistake
- Rotate it next week during planned maintenance
=> Bots find keys within minutes. Stop the access first, then work out what happened. Deleting the repo doesn't help, since the key may already be copied.

## Posture

[Prowler](https://docs.prowler.com/) checks your account against benchmarks such as the [CIS AWS Foundations Benchmark](https://www.cisecurity.org/benchmark/amazon_web_services). Don't try to fix everything: rank by exposure and data sensitivity, fix in code, and rescan to prove it.

## Microsoft identity and M365

Many enterprises in Europe and North Africa run Microsoft, so this matters. Watch for:

- **Malicious inbox rules:** a classic sign of email compromise.
- **Unusual OAuth app consent.**
- **Sign-ins** from impossible locations, or unfamiliar devices.

Protect with Conditional Access, [Privileged Identity Management](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure), and restricted app consent.

?? In M365, a compromised mailbox has a new rule forwarding invoices elsewhere. What's that a sign of?
+ Business email compromise, staying quietly hidden
- A routine quarterly mailbox storage cleanup
- An expected effect of licence updates
- Normal behaviour of a spam filter
=> Forwarding rules let an attacker watch and redirect payment conversations.

?! List the first five things you'd do if an AWS key leaked at 2 a.m.
