---
title: Incident response
summary: What to do when it's real: playbooks, containment trade-offs, evidence, communication and reporting, using NIST's current guidance.
month: 11
minutes: 80
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

A playbook earns its place when someone can follow it at 3 a.m. without asking anyone. Written out in full, the compromised-account one looks like this:

| Part | What it says |
|---|---|
| **Trigger** | An alert or a report that someone other than the owner is using an account |
| **First 15 minutes** | Revoke the account's sessions, reset the password, check that the MFA device is the owner's |
| **Collect** | Thirty days of sign-in logs, the mailbox rules, new keys and app passwords, newly registered devices |
| **Scope** | Every system this account signed in to since the first bad login |
| **Eradicate** | Remove the rules, keys and devices that the owner doesn't recognise |
| **Recover** | The owner signs in again, and the account is watched closely for two weeks |
| **Done when** | No unexplained sign-in for 14 days, and the root cause is written down |

The last row is the one most playbooks forget. Without a written end, an incident either closes too early, because everyone is tired, or never closes at all.

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

Before you isolate anything, find out what to isolate. Start from the first host you know is compromised and the time it happened, then follow the logins outward. A login from a compromised host, made after it was compromised, puts the destination **in scope**, and the search continues from there. This is how you trace **lateral movement**.

| Time (UTC) | Account | From | To |
|---|---|---|---|
| 08:10 | `ana` | `HR-LAP-12` | `MAIL-01` |
| 09:05 | `ana` | `HR-LAP-12` | `FILE-01` |
| 09:40 | `svc_backup` | `FILE-01` | `DB-02` |
| 10:15 | `li` | `DEV-07` | `DB-02` |

Say `HR-LAP-12` was compromised at 09:00. `FILE-01` is in scope from 09:05, and `DB-02` from 09:40. `MAIL-01` isn't, because that login came before the compromise, and `DEV-07` isn't, because nothing in scope ever signed in to it. In scope means "must be checked", not "is compromised". Isolating one laptop while the attacker already sits on the file server contains nothing.

@code hosts-in-scope

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

Collect in **order of volatility**: whatever disappears soonest goes first. [RFC 3227](https://www.rfc-editor.org/rfc/rfc3227) sets out the order.

| Order | What | How long it lasts |
|---|---|---|
| First | Memory, running processes, open network connections | Gone at power-off |
| Then | Temporary files, and logs on the machine that rotate | Overwritten within hours or days |
| Then | The disk | Survives a power-off |
| Last | Backups, and logs already sent to a central store | Kept for months |

This is why "power off" costs so much in the table above: it destroys the first row.

Hash each item the moment you collect it, and keep the hash apart from the item:

```
sha256sum memory.raw > memory.raw.sha256
sha256sum -c memory.raw.sha256
```

The first command writes the hash to a small file. The second recomputes it and compares, printing `memory.raw: OK` while the file is unchanged and `FAILED` when even one bit differs. Whoever receives the evidence later runs the same check, and that's what lets a report say the file analysed is the file collected.

@code evidence-intact

A rule of thumb from Month 2 applies: note what's **confirmed** and what's **suspected**, and never let one turn into the other by repetition.

?? Why does a response team record everything in UTC?
+ So logs from different places line up
- Because every country's law requires UTC timestamps
- So attackers can't read any of them
- Because computers can't store local times properly
=> Systems in different time zones produce one story only when the clock is shared.

## Rebuild the story

Logs don't agree about clocks. A firewall writes `2026-10-27T10:02:11+01:00`, and a cloud service writes `2026-10-27T09:01:40+00:00`. The part after the seconds is the **offset** from UTC: `+01:00` means the local clock is one hour ahead, so you subtract an hour to get UTC. Sorted as written, the firewall line looks like it came an hour after the sign-in. In UTC it's 09:02:11, which is 31 seconds after. Convert everything first, then sort.

@code merge-timeline

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

A status update has a fixed shape, so nobody has to invent one under pressure:

```
Status at 11:30 UTC. Incident 2026-014, severity high.
Known: a stolen account was used on one HR laptop and one file server from 09:00 UTC.
Not known: whether any files were copied out.
Doing: both hosts are isolated, the account is reset, file-access logs are under review.
Needed from you: a decision on telling the affected staff today.
Next update: 12:30 UTC.
```

Say what you don't know. An update that lists only what's known leaves people to fill the gaps themselves, and they fill them with the worst case or the best one. Always give the time of the next update too, so nobody interrupts the responders to ask for one.

Some laws set deadlines: under the GDPR, a notifiable personal-data breach goes to the supervisory authority within 72 hours of becoming aware of it. The clock starts when you become aware, not when the breach began, and it doesn't stop for a weekend. So write the time you became aware in the log at that moment, because the deadline is counted from it.

@code breach-clock

Assume that an attacker may read your email during an incident, and use a separate channel.

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

?? A review concludes that "the user clicked a link". Why isn't that a root cause?
+ It doesn't say why one click was enough
- Users are never involved in any real incident
- Root causes must always name a software vendor
- Clicking links is not possible on work laptops
=> Someone will always click. Ask why the mail arrived, why the page could take a password, and why one password was enough to get in. Those answers are things you can fix.

## Review a response

A colleague hands you their notes from last night and asks what you'd have done differently.

```
14:05 UTC  Alert: ransom note found on FILE-01.
14:10 UTC  Powered off FILE-01, FILE-02 and DB-02.
14:20 UTC  Emailed all staff about the attack.
15:00 UTC  Started restoring FILE-01 from last night's backup.
```

?? What did the action at 14:10 lose?
+ The evidence held in those servers' memory
- The files stored on those servers' disks
- The backups kept in a separate place
- The logs already sent to the SIEM
=> Memory goes at power-off, and it often holds the running malware and its connections. Cutting the servers off from the network would have stopped the spread and kept it.

?? Why is the restore at 15:00 a risk?
+ The backup may already contain the attacker's foothold
- Backups can only be restored during the night
- Restoring always takes longer than rebuilding from nothing
- The ransom note forbids restoring from any backup
=> Attackers are often inside for days before the ransomware runs, so last night's backup may carry their access. Nobody has found the way in yet either. Check the backup and close the entry point first.

?? The files held staff records, and the team became aware of the breach at 14:05 UTC on 27 October 2026. When does the 72-hour window close?
+ `2026-10-30 14:05`
- `2026-10-29 14:05`
- `2026-10-30 00:00`
- `2026-11-01 14:05`
=> Seventy-two hours is three days to the minute, counted from the moment of awareness. It doesn't round to midnight, and it doesn't skip days.

?! Write a five-sentence executive summary of an imaginary phishing incident, with no jargon.
