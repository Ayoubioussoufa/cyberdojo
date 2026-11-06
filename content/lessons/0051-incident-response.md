---
title: Incident response
summary: What to do when it's real: preparing, containing, recovering and reporting, using NIST's current guidance.
month: 11
minutes: 40
builds: run a simulated incident and write the report
source: NIST SP 800-61 Rev. 3 | https://csrc.nist.gov/pubs/sp/800/61/r3/final
words: containment, eradication, chain of custody
---
Detection tells you something's wrong. Incident response decides what happens next, usually under pressure, with incomplete information, and with the business watching.

@term incident = An event that actually harms or threatens the security of systems or data.
@term containment = Stopping an attack from spreading or causing more harm.
@term eradication = Removing the attacker's access and tools.
@term chain of custody = A record of who handled evidence and when.
@term root cause = The underlying reason an incident was possible.
@term tabletop exercise = A discussion-based rehearsal of an incident.
@term Velociraptor = A free tool for collecting evidence and hunting across endpoints.

## The current guidance

[NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final), published in April 2025, supersedes Rev. 2 and ties incident response to [CSF 2.0](https://www.nist.gov/cyberframework). You'll still see the classic steps below in many playbooks.

@flow Prepare > Detect and analyse > Contain > Eradicate > Recover > Learn

## Containment is a trade-off

| Choice | Benefit | Cost |
|---|---|---|
| Isolate now | Stops the harm | May tip off the attacker |
| Watch for a while | Learn the full scope | Risk of further harm |
| Power off | Stops everything | Destroys evidence in memory |

Who decides? It's a documented management decision, not an analyst's preference, weighing business impact, legal duties and evidence.

?? Ransomware is found on three servers. What's the first priority?
+ Confirm it, then contain while preserving evidence
- Wipe and rebuild all the servers immediately
- Pay the ransom before the price rises
- Announce the breach publicly with full details
=> Wiping destroys what you need to understand scope and root cause. Contain first, then recover from validated backups.

## Evidence

Record what you did, when, and why, with times in **UTC**. Hash what you collect. Keep a **chain of custody**. A rule of thumb from Month 2 applies: note what's **confirmed** and what's **suspected**.

## Communication

An incident is also a communication problem. Executives, legal, customers and regulators each need different things, and some laws set deadlines for telling them.

## After the incident

The lessons-learned meeting is where the value is. Keep it blameless, and give each action an owner and a date. The [incident report template](/guides/n1-templates/) has the structure.

::: try Run one
In your lab, have a friend or a script perform a simple simulated intrusion. Respond end to end with [Velociraptor](https://docs.velociraptor.app/), then write the report. Use a [CISA tabletop package](https://www.cisa.gov/resources-tools/services/cisa-tabletop-exercise-packages) to rehearse with friends.
:::

?! Write a five-sentence executive summary of an imaginary phishing incident, with no jargon.
