---
title: Threat intelligence
summary: The intelligence cycle, levels of intelligence, the Diamond Model, confidence language and TLP, and turning reports into detections.
month: 15
minutes: 50
builds: a short intelligence report with tested detections
source: MITRE ATT&CK CTI training | https://attack.mitre.org/resources/learn-more-about-attack/training/cti/
words: intelligence requirement, Diamond Model, TLP
---
Threat intelligence isn't a feed of bad IPs. It's analysis that helps someone make a better decision. If it changes nothing, it wasn't intelligence.

@term intelligence requirement = The specific question that intelligence work is meant to answer.
@term Diamond Model = A model describing an intrusion by adversary, capability, infrastructure and victim.
@term TLP (Traffic Light Protocol) = Labels saying how far information may be shared.
@term OSINT = Open-source intelligence: information gathered from public sources.
@term attribution = Naming who was behind an attack.
@term STIX = A standard format for sharing threat intelligence.
@term MISP = An open-source platform for sharing threat intelligence.

## Data, information, intelligence

| Stage | Example |
|---|---|
| **Data** | `203.0.113.7` |
| **Information** | That address attacked 40 logistics firms last week |
| **Intelligence** | We're a likely target, they enter through our VPN product, so patch it today |

Each step adds context and meaning, until someone can act on it.

?? Which of these is intelligence, rather than data?
+ This group targets our sector, so patch VPNs
- A long feed of 500 IP addresses here
- The SHA-256 hash of one recent malware sample
- A raw export of yesterday's firewall logs here
=> Intelligence says what it means for you and what to do. The others are raw material.

## The cycle

@flow Requirements > Collect > Process > Analyse > Share > Feedback

Start from a question, the **intelligence requirement**: "Which groups target logistics firms in North Africa, and how do they get in?" Without one, you collect everything and answer nothing. The feedback step closes the loop: did this help?

?? An analyst subscribes to ten free feeds, but nobody uses the output. What was skipped?
+ Defining the question that it should answer
- Buying a much larger, more expensive feed
- Translating all the feeds into several languages
- Deleting the old feeds every single morning
=> Collection without a requirement produces noise. Good intelligence starts with what a decision-maker needs to know.

## Levels

| Level | Audience | Example |
|---|---|---|
| Strategic | Executives | "Ransomware against our sector is rising" |
| Operational | IR, SOC leads | "This campaign phishes payroll staff" |
| Tactical | Detection engineers | TTPs and indicators |

The same report may need three versions. A CEO doesn't want hashes, and a detection engineer doesn't want trends.

?? Who's the right audience for "ransomware against our sector rose 40% this year"?
+ Executives deciding where to spend the budget
- Detection engineers writing new rules for today
- Help desk staff resetting a user's password
- Developers fixing a login form bug today
=> That's strategic intelligence: it shapes priorities and investment, not a specific rule.

## The Diamond Model

The **Diamond Model** describes an intrusion with four points. Any two connected points can lead you to a third, which is how analysts pivot.

| Point | Question | Example |
|---|---|---|
| Adversary | Who? | Unknown group |
| Capability | With what? | Phishing, a loader |
| Infrastructure | From where? | `203.0.113.7`, a domain |
| Victim | Against whom? | Payroll staff |

So if you know the infrastructure, you can search for other victims of it. Knowing the capability, you can look for other infrastructure using it.

?? You've found a domain used by an attacker. What's a useful pivot?
+ Search your logs for hosts contacting that domain
- Wait until the domain's registration expires by itself
- Rename your own company's main domain at once
- Report it as your final attribution of them
=> Infrastructure leads to victims. Searching your own logs turns one indicator into scope.

## Careful language

Say how sure you are, and why: "We assess with **moderate confidence** that…". Separate what's known from what's judged, cite sources, and name your gaps.

| Confidence | Means |
|---|---|
| High | Good evidence from several reliable sources |
| Moderate | Credible, but with gaps or single-source parts |
| Low | Thin or questionable evidence |

Resist **attribution**: naming a culprit is the hardest claim, and rarely what defenders need. An IP address in a country doesn't mean that country did it. The behaviour is what you can act on.

?? A report says "the attacker's server was in Country X, so Country X did it". What's wrong?
+ Infrastructure location doesn't prove who operated it
- Servers can't be located in any country
- Reports must never mention a specific country
- Attribution always needs exactly three source IPs
=> Attackers rent or hijack servers anywhere. It's a classic error to treat location as identity.

## Sharing: TLP 2.0

| Label | May be shared with |
|---|---|
| `TLP:RED` | Named recipients only |
| `TLP:AMBER+STRICT` | Their organisation only |
| `TLP:AMBER` | Their organisation and clients, as needed |
| `TLP:GREEN` | The community |
| `TLP:CLEAR` | Anyone |

Defined by [FIRST](https://www.first.org/tlp/). Platforms such as **MISP** and OpenCTI store and share intelligence, often in a standard format called **STIX**.

@drill tlp

?? A report is marked `TLP:AMBER`. Can you post it on your public blog?
+ No, sharing is limited to need-to-know recipients
- Yes, provided you credit the original author
- Yes, because threat reports are always public
- No, only because it contains IP addresses
=> TLP labels are the source's handling instructions. AMBER isn't public.

## From report to answer

@range intel

::: try Intelligence to detections
Choose a campaign with several public reports. Map behaviours to ATT&CK, citing a source sentence for each. Derive five detections and test them. See [P12](/projects/P12/).
:::

?! Write one intelligence requirement that your imaginary company would really care about.
