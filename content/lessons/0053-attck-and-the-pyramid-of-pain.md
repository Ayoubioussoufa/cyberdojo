---
title: Behaviours, not indicators
summary: Mapping alerts to ATT&CK, IOCs versus TTPs, and why the Pyramid of Pain shapes good detection.
month: 9
minutes: 20
builds: map alerts to ATT&CK accurately, and rank indicators by value
source: The Pyramid of Pain, David Bianco | https://detect-respond.blogspot.com/2013/03/the-pyramid-of-pain.html
words: IOC, TTP, Pyramid of Pain
---
You can block a bad IP today, and tomorrow the attacker has a new one. Good defenders aim for what's expensive for attackers to change.

@term Pyramid of Pain = A model ranking indicators by how much it hurts an attacker when you detect them.
@term ATT&CK Navigator = A web tool for visualising coverage across ATT&CK techniques.

## The Pyramid of Pain

[David Bianco's model](https://detect-respond.blogspot.com/2013/03/the-pyramid-of-pain.html), from easiest to replace to hardest:

| Level | Example | Pain for the attacker |
|---|---|---|
| Hash values | A file's SHA-256 | Trivial: change one byte |
| IP addresses | `203.0.113.7` | Easy |
| Domain names | `evil.example` | Simple |
| Network and host artifacts | A distinctive path or user agent | Annoying |
| Tools | A specific attack tool | Challenging |
| **TTPs** | How they behave | Tough: they must change how they work |

Indicators are still useful: they're quick to search. But **detections built on behaviour last longer**.

?? Which detection will survive the longest as an attacker changes their setup?
+ Office apps spawning a script interpreter here
- A single SHA-256 of one known file
- One IP address from last week's report
- A domain name from a past incident
=> The behaviour stays the same even when files and infrastructure change.

## Mapping an alert

For each alert ask: what's the attacker trying to do (tactic), and how (technique)? Then look it up on [ATT&CK](https://attack.mitre.org/).

::: trap Precision is the skill
Don't map generously to look thorough. Map only what the evidence shows, and cite it. An LLM mapping needs checking line by line, as you'll do in Month 15.
:::

@drill tactic

?! Take the triage mission from lesson 51. List its indicators, and put each on the pyramid.
