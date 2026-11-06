---
title: Incident response
summary: What to do when it's real: playbooks, containment trade-offs, evidence, communication and reporting, using NIST's current guidance.
month: 11
minutes: 55
builds: run a simulated incident and write the report
source: NIST SP 800-61 Rev. 3 | https://csrc.nist.gov/pubs/sp/800/61/r3/final
words: containment, eradication, chain of custody
---
Detection tells you something's wrong. Incident response decides what happens next, usually under pressure, with incomplete information, and with the business watching. The teams that do this well aren't calmer people. They prepared, wrote it down and practised.

@term incident = An event that actually harms or threatens the security of systems or data.
@term containment = Stopping an attack from spreading or causing more harm.
@term eradication = Removing the attacker's access and tools.
@term chain of custody = A record of who handled evidence and when.
@term root cause = The underlying reason an incident was possible.
@term tabletop exercise = A discussion-based rehearsal of an incident.
@term Velociraptor = A free tool for collecting evidence and hunting across endpoints.
@term incident commander = The person who coordinates a response and makes sure decisions get made.
@term blameless review = A look back at an incident that asks what failed, not who to punish.
@term lateral movement = An attacker moving from one system to another inside a network.

## The current guidance

[NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final), published in April 2025, supersedes Rev. 2 and ties incident response to [CSF 2.0](https://www.nist.gov/cyberframework): preparing and improving run through the whole organisation, not just the security team. You'll still see the classic steps below in many playbooks, so learn them too.

@flow Prepare > Detect and analyse > Contain > Eradicate > Recover > Learn

| Phase | What happens | Example |
|---|---|---|
| Prepare | Plans, tools, contacts, practice | A tested backup, a phone list on paper |
| Detect and analyse | Is it real? How far has it gone? | Your Month 9 triage |
| Contain | Stop it getting worse | Isolate a laptop, disable an account |
| Eradicate | Remove the foothold | Delete persistence, patch the way in |
| Recover | Return safely to normal | Restore from clean backups, watch closely |
| Learn | Improve | A review with actions and owners |

@drill ir-phase

?? When's the best time to write down who can authorise shutting down a production server?
+ Long before any incident has ever happened
- During the incident, once the attack starts
- After the incident, in the final report
- Only when a regulator explicitly asks you
=> Decisions are slow and poor under pressure. Preparation means they're already made.

## Playbooks

A playbook is a recipe for a kind of incident. Here are the four that the roadmap asks about, in short:

| Incident | First moves | Don't forget |
|---|---|---|
| **Phishing** | Pull the mail, block the domain | Who clicked? Reset their passwords |
| **Ransomware** | Isolate hosts, protect backups | Attackers often steal data first |
| **Compromised account** | Revoke sessions, reset, require MFA | Check for new rules, keys and logins |
| **BEC** | Call finance, contact the bank fast | Inbox rules that hide replies |

An incident also needs roles. One **incident commander** coordinates and keeps time, while others investigate, and someone keeps notes. If everyone investigates, nobody's deciding.

?? An account was compromised, and you've reset its password. Why isn't that enough?
+ Stolen sessions and new keys may still survive
- Password resets take a whole week to apply
- Resetting passwords alerts the attacker to your plan
- The account will still have its old password
=> A session token or a new access key can outlive a password. Revoke sessions and hunt for persistence as well.

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

Record what you did, when, and why, with times in **UTC**. Hash what you collect. Keep a **chain of custody**, which looks like this:

| Item | Hash | Collected by | When (UTC) | Handed to |
|---|---|---|---|---|
| Memory of HR-LAP-12 | `a41f…` | S. Alami | 2026-10-27 10:02 | Evidence store, 10:30 |

A rule of thumb from Month 2 applies: note what's **confirmed** and what's **suspected**, and never let one turn into the other by repetition.

?? Why does a response team record everything in UTC?
+ So logs from different places line up
- Because every country's law requires UTC timestamps
- So attackers can't read any of them
- Because computers can't store local times properly
=> Systems in different time zones produce one story only when the clock is shared.

## Rebuild the story

Now do it. Three logs, one incident. Merge them, find the first touch, and work out the scope.

@range timeline

## Communication

An incident is also a communication problem.

| Audience | Needs |
|---|---|
| Executives | Impact, risk, decisions needed, next update time |
| Legal | Facts, what data, which deadlines apply |
| Customers | What happened, what to do, in plain words |
| Regulators | What the law requires, on time |

Some laws set deadlines: under the GDPR, a notifiable personal-data breach goes to the supervisory authority within 72 hours of becoming aware of it. Assume that an attacker may read your email during an incident, and use a separate channel.

?? An attacker controls your email server. How should the response team talk?
+ On a separate channel set up beforehand
- By email, marked as urgent and confidential
- On company chat that uses those accounts
- By replying to the attacker's ransom note
=> If they can read your plans, they'll act first. A prepared out-of-band channel is part of preparation.

## After the incident

The lessons-learned meeting is where the value is. Keep it **blameless**: people hide mistakes when they fear punishment, and you need the truth. Ask "why" until you reach the **root cause**, which is rarely "a user clicked". Give each action an owner and a date. The [incident report template](/guides/n1-templates/) has the structure: summary, timeline in UTC, scope, root cause, impact, actions and lessons.

::: try Run one
In your lab, have a friend or a script perform a simple simulated intrusion. Respond end to end with [Velociraptor](https://docs.velociraptor.app/), then write the report. Use a [CISA tabletop package](https://www.cisa.gov/resources-tools/services/cisa-tabletop-exercise-packages) to rehearse with friends. For a full guided run, try the [Harbor machine](/machines/harbor/).
:::

?! Write a five-sentence executive summary of an imaginary phishing incident, with no jargon.
