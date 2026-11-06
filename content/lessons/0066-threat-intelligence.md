---
title: Threat intelligence
summary: The intelligence cycle, the Diamond Model, confidence language and TLP, and turning reports into detections.
month: 15
minutes: 30
builds: a short intelligence report with tested detections
source: MITRE ATT&CK CTI training | https://attack.mitre.org/resources/learn-more-about-attack/training/cti/
words: intelligence requirement, Diamond Model, TLP
---
Threat intelligence isn't a feed of bad IPs. It's analysis that helps someone make a better decision. If it changes nothing, it wasn't intelligence.

@term intelligence requirement = The specific question that intelligence work is meant to answer.
@term Diamond Model = A model describing an intrusion by adversary, capability, infrastructure and victim.
@term TLP (Traffic Light Protocol) = Labels saying how far information may be shared.
@term OSINT = Open-source intelligence: information gathered from public sources.

## The cycle

@flow Requirements > Collect > Process > Analyse > Share > Feedback

Start from a question: "Which groups target logistics firms in North Africa, and how do they get in?"

## Levels

| Level | Audience | Example |
|---|---|---|
| Strategic | Executives | "Ransomware against our sector is rising" |
| Operational | IR, SOC leads | "This campaign phishes payroll staff" |
| Tactical | Detection engineers | TTPs and indicators |

## Careful language

Say how sure you are, and why: "We assess with **moderate confidence** that…". Separate what's known from what's judged, cite sources, and name your gaps. Resist attribution: naming a culprit is the hardest claim, and rarely what defenders need.

## Sharing: TLP 2.0

| Label | May be shared with |
|---|---|
| `TLP:RED` | Named recipients only |
| `TLP:AMBER` | Their organisation and clients, as needed |
| `TLP:GREEN` | The community |
| `TLP:CLEAR` | Anyone |

Defined by [FIRST](https://www.first.org/tlp/).

?? A report is marked `TLP:AMBER`. Can you post it on your public blog?
+ No, sharing is limited to need-to-know recipients
- Yes, provided you credit the original author
- Yes, because threat reports are always public
- No, only because it contains IP addresses
=> TLP labels are the source's handling instructions. AMBER isn't public.

::: try Intelligence to detections
Choose a campaign with several public reports. Map behaviours to ATT&CK, citing a source sentence for each. Derive five detections and test them. See [P12](/projects/P12/).
:::

?! Write one intelligence requirement that your imaginary company would really care about.
