---
title: Quantitative risk with FAIR
summary: Turn "high, medium, low" into ranges of money that a business can compare. FAIR's factors, calibrated estimates, Monte Carlo simulation, and how to avoid false precision.
level: intermediate
side: defence
minutes: 50
attack: none
needs: 0060-risk-assessment
pair: 12-07-metrics-and-reporting
source: The FAIR Institute | https://www.fairinstitute.org/what-is-fair
words: loss event frequency, loss magnitude, Monte Carlo simulation
---
Lesson 60 used qualitative ratings. Those work for sorting, yet they hide a lot. Is one "high" worth twice another? Should you spend €200,000 to reduce a "high" to a "medium"? Nobody can tell. Quantitative risk answers in money and probability, which is a language that executives already use.

@term FAIR (Factor Analysis of Information Risk) = A model that breaks risk into measurable factors, to express it in financial terms.
@term loss event frequency = How often a loss is expected to occur in a given time.
@term loss magnitude = How much a single loss event costs.
@term calibrated estimate = An estimate from someone trained to give ranges that contain the true value at the stated rate.
@term Monte Carlo simulation = Estimating outcomes by sampling random inputs many times, then studying the results.

## Concept

### Fundamentals: why the heat map falls short

A 5×5 grid is easy to draw, but it has real flaws. Ordinal labels can't be multiplied, even though people do. Ranges get lumped together: a €10,000 loss and a €900,000 loss might both be "medium". Different people read "likely" differently. [Douglas Hubbard](https://hubbardresearch.com/) and [Tony Cox](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1539-6924.2008.01030.x) have argued that risk matrices can even give worse-than-random decisions in some cases.

### Classic numbers

The traditional formula is **ALE = SLE × ARO**: annualised loss expectancy equals the loss from one event, multiplied by how many are expected per year. If an outage costs €50,000 and is expected once in five years, then the ALE is €10,000. It's a simple start, but a single number hides how wide the uncertainty is.

### FAIR's tree

FAIR defines risk as *the probable frequency and magnitude of future loss*, and breaks each down.

@flow Risk > Loss event frequency × Loss magnitude

| Factor | Question |
|---|---|
| Threat event frequency | How often do attackers try? |
| Vulnerability | When they try, how often do they succeed? |
| Primary loss | Direct cost: response, downtime, replacement |
| Secondary loss | Reactions: fines, lawsuits, customers leaving |

You estimate at whichever level you've got data for. [FAIR is an Open Group standard](https://www.opengroup.org/certifications/openfair), called Open FAIR.

### Estimates are ranges

You'll never know exact numbers. So give a **range with a confidence level**, such as "90% sure that it's between 0.1 and 0.5 events per year". Sources include incident history, industry reports, insurers and experts. People tend to be overconfident, so **calibration training** helps: practise on trivia until your 90% ranges contain the truth 90% of the time.

Measuring is valuable even at low precision. You don't need certainty, only less uncertainty than you had.

### Advanced: simulation

Combine ranges with a **Monte Carlo simulation**: draw random values from each range, compute the loss, and repeat thousands of times. You get a distribution, not one number.

```python
import numpy as np
rng = np.random.default_rng(7)
n = 100_000
events = rng.poisson(rng.uniform(0.1, 0.5, n))
loss_each = rng.lognormal(np.log(200_000), 0.9, n)
annual = events * loss_each
print(round(annual.mean()), np.percentile(annual, [50, 90, 99]).round())
```

Run with NumPy, that printed a mean of about 89,000, a median of 0, a 90th percentile of about 284,000, and a 99th of about 1.2 million. About 75% of simulated years had no loss at all, so the median says nothing. That's why decision makers read a **loss exceedance curve**: the probability that yearly loss exceeds each amount. A statement such as "a 10% chance of losing more than €X this year" can be compared with the company's risk appetite, or an insurance quote.

To value a control, run the model twice, with and without it. The reduction in expected loss, against the control's cost, gives a defensible argument.

Beware of model risk. Security incidents are **fat-tailed**, and a rare event can be far worse than any estimate. Models inform judgement, and they don't replace it. Keep your assumptions on the page.

?? In FAIR, risk is the product of which two factors?
+ Loss event frequency and loss magnitude
- Threat actor skill and patch level
- Asset count and control coverage score
- Vulnerability score and the exposure window
=> Frequency and magnitude are the top of the tree, and the other factors feed one or the other.

## Threat model

This module doesn't model a technique. It's how you price one. Threat intelligence feeds threat event frequency: how often does ransomware hit firms like yours? Control strength feeds vulnerability. The danger is that attackers change faster than your data does, so review estimates after major incidents in your sector.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Python with NumPy | Monte Carlo in a few lines | Learning, and small models |
| Excel with RAND | Simple simulations | Sharing with finance |
| RiskLens, Safe Security | Commercial FAIR platforms | Large programmes |
| Verizon DBIR, IBM Cost of a Data Breach | Industry data | Estimating frequency and cost |
| Your incident history | The best data you have | Always |

## Defence

- **Start with one decision,** not a whole register. "Should we buy this tool?" is ideal.
- **Write assumptions down**, and name who gave each estimate.
- **Train your estimators** in calibration.
- **Report ranges, not points.**
- **Compare with risk appetite,** which leadership should define.
- **Revisit.** Update after incidents, audits, or big changes.

## Pitfalls

- **False precision.** "€1,283,417" is a lie. Round, and show a range.
- **Garbage in, polished out.** A beautiful chart can hide a bad guess.
- **Ignoring tail risk.** The average doesn't describe a rare catastrophe.
- **Modelling everything.** Quantify decisions worth the effort.
- **Treating the model as truth.** It's a thinking tool.

?? Why give a range rather than a single number?
+ It states the uncertainty in each estimate
- It makes the final answer always larger
- It removes the need for any data
- It turns each guess into a fact
=> A range tells the reader how much you really know. A single number implies a confidence that you don't have.

## Exercise

::: law Lab only
Use a fictional company, or public figures. Don't publish real internal loss numbers.
:::

1. For a fictional online shop, write one risk scenario in the form "ransomware stops order processing".
2. Estimate threat event frequency, vulnerability and loss, each as a 90% range. Say where each came from.
3. Run the Python above with your numbers. Note the mean, the median and the 90th percentile.
4. Plot a loss exceedance curve with Matplotlib.
5. Model a €40,000 control that cuts success probability by half. Is it worth buying?
6. Test your calibration: answer ten trivia questions with 90% ranges. How many contain the truth?

?! Your CFO says "just tell me if this risk is high or medium". Explain in three sentences why a range helps them more, and give an example.

## Further reading

- [The FAIR Institute](https://www.fairinstitute.org/what-is-fair).
- Freund and Jones, *Measuring and Managing Information Risk*.
- Hubbard and Seiersen, *How to Measure Anything in Cybersecurity Risk*.
- [Verizon Data Breach Investigations Report](https://www.verizon.com/business/resources/reports/dbir/).
- Cox, [What's Wrong with Risk Matrices?](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1539-6924.2008.01030.x).
