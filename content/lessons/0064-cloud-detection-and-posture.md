---
title: Cloud detection and posture
summary: Reading CloudTrail, responding to a leaked key, posture scanning with Prowler, protecting Entra and Microsoft 365, and what other clouds call the same things.
month: 14
minutes: 80
builds: a key-compromise playbook, and a measured posture improvement
source: Prowler documentation | https://docs.prowler.com/
words: CloudTrail event, posture management, key rotation
---
Cloud makes logging easier: nearly everything is an API call, and API calls can be recorded. This lesson is about using those records.

@term posture management (CSPM) = Continuously checking cloud configuration against best practice.
@term Prowler = An open-source tool that audits cloud security posture.
@term key rotation = Replacing a credential with a new one.
@term management event = A CloudTrail record of a change to resources, such as creating a role.
@term data event = A CloudTrail record of reading or writing the data itself, such as fetching a file from S3.
@term device-code phishing = Tricking someone into approving a sign-in for the attacker by entering a code on a real login page.
@term consent phishing = Tricking someone into granting a malicious app access to their data.
@term PIM (Privileged Identity Management) = A Microsoft service that gives admin rights only when needed, for a limited time.

## Reading CloudTrail

Here's one event, trimmed down:

```json
{
  "eventTime": "2026-10-27T02:06:02Z",
  "eventName": "StopLogging",
  "sourceIPAddress": "203.0.113.7",
  "userIdentity": { "type": "IAMUser", "userName": "ci-bot" },
  "requestParameters": { "name": "main-trail" }
}
```

Each event answers: **who** (`userIdentity`), **what** (`eventName`), **where from** (`sourceIPAddress`), **when** (`eventTime`).

There's one catch to learn now. **Management events**, such as creating a user, are recorded by default. **Data events**, such as reading a file from a bucket, are not, because there are so many of them. If you never turned them on, you can't prove what was read.

A real event has more fields than that. These are the ones you'll use most:

| Field | Tells you |
|---|---|
| `eventSource` | The service that was called, such as `iam.amazonaws.com` |
| `awsRegion` | Where. Activity in a region you never use is a signal by itself |
| `userIdentity.accessKeyId` | Which key signed the request |
| `userAgent` | The tool that made the call: the console, the CLI or a script |
| `errorCode` | Present only when the call failed, for example `AccessDenied` |
| `readOnly` | `true` for calls that only look, `false` for calls that change something |

Failures matter as much as successes. An identity doing its usual job rarely hits `AccessDenied`. A stolen key in the hands of someone exploring hits it again and again, as they try one API after another.

@code denied-bursts

| Worth a detection | Why |
|---|---|
| `StopLogging` on a trail | Someone's blinding you |
| A new access key created for another user | Possible persistence |
| Unusual `AssumeRole` | Possible movement |
| A bucket policy opened to everyone | Data exposure |

A watch list like that one can be written as code, which is the first step towards an alert.

@code trail-watchlist

@drill log-source

?? An attacker read files from a bucket, but CloudTrail shows nothing. What's the likely reason?
+ S3 data events were never turned on
- CloudTrail deletes all reads after a day
- Attackers can always hide from CloudTrail logs
- Reading a file isn't an API call
=> Object reads are data events, which you have to enable. Decide this before you need it, because it can't be turned on backwards.

## Investigate one

These missions use `jq`, a tool for querying JSON. It's the same filter-then-print thinking as `grep` and `awk`.

CloudTrail delivers files whose top level is a list called `Records`. Three queries cover most first looks:

```
jq -r '.Records[] | [.eventTime, .userIdentity.userName, .eventName, .sourceIPAddress] | @tsv' trail.json
jq '.Records[] | select(.errorCode == "AccessDenied")' trail.json
jq -r '.Records[].eventName' trail.json | sort | uniq -c | sort -rn
```

The first prints a timeline, with one event on each line. The second keeps only the calls that failed. The third counts how often each API was called, and the rare names at the bottom of that list are often the interesting ones.

@range trail

## A leaked key: the response

@flow Disable the key > Review CloudTrail > Scope what it could reach > Rotate dependents > Check for persistence > Fix the leak path > Prevent

Do these in order. Disabling first stops the bleeding, while keeping the evidence. Checking for persistence matters because a smart attacker creates a second key straight away, so killing the first achieves little. Prevention means short-lived credentials, OIDC for pipelines, and secret scanning.

The first two steps, as commands:

```
aws iam update-access-key --user-name ci-bot --access-key-id AKIAIOSFODNN7EXAMPLE --status Inactive
aws cloudtrail lookup-events --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=AKIAIOSFODNN7EXAMPLE
```

The key is set to `Inactive` rather than deleted. It stops working at once, but it stays listed, so you can still tie events to it, and you can switch it back if you disabled the wrong one. `lookup-events` searches the last 90 days of management events. From its output you want four facts: when the key was first used, when it was last used, from which addresses, and which calls it made.

@code key-scope

?? A key appears on public GitHub. What comes first?
+ Deactivate the key, then review its activity
- Delete the repository, then wait and see
- Email the whole company about the mistake
- Rotate it next week during planned maintenance
=> Bots find keys within minutes. Stop the access first, then work out what happened. Deleting the repo doesn't help, since the key may already be copied.

