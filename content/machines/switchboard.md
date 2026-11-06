---
title: Switchboard
summary: A bucket, a leaked key and an admin bot. See what an outsider sees, read CloudTrail to learn what they did, then contain and evict them in a fictional AWS account.
level: Intermediate
month: 14
minutes: 60
builds: a cloud key-compromise response, proven with a posture scan
words: blast radius, cloud persistence
---
Oasis Logistics moved to AWS last year. On Thursday, a customer emails to say they found a strange file through a search engine. You're the person who looks into it.


::: law This is a simulation
This is a fictional account, and the `aws` command here is a small program that reaches nothing. Requesting someone else's bucket anonymously, even a public one, can be unlawful where you have no permission. Practise on your own account, or on [flAWS](http://flaws.cloud/).
:::

## Before you start

You'll need IAM from [lesson 63](/courses/0063-cloud-foundations-and-iam/), and CloudTrail with `jq` from [lesson 64](/courses/0064-cloud-detection-and-posture/).

?? Why start by looking at the bucket as an anonymous outsider?
+ It shows exactly what anyone can already reach
- Anonymous requests can't appear in any logs anywhere
- Admins are not allowed to view those buckets
- It costs far less than an authenticated request
=> An outsider's view is the honest measure of exposure, and it tells you what was public, rather than what you can see as an admin.

## The machine

@range switchboard

## What just happened

| Stage | Finding | ATT&CK |
|---|---|---|
| Exposure | A public bucket with a key in a file | T1530 Data from Cloud Storage, T1552.001 Credentials In Files |
| Blast radius | A build bot with full admin | T1078.004 Cloud Accounts |
| Persistence | A new admin user and its own key | T1136.003 Create Account: Cloud Account |
| Hiding | CloudTrail turned off | T1562.008 Disable or Modify Cloud Logs |

?? Why wasn't deactivating the leaked key enough?
+ The attacker had already created another admin user
- Deactivated keys automatically come back within one day
- Keys can only be removed by the provider
- The key was never really used by anyone
=> A smart attacker makes their own way back within minutes. Always look for what was created while the key was live.

## The fixes that outlast today

Containment stops this incident, and these stop the next one.

| Fix | Why |
|---|---|
| Block Public Access at account level | One switch stops this entire class |
| Give `ci-bot` a narrow role, and use OIDC | No long-lived key left to leak |
| Alert on `StopLogging` and `CreateUser` | You'd have known within minutes |
| Scan for secrets before commit | The key never reaches a file |

?? Which change would have reduced the blast radius the most?
+ Giving the bot only the rights it needs
- Renaming the bucket to something harder to guess
- Rotating the key once a year on schedule
- Moving all the servers to another AWS region
=> Least privilege decides how bad a leak gets. Names and regions don't limit what a key can do.

## Write it up

?! Write the first five lines of the cloud incident report: what happened, when, what was exposed, what you did, and what's still unknown.
