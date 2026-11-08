---
title: Reading and doing security research
summary: How a Master's student gets from blog posts to primary sources. Top venues, reading a paper in three passes, judging claims, reproducing work, and picking a thesis topic.
level: foundation
side: both
minutes: 40
attack: none
needs: 0002-the-rules-of-the-game
pair: 12-02-disclosure-and-ethics, 14-01-adversarial-ml
source: Keshav, How to Read a Paper | https://web.stanford.edu/class/ee384m/Handouts/HowtoReadPaper.pdf
words: three-pass method, base rate, threat model
---
Most security knowledge starts in a paper, a talk or an advisory, and only then reaches blogs. By the time it reaches a course, it's a summary of a summary. A Master's student has to read the original, judge it, and eventually add to it. These are skills like any other, and they can be taught.

@term three-pass method = A way of reading a paper in three rounds, from skimming to deep critique.
@term artifact evaluation = A process in which reviewers check that a paper's code and data really work.

## Concept

### Fundamentals: where the field publishes

| Venue | Type |
|---|---|
| IEEE S&P, USENIX Security, ACM CCS, NDSS | The top four academic conferences |
| Crypto, Eurocrypt, Asiacrypt | Top cryptography |
| RAID, ACSAC, EuroS&P, AsiaCCS | Strong systems security |
| SOUPS | Usable security |
| Black Hat, DEF CON, OffensiveCon | Practitioner research |
| IACR ePrint, arXiv | Preprints, not peer reviewed |

Practitioner talks show what works today. Academic papers offer measurement, proofs and methods. Read both.

Cryptography and systems security have their own norms, as the former favours proofs, and the latter measurements. Finding your way starts with one survey paper, or an SoK ("Systematization of Knowledge") paper from IEEE S&P, which maps a whole area.

### Reading a paper

[S. Keshav's method](https://web.stanford.edu/class/ee384m/Handouts/HowtoReadPaper.pdf) saves a great deal of time.

| Pass | Time | Goal |
|---|---|---|
| First | 5 to 10 minutes | Title, abstract, headings, conclusion. Keep going? |
| Second | About an hour | Understand the method, figures and main result |
| Third | Several hours | Re-derive it, and find what's weak |

Write answers to these after reading:

1. What problem does it solve, and why does it matter?
2. What's the **threat model**? What's assumed?
3. What's the method, and how was it evaluated?
4. What's the main result, in one sentence?
5. What's not covered?

### Judging a claim

Questions to ask of any security result:

- **Is the threat model realistic?** An attack that needs root may prove nothing.
- **How was it evaluated?** Which data, and how much? Is the dataset old?
- **Are the base rates honest?** Stefan Axelsson's [The Base-Rate Fallacy](https://dl.acm.org/doi/10.1145/357830.357849) showed that even tiny false-alarm rates swamp analysts when attacks are rare. A "99% accurate" detector can be useless, which is the trap lesson 76 taught.
- **Could it be replicated?** Are the code and data available? Many venues now run artifact evaluation.
- **Who paid for it?** Vendor reports can be useful, but they're marketing too.

Machine learning work has its own traps. [Arp and others](https://www.usenix.org/conference/usenixsecurity22/presentation/arp) listed ten common pitfalls, such as data snooping and spurious correlations.

### Advanced: doing research

**Finding a question.** Good topics sit at the meeting of something you care about, an open problem, and data you can get. Replicating a paper is a respected way in, and it often turns up a real question. Read a recent SoK's "open problems" section.

**Scope a Master's thesis tightly.** One clear question, one method, and a real evaluation. "Improve IDS with AI" isn't a question. "Does a JA4-based feature reduce false positives on this dataset, compared to this baseline?" is one.

**Method.** Measure against a baseline, report negative results honestly, and state your limitations.

**Ethics.** Testing on people, or on live systems, needs review. Disclose flaws first. See [Disclosure and ethics](/modules/12-02-disclosure-and-ethics/). Many venues now require an ethics section.

**AI tools.** Use them to find and summarise, then check every claim against the source, as lesson 2 said. Hallucinated citations are a career-ending mistake in academic work.

?? What should your first pass through a paper cover?
+ The title, abstract, headings and the conclusions
- The full proofs, line by line, carefully
- The appendix tables and all the references
- The authors' earlier work in great detail
=> A first pass only decides whether the paper deserves more of your time, and what it's about.

## Threat model

This module's threats are to the quality of your work: wrong claims, biased data, unreproducible results, and misconduct. A weak method can mislead a whole field, and copying from a summary spreads errors. Plagiarism and data fabrication can end an academic career.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| [Google Scholar](https://scholar.google.com/), [DBLP](https://dblp.org/) | Find papers | Literature search |
| [Semantic Scholar](https://www.semanticscholar.org/), Connected Papers | Follow citations | Mapping a topic |
| Zotero | Reference manager | From day one |
| [Top4Grep](https://github.com/Kyle-Kyle/top4grep) | Searches top-venue titles | Quick checks |
| LaTeX | Paper writing | Theses and submissions |
| Git and notebooks | Reproducible experiments | All your work |

## Defence

- **Keep a reading log,** with one paragraph per paper.
- **Follow primary sources.** Trace a claim to where it began.
- **Pre-register your evaluation plan,** at least in your own notes.
- **Publish code and data** when you can.
- **Ask your supervisor early** about ethics review.
- **Join a reading group.** Discussing papers aloud teaches more than reading alone.

## Pitfalls

- **Reading linearly from page one.** You'll waste hours on the wrong paper.
- **Trusting a preprint** as if it were reviewed.
- **Choosing a huge topic.** A thesis needs to finish.
- **Citing without reading.** Check the page that you cite.
- **Copying a baseline without checking it.** A flawed baseline flatters your result.
- **Hiding negative results.** They're often the most useful.

?? Why does Axelsson's base-rate result matter for IDS research?
+ Rare attacks make small false-positive rates costly
- Fast networks remove any need for sensors
- Signature rules never trigger on real traffic
- Encrypted traffic always contains hidden attack patterns
=> When attacks are very rare, most alarms are false, even from an accurate detector, so accuracy alone misleads.

## Exercise

::: law Lab only
Reproduce results only on your own systems and public datasets. If a paper's experiment touches live systems or people, don't repeat that part.
:::

1. Pick a recent paper from USENIX Security in a topic that you like. Do a first pass in ten minutes.
2. Do a second pass, and write answers to the five questions above.
3. Find a Systematization of Knowledge paper in that area, and list three open problems.
4. If the paper has an artifact, try to run it. Note what fails.
5. Write a one-page proposal: question, data, method, baseline, risks, ethics.

?! Take a claim from a vendor's marketing page, such as "99.9% detection". List the questions you'd ask before believing it.

## Further reading

- Keshav, [How to Read a Paper](https://web.stanford.edu/class/ee384m/Handouts/HowtoReadPaper.pdf).
- Arp and others, [Dos and Don'ts of Machine Learning in Computer Security](https://www.usenix.org/conference/usenixsecurity22/presentation/arp).
- [Security and Privacy Academic Rankings](https://csrankings.org/#/index?sec&world), to find strong groups.
- [IACR ePrint](https://eprint.iacr.org/), for cryptography preprints.
- [Top Academic Conferences list](https://people.engr.tamu.edu/guofei/sec_conf_stat.htm), with acceptance rates.
