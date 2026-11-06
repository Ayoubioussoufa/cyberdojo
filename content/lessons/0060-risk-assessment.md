---
title: Running a risk assessment
summary: Assets, likelihood and impact, treatment options and a risk register, in the language of the business.
month: 12
minutes: 35
builds: a risk register with owners and treatment decisions
source: NIST SP 800-30 Rev. 1 | https://csrc.nist.gov/pubs/sp/800/30/r1/final
words: risk register, residual risk, risk appetite
---
Executives don't buy "CVSS 9.8". They decide about money, customers, law and reputation. This month you learn to speak that language, and GRC is one of the most accessible entry routes, especially in banking, telecoms and consulting.

@term risk register = A table listing risks, their ratings, owners and treatments.
@term inherent risk = The level of risk before any controls.
@term residual risk = The risk that remains after controls.
@term risk appetite = How much risk an organisation is willing to accept.
@term risk treatment = The decision to mitigate, transfer, avoid or accept a risk.

## The process

@flow Set scope > List assets > Identify threats and weaknesses > Rate likelihood and impact > Decide treatment > Assign owner > Review

Define your scales **first**. "High" means nothing unless everyone agrees what it means. A common 5×5 grid multiplies likelihood by impact.

@drill risk-calc

## Four treatments

| Option | Meaning | Example |
|---|---|---|
| Mitigate | Reduce it | Add MFA |
| Transfer | Share it | Cyber insurance |
| Avoid | Stop the activity | Retire the old portal |
| Accept | Live with it, on record | Low risk, costly fix |

Accepting a risk is a legitimate decision, but only someone with authority can make it, and it's written down.

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

::: try Oasis Logistics
The roadmap's fictional company has 180 staff, hybrid cloud, an e-commerce portal and three branches. Build a register of at least 15 risks. See [P09](/projects/P09/).
:::

?! Translate this into three sentences for a director: "The portal has no rate limiting on login."
