---
title: Threat actors and attribution
summary: Who attacks, why, and how their businesses work. States, criminals and insiders, the ransomware economy, how groups get named, and why attribution is so hard.
level: intermediate
side: both
minutes: 45
attack: T1650, T1583, T1486
needs: 0066-threat-intelligence
pair: 09-04-cti-sharing, 06-01-malware-families-and-economics
source: MITRE ATT&CK Groups | https://attack.mitre.org/groups/
words: advanced persistent threat, initial access broker, ransomware as a service
---
"Who would attack us?" decides almost everything in a security programme. A local charity and a defence contractor face different adversaries, with different patience, money and goals. Understanding the actors, and the economy behind them, stops you from defending against the wrong enemy.

@term advanced persistent threat = A well-resourced group, often state-backed, that pursues long-term access to chosen targets.
@term initial access broker = A criminal who breaks into organisations, then sells that access to others.
@term ransomware as a service = A model in which developers provide ransomware to affiliates, in exchange for a share of the payments.

## Concept

### Fundamentals: actors and motives

| Actor | Motive | Typical behaviour |
|---|---|---|
| Nation-state | Espionage, sabotage, money | Patient and targeted |
| Organised crime | Money | Opportunistic, scalable |
| Hacktivist | Publicity, ideology | DDoS, leaks, defacement |
| Insider | Money, revenge, mistakes | Uses legitimate access |
| Script kiddie | Curiosity, status | Commodity tools |
| Competitor | Advantage | Rare, and hard to prove |

The lines are blurring. Some states tolerate or use criminals, and North Korean groups steal money. Tools leak from one group to another.

### Crime as a supply chain

Modern cybercrime is a market with specialised jobs.

@flow Malware developers > Initial access brokers > Ransomware affiliates > Negotiators > Money launderers

**Initial access brokers** sell footholds, say VPN credentials to a company, on criminal forums. **Ransomware as a service** splits work: a core group runs the malware and the leak site, whereas affiliates do the intrusions and keep most of the ransom. So when a law enforcement action takes down a brand, the affiliates often move to another one. This means a ransomware group's name tells you less about behaviour than the affiliate does.

Extortion has grown beyond encryption: **double extortion** threatens to publish stolen data, and some groups skip encryption altogether. See [Malware families](/modules/06-01-malware-families-and-economics/).

### Naming and tracking

Each vendor names groups differently, which confuses everyone: one Russian actor is APT29, Cozy Bear, Midnight Blizzard, and more. Microsoft uses weather themes, CrowdStrike uses animals, and Mandiant uses numbers. [ATT&CK Groups](https://attack.mitre.org/groups/) lists aliases. Different vendors see different activity, so these names don't always match perfectly. Microsoft and CrowdStrike began [publishing a shared mapping](https://www.microsoft.com/en-us/security/blog/2025/06/02/announcing-a-new-strategic-collaboration-to-bring-clarity-to-threat-actor-naming/) in 2025.

### Advanced: attribution and insiders

**Attribution** asks who did it. There are several levels of evidence: technical overlap in tools and infrastructure, behaviour, language, working hours, and victimology. Yet each can be faked or shared. In 2018, the [Olympic Destroyer](https://securelist.com/olympicdestroyer-is-here-to-trick-the-industry/84295/) malware planted false flags that pointed to several groups. Thomas Rid's work describes attribution as a craft that uses judgement, rather than a technical test.

Government attributions may rest on intelligence that isn't public. In your reports, use the careful language of lesson 66, with a confidence level. For most defenders, attribution matters less than behaviour: **knowing how they operate helps more than knowing their passport**.

**Insiders** have legitimate access, so perimeter controls don't help. Three types recur: the malicious, the negligent and the compromised. Warning signs mix behaviour and technology, which is why HR and legal have to work with security. Detection must respect privacy and the law.

?? What does an initial access broker sell?
+ Footholds inside networks to other criminals
- Stolen source code to security vendors
- Insurance policies against a ransomware attack
- Legal penetration tests for local companies
=> Brokers specialise in getting in, then sell access, so one gang needn't do every stage.

## Threat model

Your threat profile comes from your sector, region, data, and suppliers. Use it to choose a few groups to study. Most organisations face mostly criminal, opportunistic attackers first. Key techniques here are buying access ([T1650](https://attack.mitre.org/techniques/T1650/)), acquiring infrastructure ([T1583](https://attack.mitre.org/techniques/T1583/)), and encrypting for impact ([T1486](https://attack.mitre.org/techniques/T1486/)).

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| ATT&CK Groups | Profiles and aliases | Learning a group's habits |
| Vendor threat reports | Campaign detail | Keeping current |
| [Ransomware.live](https://www.ransomware.live/) | Tracks leak site claims | Sector trends |
| ISACs, national CERTs | Sector intelligence | Peer warnings |
| Analysis of Competing Hypotheses | Structured reasoning | Fighting bias |

## Defence

- **Build a threat profile:** who, why, how, and what they'd want from you.
- **Start with criminals,** unless you've got a clear reason not to.
- **Close the broker's market:** MFA on remote access, patched edge devices, monitoring for leaked credentials.
- **Plan for extortion,** including data theft, and not just encryption. Decide on legal and sanctions questions early.
- **Run an insider programme** with HR and legal, with clear rules.
- **Report** to law enforcement and sector groups.

## Pitfalls

- **"Nobody would target us."** Most criminals aren't targeting. They're scanning.
- **Blaming a state to excuse a basic failure.** "Sophisticated attacker" is often a shield.
- **Attribution from a single clue.** Strings and time zones can be planted.
- **Treating brand names as stable.** Ransomware groups rebrand.
- **Ignoring insiders.** They're harder to discuss, but they're real.

?? Why is attribution from malware alone unreliable?
+ Tools can be shared, stolen or faked
- Malware never contains any readable language strings
- Governments forbid any analysis of their code
- Antivirus products delete attribution data on detection
=> Code moves between groups, and clues can be planted, as with Olympic Destroyer's false flags.

## Exercise

::: law Lab only
Use public reports. Don't visit criminal forums or leak sites to look for data, as this can be illegal or unsafe.
:::

1. Choose a sector, such as Moroccan banking. List three likely actor types, and their goals.
2. Look up one group in ATT&CK. List its aliases, and five techniques.
3. Compare two vendor reports on the same group. Where do they differ?
4. Practise Analysis of Competing Hypotheses on the Olympic Destroyer story, with at least three hypotheses.
5. Write a one-page threat profile for a fictional company.

?! Your CEO reads a headline about a state hacking group and asks "are we next?" Write a calm, honest reply, and say what you'd do differently, if anything.

## Further reading

- [MITRE ATT&CK Groups](https://attack.mitre.org/groups/).
- Thomas Rid and Ben Buchanan, [Attributing Cyber Attacks](https://www.tandfonline.com/doi/full/10.1080/01402390.2014.977382).
- [Verizon DBIR](https://www.verizon.com/business/resources/reports/dbir/).
- [Mandiant M-Trends](https://cloud.google.com/security/resources/m-trends).
- [CISA Insider Threat Mitigation](https://www.cisa.gov/topics/physical-security/insider-threat-mitigation).
