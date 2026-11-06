---
title: The language of risk
summary: Threat, vulnerability, risk, attack surface, defence in depth: the words every security conversation runs on.
month: 1
minutes: 20
builds: use the core vocabulary correctly in any meeting or interview
source: NIST glossary | https://csrc.nist.gov/glossary
words: threat, vulnerability, risk, attack surface
---
You now know how a machine works. This lesson gives you the words professionals use to reason about what could go wrong. People who mix these words up sound like amateurs, and they make bad decisions.

@term threat = Anything that could cause harm: a person, a group, or an event like a flood.
@term vulnerability = A weakness that a threat could exploit.
@term risk = The chance of harm combined with how bad it would be.
@term exploit = A technique or piece of code that takes advantage of a vulnerability.
@term asset = Anything of value that you're protecting: data, systems, people, reputation.
@term control = A safeguard that reduces risk, such as MFA or backups.
@term attack surface = All the points where an attacker could try to get in or get data out.
@term defence in depth = Using several independent layers of protection, so that one failure isn't fatal.
@term MFA (multi-factor authentication) = Requiring a second proof of identity on top of a password.
@term phishing = Tricking someone by message into giving up credentials or running something harmful.

## Threat, vulnerability, risk

Picture your house.

- The **asset** is what you want to keep: your laptop, your family.
- A **threat** is what could cause harm: a burglar, or a flood.
- A **vulnerability** is a weakness: a broken window lock.
- The **risk** is the combination: how likely is a break-in, and how bad would it be?
- A **control** is what you do about it: fix the lock, buy insurance.

NIST defines a [vulnerability](https://csrc.nist.gov/glossary/term/vulnerability) as a "weakness in an information system, system security procedures, internal controls, or implementation that could be exploited or triggered by a threat source", and [risk](https://csrc.nist.gov/glossary/term/risk) as a function of the harm and the likelihood it occurs.

::: key
**Risk ≈ likelihood × impact.** A flaw with no threat is low risk. A threat with nothing valuable to hit is low risk. Risk needs all the pieces. That's why you can't fix everything: you fix what matters most.
:::

?? A server in a locked room with no network has an unpatched flaw. Which statement is most accurate?
+ The vulnerability exists but the risk stays quite low
- The risk is high because every flaw is dangerous
- There's no vulnerability because nobody can ever reach it
- The threat is high because the patch is missing
=> The weakness is real, but likelihood is very low. Separating these two ideas is what lets you prioritise.

@drill tvr

## Attack surface

Your **attack surface** is everything an attacker can touch: every open network port, every login page, every email inbox, every employee. NIST calls it [the set of points on the boundary](https://csrc.nist.gov/glossary/term/attack_surface) where an attacker can try to enter, cause an effect or extract data.

Reducing it is often the cheapest security you can buy. Turn off the service nobody uses, and every future bug in it stops mattering.

?? Which action reduces an attack surface most directly?
+ Switching off a service that nobody uses
- Buying a larger and more powerful server
- Writing a longer password policy for staff
- Adding more log storage to the SIEM
=> A service that isn't running can't be attacked, and all its future bugs stop mattering.

## Defence in depth

No single control is perfect, so you layer them. A medieval castle had a moat, walls, a keep and guards, and getting past one didn't win the battle.

@flow Email filter > Security training > MFA > Least privilege > Monitoring > Backups

Take phishing. The filter misses the email. The training fails and a user clicks. MFA stops the stolen password from working. If that fails too, least privilege limits what the attacker reaches, monitoring raises an alert, and backups make recovery possible. Each layer assumes the one before it has failed.

?? Why have both MFA and monitoring, if MFA stops most stolen-password attacks?
+ Each layer covers cases where another one fails
- Regulators require exactly two controls on every account
- Monitoring makes MFA codes much harder to guess
- MFA only functions while a monitoring tool runs
=> That's defence in depth. Assume every control can fail, and ask what catches it when it does.

## Putting it together

Here's how a professional thinks about one finding:

> "The login page has no rate limit (**vulnerability**). Automated password-guessing bots hit every public site (**threat**), so likelihood is high. It protects customer data (**asset**), so impact is high. That's a high **risk**. We'll add rate limiting and MFA (**controls**)."

That sentence, in Month 12, becomes a risk register entry. In Month 8, it's a pentest finding. The structure never changes.

?! Pick something from your own life, like your phone or your email. Name one asset, threat, vulnerability and control, then state the risk in one sentence.

## What you can do now

You can reason about security out loud, using the right words. Next, the two maps that organise the whole field.
