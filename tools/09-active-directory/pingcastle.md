---
title: PingCastle
summary: Scores an Active Directory's security and reports what to fix.
side: defence
use: open
docs: https://www.pingcastle.com/documentation/
alt: purple-knight, bloodhound
---
## What it's for

Active Directory is the backbone of most corporate networks, and years of changes leave weaknesses behind. PingCastle audits a domain and produces a clear report with a risk score, so defenders can see and fix the worst problems. It's a staple of AD health reviews.

## How it works

Running with ordinary read access, it queries the directory for well-known risk indicators: stale accounts, weak trust settings, dangerous permission grants, outdated protocols, and accounts whose configuration invites credential attacks. It maps these to a score and a prioritised list. The value is curation: it encodes what experienced assessors look for, so a small team gets an expert's checklist automatically.

## Try it

::: law Your domain only
Run it against a domain you administer or are authorised to assess.
:::

In a lab with a Windows domain controller, run PingCastle's health check, open the report, and work through the top findings. Deliberately weaken one setting, re-run it, and watch the score and the matching finding change.

## What defenders see

This is a defender's tool first. Run it regularly, track the score over time, and treat the high-risk findings as a work list, since each one is a path an intruder would look for. Pair it with [Purple Knight](/tools/purple-knight/) for a second opinion, and feed the fixes into your hardening programme. [Windows defences](/modules/02-09-windows-defences/) covers the controls.

?! Why does a tool that encodes expert checks help a small team more than a longer manual checklist would?
