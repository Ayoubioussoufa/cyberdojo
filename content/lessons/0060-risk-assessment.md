---
title: Running a risk assessment
summary: Assets, likelihood and impact, inherent and residual risk, treatment options and a risk register, in the language of the business.
month: 12
minutes: 75
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

The score is then sorted into bands, and each band says who must act and how fast. One common set:

| Score | Band | What it triggers |
|---|---|---|
| 1 to 4 | Low | Accept it, and review once a year |
| 5 to 9 | Medium | A plan from the owner within the quarter |
| 10 to 16 | High | A plan within a month, reported to management |
| 17 to 25 | Critical | Action now, reported to the board |

A grid like this is **qualitative**: its numbers are ranks, not measurements. A 20 isn't twice as bad as a 10, and two different risks with the same score aren't equal. The grid is good for sorting and bad for arithmetic.

@code risk-rating

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

## Putting a price on it

When the decision is about money, a rank isn't enough. The **quantitative** method uses three numbers.

| Number | Meaning | Example: a stolen laptop holding customer data |
|---|---|---|
| **SLE**, single loss expectancy | What it costs when it happens once | 20,000 € |
| **ARO**, annual rate of occurrence | How many times a year you expect it | 0.5, so once every two years |
| **ALE**, annual loss expectancy | SLE × ARO | 10,000 € a year |

The SLE is often built from the asset's value and an **exposure factor**, the share of that value which one event destroys. A system worth 200,000 € that loses a tenth of its value in an outage has an SLE of 20,000 €.

@code annual-loss

The ALE lets you compare a control with its price. Disk encryption doesn't make laptops harder to steal, so the ARO stays at 0.5. But a stolen encrypted laptop costs only its hardware, say 1,500 €, so the ALE falls from 10,000 € to 750 €. If encryption costs 2,000 € a year to run, it saves 9,250 − 2,000 = 7,250 € a year. A finance director can approve that sentence. A control that costs more than the loss it prevents is a reason to choose a different treatment.

@code control-value

These figures are estimates, and you should say so. Give a range when you can, say where each number came from, and don't present 7,250 € as if it had been measured. [FAIR](https://www.fairinstitute.org/) is the best-known method for doing this with care.

?? An event costs 40,000 € each time, and you expect it once every four years. What's its ALE?
+ `10,000 €`
- `160,000 €`
- `40,000 €`
- `4,000 €`
=> Once every four years is an ARO of 0.25, and 40,000 × 0.25 is 10,000 € a year. Multiplying by 4 instead is the usual slip.

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

A register goes wrong in a few predictable ways, and a program can check for each of them: an entry with no owner, a residual score above the inherent one, an accepted risk with no review date, and a review date that has already passed.

@code register-problems

The last use of a register is the simplest: compare each residual score with the appetite. If the board has said it tolerates nothing above 9, every residual of 10 or more needs either a plan or a signed acceptance, and that short list is what you bring to the meeting.

## Audit a register

Registers are data, so you can check them with the tools you already know.

@range risk

::: try Oasis Logistics
The roadmap's fictional company has 180 staff, hybrid cloud, an e-commerce portal and three branches. Build a register of at least 15 risks. See [P09](/projects/P09/).
:::

## Review a register

A colleague asks you to read three entries before they go to the risk committee.

| Risk | L | I | Score | Owner | Treatment | Residual | Review |
|---|---|---|---|---|---|---|---|
| Phishing leads to a mailbox takeover | 4 | 3 | 12 | IT security | MFA | 4 | 2027-03 |
| The old HR server is exploited | 3 | 4 | 12 | Head of HR | Accept | 12 | None |
| A supplier outage stops deliveries | 2 | 5 | 10 | COO | Second supplier | 12 | 2027-01 |

?? What would you change in the first entry?
+ Its owner should answer for the consequences
- Its score should be seven, not twelve
- MFA is a transfer, not a mitigation
- A review date is never actually needed
=> IT security advises, but a mailbox takeover hurts the business unit whose mail it is. The owner is whoever answers for that harm.

?? What's missing from the second entry?
+ An accepted risk needs a review date
- Accepted risks must have a zero residual
- The Head of HR can't own risks
- Old servers are assets, never real risks
=> Accepting is allowed, and the residual stays at 12 because nothing was done. But an acceptance with no review date is a decision nobody will ever look at again.

?? What can't be right in the third entry?
+ Its residual is higher than its inherent
- A second supplier counts as avoiding it
- The COO cannot own a supplier risk
- An impact of five is never allowed
=> A control doesn't add risk on paper. Either a number was mistyped, or the two scores were rated on different scales.

## Say it to a director

Use three sentences: what could happen, how likely and how much, and what you need.

> Attackers could guess staff passwords on our portal, because it has no limit on login attempts. We've seen this in our sector, and a takeover could expose customer orders. Rate limiting costs two days of development, and I recommend doing it this sprint.

?! Translate this into three sentences for a director: "The portal has no rate limiting on login."

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [NIST SP 800-37 Rev. 2: the Risk Management Framework](https://csrc.nist.gov/pubs/sp/800/37/r2/final)
- [The FAIR Institute: quantitative risk analysis](https://www.fairinstitute.org/)
