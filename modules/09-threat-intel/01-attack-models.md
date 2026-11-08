---
title: Attack models compared
summary: Kill Chain, Unified Kill Chain, ATT&CK, D3FEND, CAPEC and the Diamond Model. What each one is for, how they fit, and how a defender actually uses them.
level: foundation
side: both
minutes: 40
attack: none
needs: 0011-maps-of-the-field, 0053-attck-and-the-pyramid-of-pain
pair: 09-02-threat-modelling-methods
source: Hutchins, Cloppert and Amin, Intelligence-Driven Computer Network Defense | https://www.lockheedmartin.com/content/dam/lockheed-martin/rms/documents/cyber/LM-White-Paper-Intel-Driven-Defense.pdf
words: Cyber Kill Chain, D3FEND, CAPEC
---
There's no single map of an attack. There are several, each answering a different question, and people argue about them as if they compete. Knowing what each is for will save you from forcing the wrong one onto a problem. Lessons 11 and 53 introduced ATT&CK. This module puts it among its neighbours.

@term Cyber Kill Chain = Lockheed Martin's seven-stage model of an intrusion, from reconnaissance to objectives.
@term Unified Kill Chain = An 18-phase model that merges the Kill Chain and ATT&CK, covering what happens after the first foothold.
@term D3FEND = MITRE's knowledge graph of defensive techniques, linked to the offensive techniques they counter.
@term CAPEC = MITRE's catalogue of common attack patterns against software.

## Concept

### Fundamentals: what each model answers

| Model | Question | Best for |
|---|---|---|
| Cyber Kill Chain | What phases must an intrusion pass through? | Explaining, breaking the chain |
| Unified Kill Chain | What's the full path, including inside the network? | Modern intrusions |
| ATT&CK | What do attackers really do, in detail? | Detection and coverage |
| Diamond Model | How are adversary, capability, infrastructure and victim linked? | Analysing one event |
| Pyramid of Pain | Which indicators hurt the attacker to lose? | Prioritising detection |
| CAPEC | How are software weaknesses attacked? | AppSec testing |
| D3FEND | Which defences counter a technique? | Choosing controls |

### The Kill Chain

Lockheed Martin's [2011 paper](https://www.lockheedmartin.com/content/dam/lockheed-martin/rms/documents/cyber/LM-White-Paper-Intel-Driven-Defense.pdf) borrowed a military idea: an attack is a chain, so breaking one link stops it.

@flow Reconnaissance > Weaponisation > Delivery > Exploitation > Installation > Command and control > Actions on objectives

Its great gift was a change in mindset. Defenders no longer needed to win every battle, only one, and they could analyse past intrusions to build indicators earlier in the chain. It's easy to explain to executives.

Its limits come from its age. It centres on malware, on the perimeter, and on a linear path. It says little about insider threats, cloud account abuse, or what happens after the first foothold, where modern attackers spend most of their time.

### The Unified Kill Chain

Paul Pols's [Unified Kill Chain](https://www.unifiedkillchain.com/) extends this to 18 phases, grouped as *in*, *through* and *out*: getting into the network, moving through it, and acting on goals. It's a better match for lateral movement, and it's useful for red team reporting.

### ATT&CK

ATT&CK isn't a sequence. It's a matrix of **tactics** (why) and **techniques** (how), drawn from real-world reports. Version 20 has 15 Enterprise tactics, since Defense Evasion split into Stealth and Defense Impairment in v19. It also covers Mobile and ICS. Its strength is its level of detail. Its risk is treating it as a checklist to fill with green.

### Advanced: the defensive side

**D3FEND** maps countermeasures into categories such as Harden, Detect, Isolate, Deceive and Evict, and it links them to ATT&CK through the digital artefacts that they touch. It gives you a precise vocabulary for what a control does.

