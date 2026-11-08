---
title: EU security regulation
summary: GDPR, NIS2, DORA, the Cyber Resilience Act and the AI Act. Who each one binds, what it demands, its deadlines, and why European rules reach companies outside Europe.
level: intermediate
side: defence
minutes: 50
attack: none
needs: 0062-policy-privacy-and-the-midpoint
pair: 12-06-sector-compliance, 16-03-privacy-engineering
source: Directive (EU) 2022/2555 (NIS2) | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2555
words: NIS2, DORA, Cyber Resilience Act
---
European regulation has moved security from a technical preference to a legal duty, with named managers responsible and large fines. A Moroccan firm that sells to EU customers or handles their data may fall within scope too. This module is an orientation, not legal advice. These rules change, as the 2026 updates below show, so always check the current text.

@term essential entity = An organisation in a critical sector under NIS2, subject to the strictest supervision.
@term data protection impact assessment = An assessment under GDPR of the risks of high-risk personal data processing.

## Concept

### Fundamentals: who is covered

| Law | Protects | Applies to | In force |
|---|---|---|---|
| **GDPR** | Personal data | Anyone processing EU residents' data | 2018 |
| **NIS2** | Essential services | Medium and large firms in listed sectors | National laws from Oct 2024 |
| **DORA** | Financial sector resilience | Banks, insurers, their ICT providers | 17 Jan 2025 |
| **Cyber Resilience Act** | Products with digital elements | Manufacturers selling in the EU | Phased, to Dec 2027 |
| **AI Act** | Safety and rights in AI | Providers and deployers of AI | Phased, to 2028 |

### GDPR

GDPR isn't only a privacy law, as its [Article 32](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679) requires appropriate security. Article 33 requires telling the supervisory authority within **72 hours** of becoming aware of a personal data breach, unless it's unlikely to create a risk. Article 34 requires telling affected people if the risk is high. Fines reach €20 million or 4% of worldwide turnover. It reaches beyond Europe: a firm elsewhere that offers goods to people in the EU is covered. Morocco's own [law 09-08](https://www.cndp.ma/) is enforced by the CNDP.

### NIS2

[NIS2](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2555) greatly widens the sectors covered, and splits them into *essential* and *important* entities. It's a directive, so each member state writes its own law. Its central points:

- **Article 20:** management bodies must approve risk measures, oversee them, take training, and can be held liable.
- **Article 21:** a list of minimum measures, including incident handling, supply chain security, MFA and cryptography.
- **Article 23:** an early warning within **24 hours** of awareness, a notification within **72 hours**, and a final report within one month.
- **Article 34:** fines of up to at least €10 million or 2% of turnover for essential entities, and €7 million or 1.4% for important ones.

### DORA

[DORA](https://eur-lex.europa.eu/eli/reg/2022/2554/oj/eng) applies directly across the EU's financial sector. It covers ICT risk management, incident reporting, resilience testing, and third-party risk. Large firms must run threat-led penetration tests. Critical ICT providers, such as big cloud firms, can be overseen directly, which is unusual.

### Cyber Resilience Act

The [CRA](https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act) (Regulation 2024/2847) treats security as a product property, much like electrical safety. Manufacturers of hardware and software must secure products by design and support them with updates. Since **11 September 2026**, they've had to [report actively exploited vulnerabilities](https://digital-strategy.ec.europa.eu/en/policies/cra-reporting) and severe incidents within 24 hours. Most other duties apply from **11 December 2027**. Fines reach €15 million or 2.5% of turnover. Open-source stewards have a lighter regime.

### Advanced: the AI Act, and overlap

The [AI Act](https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng) takes a risk-based approach. Prohibited uses have applied since February 2025, and rules for general-purpose models since August 2025. Rules for high-risk systems have moved. According to law-firm summaries, the **AI Omnibus**, Regulation (EU) 2026/1744, entered into force in July 2026. It moved stand-alone high-risk systems to 2 December 2027, and those embedded in regulated products to 2 August 2028. Check the Official Journal for exact details, because summaries disagree on some items.

**Overlap is the real problem.** One incident at a bank might trigger GDPR, DORA and more, each with its own clock and authority. So a workable [incident plan](/modules/08-04-tabletop-exercises/) has a matrix: event type, regulator, deadline, owner.

**Scope is a question, not an assumption.** Size thresholds, sectors, and national laws matter. Some states have been slow to transpose NIS2, so check national status.

?? Under NIS2, when is the first notice due?
+ Within 24 hours of becoming aware
- Within 72 hours of containing it
- Within 30 days of the breach
- Within a week of full recovery
=> Article 23 requires an early warning within 24 hours, a notification within 72, and a final report a month later.

## Threat model

Regulation changes the attacker's leverage. Extortion groups threaten to report victims to regulators, and a missed deadline adds cost on top of the breach. Supply chain duties mean that your supplier's incident can become yours. The compliance risk is that teams chase paperwork instead of [real controls](/modules/12-04-nist-rmf-and-controls/).

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| EUR-Lex | Official legal text | Checking any claim |
| National CSIRT sites | Local reporting guidance | Finding where to report |
| ENISA guidance | Technical advice | Implementing measures |
| Regulator matrix | Maps events to duties | Incident planning |
| CRA single reporting platform | Vulnerability reporting | Manufacturers |

## Defence

- **Work out your scope in writing.** Do this for each law, with legal advice.
- **Build one control set** mapped to all of them, rather than five programmes.
- **Write a notification matrix** with clocks and owners.
- **Train the board.** NIS2 makes that a duty, and it's useful too.
- **Review supplier contracts** for notification and audit rights.
- **Keep a product inventory** if you make software, including SBOMs and support periods.

## Pitfalls

- **"We're not in the EU."** Selling to EU customers or being a supplier may still bring you in.
- **"72 hours from the breach."** Clocks usually start at *awareness*, and legal teams must define when that is.
- **"Compliance equals security."** Fines and breaches are separate risks.
- **Relying on old summaries.** The AI Act dates changed in 2026. Any blog older than that is out of date.
- **Assuming one regulator.** Several may need telling.

?? Which Cyber Resilience Act duty already applies in November 2026?
+ Reporting exploited vulnerabilities within 24 hours
- Full conformity assessment for every product
- CE marking for all digital products
- Mandatory bans on all open-source components
=> Article 14 reporting began on 11 September 2026. Most other duties start on 11 December 2027.

## Exercise

::: law Lab only
This is research only. Use a fictional company, and take real legal advice before relying on your conclusions.
:::

1. Choose a fictional Moroccan software firm with 80 staff, selling to French hospitals. Decide whether GDPR, NIS2 and the CRA might apply, and why.
2. Read Article 23 of NIS2 in EUR-Lex, and write a one-page timeline for a ransomware attack.
3. Check how one EU country has transposed NIS2. What's the name of its law?
4. Build a notification matrix for a data breach at a bank.
5. Compare GDPR Article 33 with Morocco's law 09-08 on breach or security duties. What's different?

?! Your CEO asks "are we personally liable under NIS2?" Write a careful four-sentence answer, and say what you'd ask a lawyer.

## Further reading

- [NIS2 Directive](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2555).
- [GDPR](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679).
- [DORA](https://eur-lex.europa.eu/eli/reg/2022/2554/oj/eng).
- [Cyber Resilience Act overview](https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act).
- [ENISA](https://www.enisa.europa.eu/), the EU cybersecurity agency.