## Posture

**Posture** is how your configuration compares with good practice, measured constantly. [Prowler](https://docs.prowler.com/) checks your account against benchmarks such as the [CIS AWS Foundations Benchmark](https://www.cisecurity.org/benchmark/amazon_web_services). A first scan returns hundreds of findings, and trying to fix them all is how teams give up. Rank by two questions: is it exposed to the internet, and how sensitive is what's behind it? Fix in code, and rescan to prove it.

| Finding | Exposed? | Sensitive? | Priority |
|---|---|---|---|
| Public bucket with invoices | Yes | Yes | Now |
| Public bucket with website images | Yes | No | Review, likely intended |
| Unencrypted disk on an internal test box | No | No | Later |

Running it takes one line, and a second one narrows the output:

```
prowler aws
prowler aws --severity critical high
```

Each check comes back as `PASS` or `FAIL`, with a severity, the resource and a suggested fix. The severity is the tool's general opinion. It doesn't know which bucket holds the invoices, so your own ranking goes on top. One case sits between the rows above: something sensitive that isn't exposed, such as an internal database with no encryption, comes soon, after the exposed and sensitive ones.

@code rank-findings

?? A scan reports 600 findings. What's the best first move?
+ Rank them by their exposure and data sensitivity
- Start from the top and fix them all
- Export them to a PDF for the team
- Ignore the scanner, as it's far too noisy
=> Without a ranking you'll spend weeks on low-value fixes. Exposure and sensitivity tell you where real risk sits.

## Microsoft identity and M365

Many enterprises in Europe and North Africa run Microsoft, so this matters. Watch for:

- **Malicious inbox rules:** a classic sign of email compromise.
- **Unusual OAuth app consent**, known as **consent phishing**: a user is tricked into approving a malicious app.
- **Device-code phishing:** a person types a code into a genuine Microsoft page, approving a login for someone else.
- **Token theft:** a stolen session skips the login and MFA.
- **Sign-ins** from impossible locations, or unfamiliar devices.

Protect with Conditional Access, [Privileged Identity Management](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure), and restricted app consent. **PIM** means that nobody holds admin rights all the time: they ask, with a reason, and it expires.

?? In M365, a compromised mailbox has a new rule forwarding invoices elsewhere. What's that a sign of?
+ Business email compromise, staying quietly hidden
- A routine quarterly mailbox storage cleanup
- An expected effect of licence updates
- Normal behaviour of a spam filter
=> Forwarding rules let an attacker watch and redirect payment conversations.

## The same ideas, other names

Learn the concept once, and only the name changes.

| Concept | AWS | Azure | Google Cloud |
|---|---|---|---|
| Identity | IAM | Entra ID, Azure RBAC | Cloud IAM |
| Audit log | CloudTrail | Activity Log | Cloud Audit Logs |
| Object storage | S3 | Blob Storage | Cloud Storage |
| Threat detection | GuardDuty | Defender for Cloud | Security Command Center |

?? You know AWS well, and a job uses Google Cloud. Which log do you look for first?
+ Cloud Audit Logs, the CloudTrail equivalent over there
- S3 access logs, which work on every provider
- Windows Security logs from one domain controller here
- GuardDuty findings, exported directly from your AWS account
=> Concepts transfer between clouds. Who called which API is recorded in every one of them.

## Review a night's trail

A colleague sends you five events from last night and asks whether to wake anyone.

| Time (UTC) | Identity | Event | From | Error |
|---|---|---|---|---|
| 02:01:10 | `ci-bot` | `ListBuckets` | 203.0.113.7 | |
| 02:01:14 | `ci-bot` | `ListUsers` | 203.0.113.7 | `AccessDenied` |
| 02:01:19 | `ci-bot` | `DescribeInstances` | 203.0.113.7 | `AccessDenied` |
| 02:04:40 | `ci-bot` | `CreateAccessKey`, for the user `admin-ana` | 203.0.113.7 | |
| 02:06:02 | `ci-bot` | `StopLogging` | 203.0.113.7 | |

?? What do the two `AccessDenied` lines suggest?
+ Someone is exploring what this key allows
- The pipeline is running its normal job
- AWS was having an outage that night
- CloudTrail recorded those two events by mistake
=> A build bot calls the same few APIs every day and doesn't ask for the user list. Trying unrelated calls and being refused is what looking around with a stolen key looks like.

?? Which event gives the attacker a way back in after `ci-bot`'s key is disabled?
+ `CreateAccessKey`
- `ListBuckets`
- `StopLogging`
- `DescribeInstances`
=> The new key belongs to `admin-ana`, not to `ci-bot`. Disabling the leaked key leaves it working, which is why the playbook checks for persistence.

?? After 02:06:02 the trail shows nothing more. What does that silence mean?
+ Logging was stopped, so nothing was recorded
- The attacker gave up and went away
- Every later call was denied by AWS
- The key expired at exactly that time
=> `StopLogging` is the last thing you see, not the last thing that happened. Yes, wake someone: everything after that moment has to be rebuilt from other sources.

?! List the first five things you'd do if an AWS key leaked at 2 a.m.
