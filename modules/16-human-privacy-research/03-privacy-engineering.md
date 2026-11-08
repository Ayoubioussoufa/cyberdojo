---
title: Privacy engineering
summary: Security guards data, and privacy asks whether you should hold it at all. Minimisation, why anonymisation fails, k-anonymity, differential privacy and tracking.
level: intermediate
side: defence
minutes: 50
attack: none
needs: 0062-policy-privacy-and-the-midpoint
pair: 12-05-eu-regulation, 16-04-anonymity-and-tor, 09-02-threat-modelling-methods
source: NIST Privacy Framework | https://www.nist.gov/privacy-framework
words: data minimisation, k-anonymity, differential privacy
---
A perfectly secure system can still be a privacy disaster. It can hold more than it needs, keep it forever, and use it for purposes nobody agreed to. Security asks who can access the data. Privacy engineering asks whether the data should exist, who it's about, and what it could reveal once combined with something else.

@term data minimisation = Collecting and keeping only the personal data needed for a stated purpose.
@term pseudonymisation = Replacing identifiers with a token, where the link can still be restored with extra information.
@term k-anonymity = A property in which each record is indistinguishable from at least k−1 others on identifying fields.
@term differential privacy = A mathematical guarantee that one person's data has a limited effect on a result.
@term quasi-identifier = A field that doesn't identify someone alone, but does in combination with others.

## Concept

### Fundamentals: principles

**Privacy by design**, set out by Ann Cavoukian, is now a legal duty in [GDPR Article 25](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679). In practice:

| Principle | Engineering action |
|---|---|
| Purpose limitation | Tag data with why it was collected |
| Minimisation | Don't collect it, or drop it early |
| Storage limitation | Automatic deletion schedules |
| Transparency | Explain what you do, and show it |
| User rights | Build export and deletion into the system |

Data you don't hold can't leak. Often, that's the cheapest control of all.

### Why removing names isn't enough

**Pseudonymisation** swaps a name for a token, but someone with the key can reverse it, and GDPR still treats it as personal data. True **anonymisation** is much harder.

Latanya Sweeney [showed](https://dataprivacylab.org/projects/identifiability/paper1.pdf) that ZIP code, gender and date of birth alone identify most Americans uniquely. She re-identified a governor's medical records by joining "anonymous" health data with public voter rolls. Those fields are **quasi-identifiers**. In 2008, [Narayanan and Shmatikov](https://arxiv.org/abs/cs/0610105) re-identified Netflix users from a few movie ratings, by linking with public IMDb reviews.

The lesson is that anonymity depends on what else exists, and on what will exist in future.

### k-anonymity and its limits

**k-anonymity** generalises data, say by replacing an age with a range, until each combination matches at least `k` people. It has limits. If everyone in a group has the same diagnosis, you learn it anyway. *l-diversity* and *t-closeness* tried to fix that. Rich data, such as location traces, is especially hard to protect.

### Advanced: differential privacy

**Differential privacy**, from Cynthia Dwork and colleagues, changes the question. Rather than sanitising data, it limits what any answer can reveal. A query's result gets calibrated random noise, so that it's almost the same whether or not your record is included. The parameter **epsilon** sets the trade-off: a smaller value gives more privacy and less accuracy. Each query spends budget, and repeated queries add up.

The [US Census Bureau](https://www.census.gov/programs-surveys/decennial-census/decade/2020/planning-management/process/disclosure-avoidance.html) used it for the 2020 census, and it sparked debate on accuracy for small communities. Apple and Google use local forms of it for telemetry.

Other tools help too: **federated learning** keeps data on devices, **secure aggregation** hides individual inputs, and [privacy-enhancing computation](/modules/03-12-modern-crypto-frontier/) can compute over protected data.

### Tracking

Online, identity leaks without a login. **Browser fingerprinting** combines fonts, screen size and GPU details into a near-unique ID. **Tracking pixels** record when an email is opened. Third-party cookies have been restricted in some browsers, which pushed trackers toward other methods. Data brokers link it together. For a security team, the same data is also useful to an attacker for [reconnaissance](/modules/09-05-osint-and-recon/).

?? Why can removing names fail to anonymise a dataset?
+ Remaining fields can still identify one person
- Names are stored in every other field
- Databases restore deleted columns without any warning
- Encryption keys always travel with the data
=> Combinations of ordinary fields are often unique, and they can be linked with other datasets.

## Threat model

Privacy threats differ from security ones: the "attacker" may be your own analytics team. **LINDDUN** names them: Linking, Identifying, Non-repudiation, Detecting, Data disclosure, Unawareness, Non-compliance. See [Threat modelling methods](/modules/09-02-threat-modelling-methods/). Insiders, data brokers and aggregations of "harmless" fields are all in scope.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| NIST Privacy Framework | Structures a programme | Getting started |
| [LINDDUN](https://linddun.org/) | Privacy threat modelling | Reviewing a design |
| ARX | Anonymises datasets | Testing k-anonymity |
| OpenDP, Google's DP library | Differential privacy | Publishing statistics |
| Data catalogue | Finds personal data | Minimisation |
| Cover Your Tracks | Tests browser fingerprinting | Seeing what you leak |

## Defence

- **Map your data:** what, why, where, how long, and shared with whom.
- **Run a DPIA** for high-risk processing, as GDPR requires.
- **Delete on schedule,** automatically, in backups too. [Crypto-shredding](/modules/03-11-key-management/) helps.
- **Separate identifiers** from analytics data.
- **Restrict internal access,** and log it.
- **Keep personal data out of logs**, which is a common leak.
- **Treat "anonymised" as a claim to test,** by trying to re-identify.

## Pitfalls

- **"It's only metadata."** Metadata reveals who you know, and where you sleep.
- **"Hashing emails anonymises them."** Anyone can hash a list of emails and compare.
- **"We might need it someday."** That's the most expensive sentence in data protection.
- **Setting epsilon without care.** A very large value gives a guarantee in name only.
- **Forgetting test data.** Copies of production data in dev environments are a classic breach.

?? What does epsilon control in differential privacy?
+ The trade-off between privacy and accuracy
- The number of stored database rows
- The size of the encryption key
- The speed of every query run
=> More noise gives a smaller epsilon, with stronger privacy and less accurate answers.

## Exercise

::: law Lab only
Use public synthetic datasets, or data you've generated. Don't attempt to re-identify real people, even in a public dataset.
:::

1. Generate a fake table of 1,000 people with ZIP, birth date, gender and diagnosis in Python. How many records are unique on the first three fields?
2. Generalise them until it's 5-anonymous. What's lost?
3. Find a group with one diagnosis, and explain why k-anonymity failed.
4. Add Laplace noise to a count query at three epsilon values. Plot the error.
5. Visit [Cover Your Tracks](https://coveryourtracks.eff.org/) in your own browser, and read the result.

?! A product team wants to share "anonymised" customer locations with a partner. Write a review with your concerns, and propose a safer design.

## Further reading

- [NIST Privacy Framework](https://www.nist.gov/privacy-framework).
- Dwork and Roth, [The Algorithmic Foundations of Differential Privacy](https://www.cis.upenn.edu/~aaroth/Papers/privacybook.pdf).
- Sweeney, [Simple Demographics Often Identify People Uniquely](https://dataprivacylab.org/projects/identifiability/paper1.pdf).
- [LINDDUN](https://linddun.org/).
- [CyBOK Privacy and Online Rights](https://www.cybok.org/knowledgebase1_1/).
