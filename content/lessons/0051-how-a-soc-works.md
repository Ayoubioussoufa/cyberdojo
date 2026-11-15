---
title: How a SOC works
summary: Tiers, shifts, the alert lifecycle, verdicts, escalation, and how to take one alert to a written conclusion with evidence.
month: 9
minutes: 65
builds: triage an alert to a written verdict
source: TryHackMe SOC Level 1 path | https://tryhackme.com/path/outline/soclevel1
words: triage, alert fatigue, escalation
---
SOC analyst is still the most common way into this field. A **SOC**, or security operations centre, is the team that watches an organisation's systems and responds when something looks wrong. These are, quite literally, day-one tasks. Even if you end up elsewhere, this is what teaches you what defenders actually see.

@term triage = Quickly deciding how serious an alert is and what to do next.
@term alert = A notification that a detection rule matched something.
@term alert fatigue = When too many low-value alerts make people stop paying attention.
@term escalation = Passing a case to someone with more skill or authority.
@term SLA (service-level agreement) = A promised time limit, such as triaging critical alerts within 15 minutes.
@term playbook = A written set of steps for handling a type of alert or incident.
@term verdict = The conclusion on an alert, with the evidence behind it.
@term benign positive = An alert that correctly flagged the behaviour, but the behaviour was authorised.
@term shift handover = The written and spoken summary one team gives the next when a shift ends.

## A morning in the queue

It's 09:00. You open a ticket queue, which is a list of alerts waiting for someone. There are 40. Three are marked high. Each one is a claim made by a piece of software: "this looks bad". Your job is to find out whether the claim is true.

You can't investigate all 40 deeply. You also can't ignore any of them. So you do what a hospital's emergency room does: **triage**. Look at each one quickly, decide how urgent it is, and spend your time where it counts.

The order isn't a feeling. Most queues sort the same way: the most severe first, and among equals, the one that has waited longest. A ticketing system does this for you, and writing the rule once shows there's nothing more to it.

@code triage-order

?? Why doesn't a SOC analyst investigate every alert in full depth?
+ Time is limited, so urgency decides the order
- Most alerts are illegal to look at closely
- Only managers may read alerts in full detail
- Alerts delete themselves after a few short minutes
=> Triage is about using limited attention well. Every alert gets a look, and the dangerous ones get the depth.

## The team

| Tier | Typical work | Think of it as |
|---|---|---|
| Tier 1 | Watch the queue, triage alerts, close or escalate | The emergency-room nurse |
| Tier 2 | Deeper investigation, scoping, containment | The doctor who runs the tests |
| Tier 3 | Threat hunting, detection tuning, hardest cases | The specialist |

Many teams work shifts to cover 24 hours. At the end of each shift comes a **shift handover**: what's open, what you've tried, what to watch. A bad handover loses hours. As [the AI guide](/guides/d1-ai-what-changed/) says, routine Tier 1 work is being automated, so aim to grow towards detection and response.

?? A Tier 1 analyst finds evidence that an attacker is moving between servers. What's the right move?
+ Escalate to Tier 2 with their evidence attached
- Keep investigating alone until the attacker has left
- Close the alert, since Tier 1 can't act
- Wait until the next shift looks at it
=> Escalating early with evidence is the job. It's not a failure. Tier 2 has the authority and the tools to contain.

## The alert lifecycle

@flow Alert fires > Triage > Investigate > Verdict > Close, tune or escalate > Document

An alert ends with one of four labels. Learn them exactly, because every interview asks.

| | The behaviour really was malicious | It wasn't |
|---|---|---|
| **An alert fired** | True positive | False positive |
| **No alert fired** | False negative | True negative |

There's a useful fifth case. A **benign positive** is when the rule was right about the behaviour but the behaviour was allowed, like an admin running a scan they had approval for.

The five labels come from three yes-or-no questions: was the behaviour malicious, did an alert fire, and was the behaviour authorised? That makes them something you can write down exactly, which is a good test of whether you really know them.

@code alert-label

::: trap False negatives are invisible
Nobody files a ticket for the attack that no rule caught. A quiet queue doesn't prove that you're safe. That's why hunting and testing exist.
:::

?? Your rule for "new admin account" fires, and IT confirms that they created it through an approved ticket. What label fits?
+ Benign positive: correct behaviour, but it's authorised
- True positive: a real attack in progress
- False negative: the attack produced no alert
- True negative: nothing happened and nothing fired
=> The rule did what it should. The behaviour just had a legitimate reason.

## Triage, step by step

1. **Read the alert.** What rule fired, on which host and user, and when?
2. **Gather context.** Is this a server or a laptop? Who's the user? Is the activity normal for them?
3. **Form a hypothesis.** "This could be an admin script, or it could be an attacker."
4. **Look for evidence.** What came before and after? Which process started it? Did anything connect out?
5. **Reach a verdict.** True positive, false positive or benign. State the evidence and your confidence.
6. **Act and document.** Escalate, contain or tune, and write down why.

Here's one worked through.

```
ALERT  Encoded PowerShell     Host: HR-LAP-12     User: sara     09:14 UTC
```

- **Context:** HR laptop. Sara doesn't write scripts, so that's slightly odd.
- **Hypothesis:** an attacker, or the deployment tool. Encoded commands are used by both.
- **Evidence:** the parent process is the signed deployment agent, it runs every Tuesday at 09:14, and it decodes to the approved inventory script.
- **Verdict:** benign.

