---
title: Security metrics and board reporting
summary: Measure what changes a decision. Choosing useful metrics, avoiding vanity numbers, and telling a board what it needs to hear, including SEC disclosure rules.
level: intermediate
side: defence
minutes: 40
attack: none
needs: 0051-how-a-soc-works, 0060-risk-assessment
pair: 12-03-quantitative-risk
source: NIST SP 800-55, Measurement Guide for Information Security | https://csrc.nist.gov/pubs/sp/800/55/v1/final
words: vanity metric, risk appetite, mean time to detect
---
Security teams drown in numbers. Blocked attacks, patched servers, alerts closed. Few of these answer what a director needs to know: are we safer than last quarter, is it worth what we're spending, and what should I decide? A good metric changes a decision. If nobody would act differently whatever its value, stop collecting it.

@term vanity metric = A number that looks impressive, but doesn't inform a decision.
@term leading indicator = A measure that predicts future performance, such as patch speed.
@term lagging indicator = A measure of what's already happened, such as incidents last quarter.

## Concept

### Fundamentals: what makes a metric useful

A useful metric is tied to a goal, comparable over time, cheap to collect, and hard to game. [NIST SP 800-55](https://csrc.nist.gov/pubs/sp/800/55/v1/final) separates *measures of implementation* (is the control in place?), *effectiveness* (does it work?), and *impact* (what's the business result?). Most teams stop at the first one.

| Vanity | Better | Why |
|---|---|---|
| Attacks blocked | Critical exposures past their deadline | Shows what's left to do |
| Alerts closed | Mean time to detect and respond | Shows speed |
| Phishing click rate | Reporting rate, and time to report | Rewards the behaviour you want |
| Patches applied | KEV-listed flaws open beyond target | Focuses on real risk |
| Tools deployed | Percentage of assets with working coverage | Shows gaps |
| ATT&CK cells green | Tested procedures detected | Avoids false comfort |

### Metrics by audience

| Audience | Wants | Example |
|---|---|---|
| Analysts | Workflow | Queue size, false-positive rate by rule |
| Security manager | Programme health | MTTD, MTTR, coverage |
| Executives | Risk against plan | Top risks, trend, spend |
| Board | Oversight | Risk appetite, major incidents, regulator status |

**MTTD** and **MTTR** are common, though the "mean" can mislead: one long incident dominates. Report the median as well, and define each clock's start and stop. Remember the rule known as Goodhart's law: when a measure becomes a target, it stops being a good measure. Reward fast closure alone, and analysts will close too quickly. Pair it with a quality measure.

### Telling a board

Directors aren't asking for a technical briefing. A good report has four parts:

1. **Where we stand** against the agreed risk appetite.
2. **What changed:** threats, incidents, and the business.
3. **What we're doing,** with progress.
4. **What we need:** a decision, money or an acceptance.

Use a business frame: "A ransomware attack could stop orders for a week, costing €2 to 5 million. This project halves the chance." [Quantitative ranges](/modules/12-03-quantitative-risk/) make this possible. Be honest about uncertainty, and never hide bad news.

Lesson 60 practised this with a director. NIS2's Article 20 now makes directors accountable, so they're motivated to listen.

### Advanced: disclosure and accountability

Since 2023, US public companies must file [Form 8-K Item 1.05](https://www.sec.gov/rules-regulations/2023/07/s7-09-22) within **four business days** of determining that a cyber incident is material, and describe their risk management and board oversight each year. Other regimes have their own clocks, as [EU regulation](/modules/12-05-eu-regulation/) shows.

Personal accountability has grown as well. In the US, the Uber CSO was [convicted in 2022](https://www.justice.gov/usao-ndca/pr/former-chief-security-officer-uber-sentenced-three-years-probation-covering-data) for concealing a breach. So keep records of what you told leadership, and escalate in writing.

**Benchmarks** are tempting, but be careful. Comparing yourself with peers is useful for a board, yet published figures vary widely in method. Prefer your own trend.

?? Why is "number of blocked attacks" a weak board metric?
+ It counts activity, not any risk reduction
- It can't be collected from any firewall
- It always falls to zero every quarter
- It reveals private data about each attacker
=> A big number could mean a good firewall or just more noise, so it doesn't inform any decision.

## Threat model

Bad metrics are a risk in their own right. They can hide problems, misdirect money, and create false assurance. A chart that always shows green tells the board that nothing's wrong, right up to the breach. Attackers benefit whenever coverage figures overstate reality, for instance when "100% of servers have EDR" counts agents that stopped reporting.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| SIEM dashboards | Operational measures | SOC metrics |
| Case management | Timestamps for MTTD and MTTR | Reliable clocks |
| Asset inventory | The denominator | Coverage percentages |
| CISA KEV feed | Priority list | Patch metrics |
| Spreadsheet with charts | Often enough | Board packs |

## Defence

- **Start from decisions.** For each metric, write what you'd do if it moved.
- **Define it precisely:** source, formula, owner, frequency.
- **Check the denominator.** "95% coverage" of an incomplete inventory is meaningless.
- **Show trends** and thresholds, not lone numbers.
- **Keep it short.** Five good measures beat fifty.
- **Audit your numbers** now and then, by sampling.
- **Escalate formally,** and document risk acceptance.

## Pitfalls

- **Means on skewed data.** Report medians.
- **Measuring what's easy.** It's seldom what matters.
- **Rewarding the wrong thing.** Punishing phishing clicks stops people reporting them.
- **All green.** If nothing's ever red, then the thresholds are wrong.
- **Technical language.** Translate it into impact.
- **Benchmark worship.** Being average is no defence.

?? A public US company finds a material incident. How fast must it disclose under SEC rules?
+ Four business days after determining materiality
- Seventy-two hours after the first alert
- Thirty days after closing the investigation
- One year after its annual report
=> Form 8-K Item 1.05 starts the clock when the company decides that the incident is material.

## Exercise

::: law Lab only
Use your lab data or fictional numbers. Don't publish real company metrics.
:::

1. From your lab SIEM or a fictional dataset, calculate the median and mean time to detect. Show how one outlier changes the mean.
2. Rewrite five vanity metrics from a real vendor report as decision-useful metrics.
3. For each, write: owner, source, formula, threshold, action if it's breached.
4. Build a one-page board report for a fictional company, with a risk, a trend and a request.
5. Present it to a classmate who plays a sceptical director. Note what they don't understand.

?! Your dashboard shows 99% patch compliance, but a critical server was missed for a year. Explain how both can be true, and redesign the metric.

## Further reading

- [NIST SP 800-55 Volume 1](https://csrc.nist.gov/pubs/sp/800/55/v1/final).
- [NIST CSF 2.0](https://www.nist.gov/cyberframework), its Govern function especially.
- [SEC cybersecurity disclosure rule](https://www.sec.gov/rules-regulations/2023/07/s7-09-22).
- [CIS Controls Measures and Metrics](https://www.cisecurity.org/controls).
- Andrew Jaquith, *Security Metrics*.
