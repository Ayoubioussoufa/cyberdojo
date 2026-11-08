---
title: Running a risk assessment
summary: Assets, likelihood and impact, inherent and residual risk, treatment options and a risk register, in the language of the business.
month: 12
minutes: 50
builds: a risk register with owners and treatment decisions
source: NIST SP 800-30 Rev. 1 | https://csrc.nist.gov/pubs/sp/800/30/r1/final
words: risk register, residual risk, risk appetite
---
Executives don't buy "CVSS 9.8". They decide about money, customers, law and reputation. This month you learn to speak that language, and GRC, which stands for governance, risk and compliance, is one of the most accessible entry routes, especially in banking, telecoms and consulting.

@term risk register = A table listing risks, their ratings, owners and treatments.
@term inherent risk = The level of risk before any controls.
@term residual risk = The risk that remains after controls.
@term risk appetite = How much risk an organisation is willing to accept.
@term risk treatment = The decision to mitigate, transfer, avoid or accept a risk.
@term risk owner = The accountable person who decides how a risk is treated.

## Words that must stay separate

In lesson 10 you met these. Now they have to be exact, because a risk assessment is built from them.

| Word | Meaning | Example |
|---|---|---|
| **Asset** | Something of value | The customer database |
| **Threat** | Something that could cause harm | A ransomware group |
| **Vulnerability** | A weakness that a threat could use | An unpatched server |
| **Risk** | The chance and the size of the harm | Orders stop for a week |
| **Control** | What reduces the risk | Tested offline backups |

A good risk statement links them: "A ransomware group could exploit unpatched servers to stop order processing, costing about one week of revenue." "Unpatched servers" alone is a finding, not a risk.

?? Which of these is written as a risk rather than a vulnerability?
+ Stolen laptops could expose all customer records
- Laptops in sales have no disk encryption
- The firewall firmware is two versions behind
- Several staff still use short simple passwords
=> A risk says who or what, through which weakness, leads to what harm. The others name only a weakness.

## The process

@flow Set scope > List assets > Identify threats and weaknesses > Rate likelihood and impact > Decide treatment > Assign owner > Review

Define your scales **first**. "High" means nothing unless everyone agrees what it means. A common 5×5 grid multiplies likelihood by impact, and good scales are written in business terms:

| Rating | Likelihood | Impact |
|---|---|---|
| 1 | Less than once in 10 years | Under 1,000 € |
| 3 | About once a year | About 50,000 €, or a day's outage |
| 5 | Several times a year | Threatens the company's survival |

Those numbers are examples. Your organisation sets its own, and that's its **risk appetite** in practice: how much it will tolerate.

@drill risk-calc

?? Two analysts rate the same risk "high" and "medium". What's most likely missing?
+ Written scales that clearly define each rating
- A much more expensive risk management tool
- A bigger team to do the rating
- A newer version of the CVSS standard
=> Without defined scales, ratings are opinions. Agreeing on what each level means is the first step, not an extra.

## Inherent and residual

**Inherent risk** ignores your controls. **Residual risk** is what's left after them. The gap between the two shows what a control is worth, which lets you defend its budget.

| Risk: ransomware stops orders | L | I | Score |
|---|---|---|---|
| Inherent (no controls) | 4 | 5 | 20 |
| Residual (EDR and offline backups) | 2 | 3 | 6 |

Notice what happened. EDR lowered the likelihood. Backups lowered the impact. A control can move either number, and a residual score is a claim you should be able to prove, for instance with a tested restore.

?? Backups are added, and the residual impact falls from 5 to 3. What proves that this is true?
+ A tested restore within the agreed time
- The purchase order for the backup software
- A vendor brochure about its restore speed
- The fact no incident has happened yet
=> A backup that's never been restored is a hope. Evidence turns a residual rating into a defensible number.

## Four treatments

| Option | Meaning | Example |
|---|---|---|
| Mitigate | Reduce it | Add MFA |
| Transfer | Share it | Cyber insurance |
| Avoid | Stop the activity | Retire the old portal |
| Accept | Live with it, on record | Low risk, costly fix |

Accepting a risk is a legitimate decision, but only someone with authority can make it, and it's written down.

@drill risk-treat

?? A manager says "we'll accept the risk" on an unpatched server. What makes that valid?
+ An authorised owner records it with reasons
- A security analyst nods in the meeting
- Nobody has complained about it so far
- The server has not been attacked yet
=> Risk acceptance needs an accountable owner, a reason and a review date.

## A register entry

| Risk | Asset | L | I | Score | Owner | Treatment | Residual |
|---|---|---|---|---|---|---|---|
| Ransomware halts order processing | ERP system | 3 | 5 | 15 | COO | Offline backups, EDR | 8 |

The **risk owner** is usually a business leader rather than someone in security, because they own the consequences. Security advises, and the business decides. Registers go stale quickly, so each entry needs a review date.

?? Why is the COO, rather than the security team, the owner of this ERP risk?
+ They answer for all the business consequences
- Security teams aren't allowed to read registers
- The COO has the most technical skill
- Owners must always be the newest manager
=> Whoever owns the consequence should own the decision. Security supplies the analysis.

## Audit a register

Registers are data, so you can check them with the tools you already know.

@range risk

::: try Oasis Logistics
The roadmap's fictional company has 180 staff, hybrid cloud, an e-commerce portal and three branches. Build a register of at least 15 risks. See [P09](/projects/P09/).
:::

## Say it to a director

Use three sentences: what could happen, how likely and how much, and what you need.

> Attackers could guess staff passwords on our portal, because it has no limit on login attempts. We've seen this in our sector, and a takeover could expose customer orders. Rate limiting costs two days of development, and I recommend doing it this sprint.

?! Translate this into three sentences for a director: "The portal has no rate limiting on login."

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [NIST SP 800-37 Rev. 2: the Risk Management Framework](https://csrc.nist.gov/pubs/sp/800/37/r2/final)
- [The FAIR Institute: quantitative risk analysis](https://www.fairinstitute.org/)