**CAPEC** sits between weakness and attack. **CWE** names a weakness type, **CAPEC** names how it's attacked, **ATT&CK** names an adversary's behaviour, and **CVE** names one specific flaw. They chain together:

@flow CWE: weakness type > CVE: one flaw > CAPEC: attack pattern > ATT&CK: adversary behaviour

The [Center for Threat-Informed Defense](https://ctid.mitre.org/) publishes mappings that join these together, with security controls too.

**Using them together.** Report to executives with the Kill Chain, track coverage with ATT&CK, analyse a campaign with the Diamond Model, and choose fixes with D3FEND. They're lenses, not competing religions.

?? What was the Kill Chain's most important idea for defenders?
+ Breaking one link can stop the intrusion
- Every attack uses exactly seven malware samples
- Attackers must start with a phishing email
- Perimeter firewalls alone can end every attack
=> It shifted thinking from winning everywhere to interrupting a sequence at any stage, which is still a useful mindset.

## Threat model

These are the frames for threat models, not threats. Attackers don't follow them: real intrusions loop, skip stages, and use legitimate tools. A model describes an attack afterwards, and shouldn't constrain what you imagine.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| [ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/) | Layers on the matrix | Coverage maps |
| [D3FEND](https://d3fend.mitre.org/) | Countermeasure graph | Choosing controls |
| [CAPEC](https://capec.mitre.org/) | Attack patterns | AppSec planning |
| [Mappings Explorer](https://center-for-threat-informed-defense.github.io/mappings-explorer/) | Joins frameworks | Control mapping |
| ATT&CK Workbench | Extends the matrix locally | Adding your own knowledge |

## Defence

- **Choose by audience.** Don't show a matrix to a board.
- **Map incidents after the fact** to find which stage you could have caught.
- **Aim for early detection,** without assuming that you'll get it.
- **Prioritise techniques** by what's used against your sector, not by filling the matrix.
- **Link detections to ATT&CK IDs**, and countermeasures to D3FEND terms, so that you can report gaps.

## Pitfalls

- **"We've covered ATT&CK."** One test per technique isn't coverage.
- **"The Kill Chain is obsolete."** It's limited, yet it's still useful for explaining.
- **Forcing every event into a stage.** A real incident can sit in several.
- **Confusing CVE and CWE.** One's a specific flaw, the other a class.
- **Using old training.** Anything showing 14 tactics predates v19.

?? Which pairing of model and purpose is correct?
+ D3FEND for choosing your defensive countermeasures
- CVE for describing an adversary's behaviour
- CWE for naming one specific flaw
- Diamond Model for scoring patch priority
=> D3FEND catalogues defences. CVE names one flaw, CWE names a class, and the Diamond Model analyses events.

## Exercise

::: law Lab only
This uses public reports. Don't publish non-public incident details from your workplace.
:::

1. Choose a public breach report, such as a [CISA advisory](https://www.cisa.gov/news-events/cybersecurity-advisories).
2. Map its events onto the Kill Chain. Which stages are unclear?
3. Map the same events onto ATT&CK, using the Navigator. What did you gain?
4. Pick one technique, and find two countermeasures in D3FEND.
5. Pick a CWE from lesson 55, then find a related CAPEC entry.

?! A colleague says that the Kill Chain is useless for cloud attacks. Agree or disagree, and show it with one example.

## Further reading

- [Intelligence-Driven Computer Network Defense](https://www.lockheedmartin.com/content/dam/lockheed-martin/rms/documents/cyber/LM-White-Paper-Intel-Driven-Defense.pdf).
- [The Unified Kill Chain](https://www.unifiedkillchain.com/).
- [ATT&CK Philosophy paper](https://attack.mitre.org/docs/ATTACK_Design_and_Philosophy_March_2020.pdf).
- [MITRE D3FEND](https://d3fend.mitre.org/).
- [The Diamond Model paper](https://www.activeresponse.org/wp-content/uploads/2013/07/diamond.pdf).
