---
title: Templates
summary: Ready-to-copy structures for lab notes, write-ups, findings, incident reports, READMEs, retrospectives and your AI log.
group: Habits
minutes: 6
source: Keep these in your vault's 90-Templates folder | https://obsidian.md/
---
Consistency turns two years of notes into a searchable body of knowledge, and a lab session into a portfolio artifact. Every block below has a copy button.

## Lab note (written during the session)

```
Date / duration / environment: which VMs, snapshot, versions
Goal: one sentence, what I'm trying to achieve or verify
Commands and output: exact commands, key output, screenshots
What failed and why: the most valuable section
Result: did the goal succeed? Evidence
Lessons: two or three sentences in my own words
Next: the single next action
```

## Public write-up (800–1,500 words)

```
Context: what I was working on and why it matters
Problem: the specific challenge, stated precisely
Approach: what I tried, including the dead ends
Evidence: commands, screenshots, logs, diagrams
Result: what worked, with numbers where possible
Lessons and limitations: what I'd change, what's unsolved
References: primary sources, so readers can verify
```

## Penetration test finding

```
Title: impact-first, e.g. "Unauthenticated access to customer invoices via IDOR"
Severity: CVSS 4.0 vector plus a one-line business rationale
Affected assets: hosts, URLs, parameters, accounts used
Description: root cause, not just the symptom
Reproduction: numbered steps a developer can follow
Impact: what an attacker gains, in the client's terms
Remediation: specific fix, strategic recommendation, effort
References: OWASP cheat sheet, vendor documentation
```

## Incident report

```
Executive summary: what happened, impact, status, five sentences, no jargon
Timeline (UTC): detection, attacker actions, response, containment, recovery
Scope and impact: systems, accounts, data; confirmed vs suspected
Root cause: initial access and what allowed escalation
Actions taken: containment, eradication, recovery, owners, timestamps
Indicators and ATT&CK mapping: for detection and sharing
Lessons learned: concrete actions with owners and due dates
Evidence appendix: collection method, hashes, tooling, chain of custody
```

## Project README

```
Purpose: one paragraph and a diagram, above the fold
Architecture / environment: what it contains, how it fits together
Quick start: how to reproduce it in under 30 minutes
What it demonstrates: skills and techniques, stated plainly
Findings / results: detections, vulnerabilities, metrics, before/after
Limitations and next steps: honest scope boundaries
Safety and legal note: lab-only, authorization, no real data
References and licence
```

## Monthly retrospective (60 minutes)

```
Milestones: which I passed and didn't, with evidence
Hours by category: versus the target mix
Artifacts shipped: project progress, write-ups, rules or code
AI log review: error patterns this month
What worked / what didn't: two bullets each, specific
Changes for next month: one process change only
Career action: one done, one planned
```

## AI verification log

One line per checked claim:

```
date | context | claim made by the model | source checked | verdict | error type
```

Verdicts: correct, wrong, half-right. Error types worth tracking: invented flag or parameter, wrong identifier (CVE, ATT&CK, event ID), outdated product or portal, over-permissive configuration, fabricated citation, plausible but untested logic.

::: key A closing note
This roadmap is deliberately over-specified: it's easier to adapt a detailed plan than to invent one every month. Skip what doesn't fit, slow down where it gets hard, and keep the three things that make it work: **unaided practice, finished projects, and writing it all down.** Everything else is scaffolding.
:::
