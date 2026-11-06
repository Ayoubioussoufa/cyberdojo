---
title: How a SOC works
summary: Tiers, shifts, the alert lifecycle, and how to take an alert to a verdict with evidence.
month: 9
minutes: 30
builds: triage an alert to a written verdict
source: TryHackMe SOC Level 1 path | https://tryhackme.com/path/outline/soclevel1
words: triage, alert fatigue, escalation
---
SOC analyst is still the most common way into this field. These are, quite literally, day-one tasks. Even if you end up elsewhere, this is what teaches you what defenders actually see.

@term triage = Quickly deciding how serious an alert is and what to do next.
@term alert = A notification that a detection rule matched something.
@term alert fatigue = When too many low-value alerts make people stop paying attention.
@term escalation = Passing a case to someone with more skill or authority.
@term SLA (service-level agreement) = A promised time limit, such as triaging critical alerts within 15 minutes.
@term playbook = A written set of steps for handling a type of alert or incident.
@term verdict = The conclusion on an alert, with the evidence behind it.

## The team

| Tier | Typical work |
|---|---|
| Tier 1 | Watch the queue, triage alerts, close or escalate |
| Tier 2 | Deeper investigation, scoping, containment |
| Tier 3 | Threat hunting, detection tuning, hardest cases |

Many teams work shifts to cover 24 hours. As [the AI guide](/guides/d1-ai-what-changed/) says, routine Tier 1 work is being automated, so aim to grow towards detection and response.

## The alert lifecycle

@flow Alert fires > Triage > Investigate > Verdict > Close, tune or escalate > Document

## Triage, step by step

1. **Read the alert.** What rule fired, on which host and user, and when?
2. **Gather context.** Is this a server or a laptop? Who's the user? Is the activity normal for them?
3. **Form a hypothesis.** "This could be an admin script, or it could be an attacker."
4. **Look for evidence.** What came before and after? Which process started it? Did anything connect out?
5. **Reach a verdict.** True positive, false positive or benign. State the evidence and your confidence.
6. **Act and document.** Escalate, contain or tune, and write down why.

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

## Measuring a SOC

| Metric | Meaning |
|---|---|
| MTTD | Mean time to detect |
| MTTR | Mean time to respond |
| False-positive rate | How much noise analysts wade through |

Numbers can mislead: closing tickets quickly isn't the same as getting them right.

## Practise

@range triage

::: try Next steps
[KC7](https://kc7cyber.com/) teaches query-based investigation as a free story-driven game. [LetsDefend](https://letsdefend.io/) simulates an alert queue. Both are on the [Month 9 plan](/roadmap/9/).
:::

?! Write a three-sentence verdict for the mission you just finished: what happened, your evidence, and what you'd do next.
