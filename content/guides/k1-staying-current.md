---
title: Staying current without drowning
summary: Which knowledge lasts and which doesn't, a 30-minute weekly routine, and how to rank your sources.
group: Habits
minutes: 5
source: CISA Known Exploited Vulnerabilities catalog | https://www.cisa.gov/known-exploited-vulnerabilities-catalog
---
Cybersecurity changes fast in the shallow layer and slowly in the deep one. Knowing which is which keeps 30 minutes a week sufficient.

| Durable (5–10+ years) | Medium (2–5 years) | Fast (months) |
|---|---|---|
| TCP/IP, DNS, HTTP, TLS | Specific SIEM/EDR products | AI models and attack techniques |
| Operating-system internals | Cloud service details | Exploit specifics |
| AD and Kerberos concepts | Framework versions (CSF 2.0, OWASP 2025) | Threat-actor tradecraft |
| Cryptographic principles | Kubernetes APIs | Vendor product names and portals |
| Attacker lifecycle | CI/CD platform features | Certification versions and prices |
| Investigation method, risk thinking | Certification syllabi | Platform pricing |
| Secure design, programming, writing | | |

**What this means for your hours:** most study time goes on the left column, keep working knowledge of the middle, and consume the right as news, not study. Anything important will be repeated.

## The 30-minute weekly routine

| Slot | Source | Output |
|---|---|---|
| Monday, 10 min | [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) additions and major advisories | One line per relevant item: does it affect anything you run or study? |
| Wednesday, 10 min | One vendor research post: Google Threat Intelligence, Microsoft, Unit 42, Talos, Elastic Security Labs, The DFIR Report | Three bullets: technique, detection opportunity, can you test it? |
| Friday, 10 min | Newsletters: tl;dr sec, Detection Engineering Weekly, This Week in 4n6, SANS ISC diaries | Add actionable items to your later list, and ignore the rest |
| Monthly, 60 min | One long report: Verizon DBIR, Red Canary, M-Trends, ENISA | A one-page summary and one detection or lab idea |
| Commute | Podcasts: Risky Business, Darknet Diaries | Context and vocabulary, not a substitute for reading |

## Source hierarchy (apply it to AI output too)

1. **Primary:** vendor documentation, RFCs, standards, source code, official advisories, the actual data.
2. **Secondary:** reputable research teams and practitioners publishing reproducible work.
3. **Tertiary:** news and summaries: fine for awareness, never for technical detail.
4. **Noise:** social-media hot takes, vendor marketing, AI content farms.

**Always check the date.** In this field, a 2022 blog post can be actively harmful.

?? You read a viral post claiming a new attack. Before you repeat it, what do you look for?
+ The vendor advisory or the original paper
- A second post saying the same thing
- The number of likes it has received
- An AI summary of the viral post
=> Repetition isn't confirmation. Go up the hierarchy to the primary source, and check the date.

?! Set up your routine: name the exact sources you'll read and when.
