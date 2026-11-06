---
title: The two maps of the field
summary: NIST CSF for how organisations defend, and MITRE ATT&CK for how attackers operate. Every later month plugs into these.
month: 1
minutes: 25
builds: draw both maps from memory, a first-week task on the roadmap
source: MITRE ATT&CK Enterprise tactics | https://attack.mitre.org/tactics/enterprise/
words: tactic, technique, framework
---
Cybersecurity is huge, and it's easy to feel lost. Two free, public maps organise nearly all of it. One shows the defender's side, and the other shows the attacker's. By the end of this lesson you can place almost anything you read onto one of them.

@term framework = A published structure for organising how you think about or do something.
@term NIST = The US National Institute of Standards and Technology, which publishes widely used security guidance.
@term NIST CSF (Cybersecurity Framework) = NIST's map of what an organisation should do about security, in six functions.
@term MITRE ATT&CK (ATT&CK) = A public knowledge base of real attacker behaviour, organised by goal.
@term tactic = In ATT&CK, the attacker's goal at a step: the why.
@term technique = In ATT&CK, how an attacker achieves a tactic: the how.

## The defender's map: NIST CSF 2.0

The [NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework) groups everything an organisation does into [six functions](https://www.nist.gov/cyberframework/faqs). NIST describes them as concurrent and continuous: they all run at once, all the time.

| Function | The question it answers | Example |
|---|---|---|
| **Govern** | What's our strategy, and who's responsible? | Policy, roles, supply-chain risk |
| **Identify** | What do we have, and what are the risks? | Asset inventory, risk assessment |
| **Protect** | How do we prevent harm? | MFA, patching, training, backups |
| **Detect** | How do we notice an attack? | Monitoring, alerts, log review |
| **Respond** | What do we do when it happens? | Contain, communicate, analyse |
| **Recover** | How do we get back to normal? | Restore systems, learn lessons |

A useful way to remember them: **Govern** sits above the other five, which follow the story of an incident from before it happens to after.

?? A company tests its backups by restoring a server after an outage. Which function is that?
+ Recover, as it restores normal business operations
- Protect, because backups count as a safeguard
- Detect, because the outage was noticed earlier
- Govern, because management has to approve it
=> Having backups is part of Protect. Using them to get back to normal after an incident is Recover.

@drill csf

## The attacker's map: MITRE ATT&CK

[MITRE ATT&CK](https://attack.mitre.org/) is built from observed, real-world attacks. Its columns are **tactics**, the attacker's goals. Under each are **techniques**, the ways of reaching that goal.

@term TTPs = Tactics, techniques and procedures: how an attacker behaves.

The Enterprise matrix currently has [15 tactics](https://attack.mitre.org/tactics/enterprise/):

| # | Tactic | The attacker is trying to… |
|---|---|---|
| 1 | Reconnaissance | Gather information to plan |
| 2 | Resource Development | Set up tools and infrastructure |
| 3 | Initial Access | Get in |
| 4 | Execution | Run their code |
| 5 | Persistence | Stay in, even after a reboot |
| 6 | Privilege Escalation | Gain higher permissions |
| 7 | Stealth | Avoid being noticed |
| 8 | Defense Impairment | Weaken or disable your defences |
| 9 | Credential Access | Steal usernames and passwords |
| 10 | Discovery | Figure out the environment |
| 11 | Lateral Movement | Move to other systems |
| 12 | Collection | Gather the data they want |
| 13 | Command and Control | Talk to their tools remotely |
| 14 | Exfiltration | Steal the data |
| 15 | Impact | Disrupt, destroy or extort |

::: trap Older sources say 14
Until 2026 there was one tactic called Defense Evasion. MITRE [split it](https://attack.mitre.org/resources/updates/updates-april-2026/) into Stealth and Defense Impairment. Plenty of courses, blog posts and AI answers still say 14. Always check the current page, and see the version number at the bottom.
:::

Attackers don't march through these in order, and they skip around. Think of it as a menu of goals, not a straight line.

Here's the difference between a tactic and a technique. **Credential Access** is a tactic: the goal is to steal credentials. Dumping password hashes from memory is a technique: one way of doing it. Each has an ID you'll see on every detection and report.

::: why How this changes defence
You can't block every tool, because attackers swap tools easily. But their **behaviour** changes much more slowly. Mapping detections to ATT&CK means defending against what attackers do, not against one file. You'll build on this idea in Month 9.
:::

?? An attacker uses stolen credentials to log in to a second server. Which tactic?
+ Lateral Movement, since they moved between systems
- Initial Access, since a login took place
- Persistence, since they stayed on the network
- Discovery, since they found another nearby machine
=> They're already inside and are moving to another system. Stealing those credentials was a separate step, under Credential Access.

@drill tactic

## How the two maps fit together

They look at the same fight from opposite sides. ATT&CK says what the attacker is doing. The CSF says how the organisation is set up to handle it. A detection you write in Month 11 is a **Detect** activity aimed at an ATT&CK **technique**.

::: try Roadmap task
Close this page and draw both maps on paper from memory: six functions and as many tactics as you can. Then check yourself. It's a first-week task, and it works because recall is effort.
:::

?! A ransomware gang phishes an employee, steals an admin password, spreads across the network, copies the data and encrypts it. Name the ATT&CK tactic for each step.

## What you can do now

You have the map every later month plugs into. Now it's time to leave the browser and build a real lab.
