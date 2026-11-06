---
title: Harbor
summary: You're on call when a file server hits 100% CPU. Find the intruder's program, how it survives, how they got in and what they left behind, then evict them in the right order.
level: Beginner
month: 11
minutes: 60
builds: a full incident response on a live Linux host, and an incident summary
words: persistence, eradication order, scoping
---
It's 03:40. Monitoring says `harbor`, a file server, has been at 100% CPU for half an hour. Nobody is working. You're on call, and you're the only one awake.

This machine has no attacker's view. An attacker has already been here, and you arrive after them, which is how most defenders meet attackers in real life.

@term scoping = Working out how far an intrusion has spread before you act on it.


::: law This is a simulation
`harbor` is fictional. On a real incident, follow your organisation's plan, and don't change anything before evidence has been preserved.
:::

## Before you start

You'll need processes and `kill` from [lesson 9](/courses/0009-processes-and-signals/), and the incident lifecycle from [lesson 59](/courses/0059-incident-response/).

?? The server is clearly compromised. Why not simply kill the bad process right away?
+ You'd lose time and alert them before scoping
- Killing processes is illegal during an active incident
- The process will delete all the server's data
- Only the attacker is able to stop it
=> Look first. Understanding persistence and scope tells you what a real clean-up needs. A kill alone usually just restarts the problem.

## The machine

@range harbor

## What just happened

| Stage | Finding | ATT&CK |
|---|---|---|
| CPU | A miner, using the server's power for someone else's profit | T1496 Resource Hijacking |
| Persistence | A cron file that restarts it every minute | T1053.003 Cron |
| Entry | A guessed password on `backup` | T1110 Brute Force |
| Extra doors | A second UID 0 account and a planted SSH key | T1136.001 Local Account, T1098.004 SSH Authorized Keys |

The order you worked in is the lesson. Understand, then scope, then remove the reasons it comes back, and only then remove the thing itself.

?? What would have happened if you'd only killed the process and deleted the miner?
+ Cron would keep trying, with two doors open
- The server would be fully clean and safe
- The attacker would automatically lose all their access
- The operating system would block further logins forever
=> Cleaning symptoms leaves the foothold in place. The attacker still has a root account and an SSH key.

## Rebuild or clean?

You cleaned this host because that's what the simulator lets you do. In real life, an attacker who had root may have changed things you can't see, so the usual answer is to preserve evidence, then rebuild from a known-good image and restore the data. Cleaning a host in place is a decision to record, with its reasons.

Then fix the root cause: no password logins over SSH, MFA where you can, and an alert for many failures followed by a success.

?? An attacker had root. Why is rebuilding usually safer than cleaning?
+ You can't ever prove what else they changed
- Rebuilding is always much cheaper than any cleaning
- Cleaned servers can never connect to the network
- The law forbids reusing a compromised server anywhere
=> With root they could alter anything, including the tools you'd use to check. A rebuild starts from something you trust.

## Write it up

?! Write the executive summary of this incident in five sentences, with times in UTC, no jargon, and what must happen next.
