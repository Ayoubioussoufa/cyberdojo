---
title: Lantern
summary: Test a small company's web server from the outside, reach root, then change sides, trace what you did, and harden it until a rescan proves the fix.
level: Beginner
month: 3
minutes: 75
builds: a complete attack and defence loop on one machine, and a short report
words: attack chain, proof of impact, rules of engagement
---
Oasis Logistics has hired you for a small test of `lantern`, the server behind its parcel-tracking site. The owner signed the scope on 20 October. You'll play both sides: first the tester who finds the way in, then the defender who reads the traces and closes the door.

@term attack chain = The sequence of steps an intrusion follows, where breaking one link stops the rest.
@term proof of impact = The smallest harmless action that shows a weakness is real.
@term rules of engagement = The written agreement saying what a tester may and may not do.

::: law This is a simulation
`lantern` is fictional, and this terminal is a program in your browser. Nothing here touches a real host. On real systems, scanning or logging in without written permission is a crime, even out of curiosity. To practise on real machines legally, use [TryHackMe](https://tryhackme.com/) or [Hack The Box](https://www.hackthebox.com/), which are built for it.
:::

## Before you start

| You'll use | Learned in |
|---|---|
| `grep`, `cat`, pipes | [Lessons 5 and 6](/courses/0005-reading-and-finding/) |
| Permissions and `chmod` | [Lesson 7](/courses/0007-users-and-permissions/) |
| `nmap` and ports | [Lesson 22](/courses/0022-scanning-with-nmap/) |
| Reading logs | [Lesson 27](/courses/0027-parsing-logs-with-python/) |

?? Why does a professional tester read the scope document before running anything?
+ It's what makes the testing legal and bounded
- It contains the passwords needed for the target
- It tells the target's firewall to allow scans
- It makes the scanning tools run much faster
=> Written authorisation separates a test from a crime. It also says what's off limits, so you stop before causing harm.

## The machine

Six stages, each graded automatically. Take your time, and use the hints only when you're stuck.

@range lantern

## What just happened

You followed an **attack chain**. Each link was small, and most weren't even bugs.

| Stage | What worked | ATT&CK | What breaks this link |
|---|---|---|---|
| Scan | A forgotten service on a high port | T1595 Active Scanning | Know your exposed ports |
| Backup | A password in a file on the web server | T1552.001 Credentials In Files | Keep secrets out of the web root |
| Login | The same password worked for SSH | T1078 Valid Accounts | SSH keys, no reused passwords |
| Root | Root ran a script anyone could edit | T1053.003 Cron | Correct file permissions |

Your **proof of impact** was one harmless line. You didn't create accounts, change data or take the site down, which is what separates a professional from a vandal.

?? The chain had four links. Which fix would have stopped the attacker earliest?
+ Keeping the backup out of the web root
- Tightening the permissions on that cron script
- Restarting the server every single night at midnight
- Renaming the `deploy` account to something else entirely
=> The earlier a chain breaks, the less the attacker learns. But fix every link, because defence shouldn't depend on one.

## Why defenders should try this

You read `access.log` differently once you've made those entries yourself. You know that a fetch of `robots.txt`, then `/backup/`, then a login from the same IP, is a story and not three separate events.

?? What's the best detection idea from this machine?
+ A secret file fetched, then a login from there
- Any visit to the home page of the site today
- Every successful login from one internal address here
- All the requests that return a status of 200
=> Correlating two events from one source is far stronger than either alone, and it fires rarely.

## Write it up

A finding has a title, impact, steps, evidence and a fix. Here's the start of one:

> **Secret file exposed in the web root.** Severity: high. Anyone on the internet could download `/backup/.env.bak`, which contains a database password that also works for SSH.

?! Write the full finding for the writable cron script: impact, steps to reproduce, evidence, and the fix.
