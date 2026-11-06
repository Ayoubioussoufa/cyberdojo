---
title: Behaviours, not indicators
summary: Mapping alerts to ATT&CK, IOCs versus TTPs, and why the Pyramid of Pain shapes good detection.
month: 9
minutes: 35
builds: map alerts to ATT&CK accurately, and rank indicators by value
source: The Pyramid of Pain, David Bianco | https://detect-respond.blogspot.com/2013/03/the-pyramid-of-pain.html
words: IOC, TTP, Pyramid of Pain
---
You can block a bad IP today, and tomorrow the attacker has a new one. Good defenders aim for what's expensive for attackers to change. This lesson gives you the two ideas behind that: a way to rank clues, and a shared map of how attackers behave.

@term Pyramid of Pain = A model ranking indicators by how much it hurts an attacker when you detect them.
@term ATT&CK Navigator = A web tool for visualising coverage across ATT&CK techniques.
@term sub-technique = A more specific version of an ATT&CK technique, written like T1059.001.
@term hunting = Actively searching for attackers that no alert has caught.

## Clues and habits

Think of a burglar. A fingerprint on one window is an **IOC**, an indicator of compromise: a specific clue that proves something happened. The burglar's habit of always entering through the back window at night is a **TTP**: tactics, techniques and procedures, or how they work.

Wear gloves and the fingerprint is gone. The habit is much harder to change. So an IOC tells you about yesterday, while a TTP can catch tomorrow.

| | IOC | TTP |
|---|---|---|
| Example | `203.0.113.7`, a file hash | "Word starts PowerShell" |
| Lifespan | Hours to weeks | Months to years |
| Effort to detect | Low: search for it | Higher: needs good logs |
| Best use | Quick checks, scoping | Lasting detections |

?? Which of these is a TTP rather than an IOC?
+ Dumping credentials from memory after logging in
- The SHA-256 hash of one specific file
- The IP address `198.51.100.23` from a report
- The domain name `update-check.example` seen in logs
=> A hash, an address and a domain are specific artefacts. Dumping credentials is a behaviour, whichever tool does it.

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

Indicators are still useful: they're quick to search, and they help you scope. But **detections built on behaviour last longer**.

@drill ioc-rank

?? Which detection will survive the longest as an attacker changes their setup?
+ Office apps spawning a script interpreter here
- A single SHA-256 of one known file
- One IP address from last week's report
- A domain name from a past incident
=> The behaviour stays the same even when files and infrastructure change.

## See the difference

Try it. The first mission searches by hash. The second searches by behaviour. Compare what each one finds.

@range behaviour

?? After the two missions, why was searching for the hash alone dangerous?
+ It suggested one victim when there were several
- It took too long to search the logs
- Hashes are illegal to store in a SIEM
- It deleted the evidence from the export file
=> The attacker repacked the file per victim. Searching for one hash gives false comfort about the scope.

## Mapping an alert to ATT&CK

[ATT&CK](https://attack.mitre.org/) is a public catalogue of real attacker behaviour. It has two main parts: **tactics**, which are the goals, and **techniques**, which are the ways of achieving them. Many techniques split into **sub-techniques**.

For each alert, ask two questions: what's the attacker trying to do, and how?

| Alert | Tactic (why) | Technique (how) |
|---|---|---|
| Word started PowerShell, which ran a script | Execution | T1059.001 PowerShell |
| New scheduled task runs at logon | Persistence | T1053.005 Scheduled Task |
| Fifty failed logins, then a success | Credential Access | T1110 Brute Force |

One technique can serve several tactics, so the same behaviour may appear twice on the map.

::: trap Precision is the skill
Don't map generously to look thorough. Map only what the evidence shows, and cite it. An LLM mapping needs checking line by line, as you'll do in Month 15.
:::

@drill tactic

?? An alert shows PowerShell started by Word, and nothing else. A colleague maps it to six techniques. What's wrong?
+ The mapping claims more than the evidence shows
- Six is fewer than ATT&CK normally requires here
- ATT&CK can only ever map a single tactic
- PowerShell isn't a technique listed anywhere in ATT&CK
=> Each mapped technique needs its own evidence. Over-mapping makes reports look thorough while making them less true.

## From map to plan

Hunters use this in reverse. Pick a behaviour your organisation can't currently detect, write a hypothesis, and go looking. That's **hunting**: searching for an attacker no alert has caught.

@flow Pick a technique > Write a hypothesis > Query the logs > Found something? Investigate > Found nothing? Write a detection anyway

?! Take the triage mission from lesson 51. List its indicators, and put each on the pyramid.