Now one that goes the other way, so that you've seen both endings.

```
ALERT  Login from new country     User: marc     Source: 203.0.113.80     02:41 UTC
```

- **Context:** Marc works in finance. His calendar shows no travel, and 02:41 is the middle of his night.
- **Hypothesis:** a trip nobody recorded, a VPN, or a stolen password.
- **Evidence:** the same address failed 14 times before it succeeded. Six MFA prompts were sent, and the sixth was approved. Three minutes later, a mailbox rule began forwarding all his mail to an outside address.
- **Verdict:** true positive. Each fact has an innocent explanation alone. Together they don't.

The verdict isn't the end of your part. This one goes to Tier 2, and what you send decides how fast they can act:

```
WHAT I KNOW   marc logged in from 203.0.113.80 at 02:41 UTC after 14 failures and 6 MFA prompts.
              At 02:44 a mailbox rule started forwarding all mail to an outside address.
WHAT I DID    Checked his calendar: no travel. Attached the sign-in and audit log entries.
WHAT'S OPEN   His sessions are still active. I have not disabled the account.
              Unknown: which messages were already forwarded.
ASK           Revoke sessions and reset credentials now.
```

Four headings, and the reader knows what happened, what they can skip, what's still dangerous and what you want from them.

::: key Write the verdict so someone else can check it
Bad: "looks fine, closed". Good: "Encoded PowerShell on HR-LAP-12 at 09:14 UTC. Parent is the signed deployment agent, on its normal schedule, and it decodes to the approved inventory script. Benign. No action."
:::

@drill triage

?? An alert fires for a login from a new country. What should you do first?
+ Gather context on the user and login
- Disable the account right away, then investigate
- Close it, because people travel so often
- Reboot the user's laptop as a precaution
=> Context decides everything: a VPN, a business trip, or a stolen password. Acting before you understand can harm the business, and closing without checking can miss an attack.

## Severity and escalation

Not every alert deserves the same speed. Teams write this down in advance, often as an **SLA**:

| Severity | Example | Triage within |
|---|---|---|
| Critical | Ransomware behaviour on a server | 15 minutes |
| High | Admin account used from a new country | 1 hour |
| Medium | Malware blocked on one laptop | 4 hours |
| Low | Single failed login burst | Next business day |

Those times are examples: each organisation sets its own. When in doubt, escalate, and say what you know, what you don't, and what you've already done.

A clock is running on every open alert, and a queue can tell you which ones have already run out. Given how long each alert has waited, the check is a lookup and a comparison.

@code sla-breaches

?? When you escalate, what makes the handover useful?
+ What you know, what you tried, what remains
- A short message saying it looks quite bad
- The raw alert forwarded with no notes added
- A request for them to phone you later
=> The next person should never have to repeat your work. Facts, actions and open questions save hours.

## Measuring a SOC

| Metric | Meaning |
|---|---|
| MTTD | Mean time to detect: from the attack starting to noticing it |
| MTTR | Mean time to respond: from noticing to stopping it |
| False-positive rate | How much noise analysts wade through |

Numbers can mislead: closing tickets quickly isn't the same as getting them right. And too much noise causes **alert fatigue**: people start closing things without looking, and the real attack slips past inside the noise. Reducing noise is a security improvement.

Both averages come from three timestamps per incident: when the attack began, when it was noticed and when it was stopped. Take two incidents, with times in minutes from the start of the day:

| Incident | Began | Noticed | Stopped | Time to detect | Time to respond |
|---|---|---|---|---|---|
| A | 100 | 160 | 190 | 60 | 30 |
| B | 400 | 420 | 520 | 20 | 100 |

MTTD is the mean of 60 and 20, so 40 minutes. MTTR is the mean of 30 and 100, so 65. An average hides a great deal: here one incident was slow to notice and the other slow to stop, and the cures for those are different.

@code mttd-mttr

?? A manager rewards whoever closes the most alerts per hour. What's the likely result?
+ Rushed closures that miss some real attacks
- Far fewer true positives in the logs
- Attackers becoming discouraged and leaving the network
- Every alert getting a much deeper investigation
=> You get what you measure. Speed alone rewards careless verdicts, so measure quality as well.

## The handover is the work

You're finishing a night shift and the Marc case is still open with Tier 2. Whoever sits down next knows nothing about it. Two questions about what you leave them.

?? Which line of the escalation note matters most to someone reading it at 02:50?
+ His sessions are still active right now
- His calendar shows no travel this week
- The alert fired at exactly 02:41 UTC
- Marc works in the company's finance team
=> The other lines explain the past. That one says the attacker can still act, which is the only thing a reader can change.

?? Marc's manager phones back: Marc was at home asleep. Which label does the alert get?
+ True positive: malicious, and the alert did fire
- Benign positive: correct, but the login was authorised
- False positive: the rule matched some harmless behaviour
- False negative: an attack that raised no alert
=> Nobody authorised that login, so it isn't benign. The rule saw real malicious behaviour and said so.

## Practise

@range triage

::: try Next steps
[KC7](https://kc7cyber.com/) teaches query-based investigation as a free story-driven game. [LetsDefend](https://letsdefend.io/) simulates an alert queue. Both are on the [Month 9 plan](/roadmap/9/). When you're ready for a whole machine, try [Harbor](/machines/harbor/).
:::

?! Write a three-sentence verdict for the mission you just finished: what happened, your evidence, and what you'd do next.
