---
title: Threat modelling methods
summary: Beyond STRIDE. DREAD and why it faded, attack trees, PASTA, LINDDUN and lightweight approaches, so that you can pick a method that fits the system and the team.
level: intermediate
side: defence
minutes: 45
attack: none
needs: 0068-threat-modeling-and-secure-sdlc
pair: 09-01-attack-models, 16-03-privacy-engineering
source: Threat Modeling Manifesto | https://www.threatmodelingmanifesto.org/
words: attack tree, PASTA, LINDDUN
---
Lesson 68 taught the four questions and STRIDE on a data-flow diagram. That's enough for many teams. But a Master's student should know the wider toolbox, because a good method for a payment API differs from one for a health app. The value is never the document. It's in the conversation that finds a flaw before it's built.

@term attack tree = A diagram with an attacker's goal at the root, and the ways of reaching it as branches.
@term PASTA = The Process for Attack Simulation and Threat Analysis, a seven-stage risk-centred method.
@term LINDDUN = A threat modelling method for privacy.

## Concept

### Fundamentals: the four questions remain

The [Threat Modeling Manifesto](https://www.threatmodelingmanifesto.org/) keeps it simple: what are we working on, what can go wrong, what are we going to do about it, and did we do a good job? Each method below is a different way of answering the second question.

| Method | Focus | Best for |
|---|---|---|
| STRIDE | Threat types per element | Developers, per feature |
| Attack trees | One goal, many paths | High-value targets |
| PASTA | Business risk and simulation | Regulated, risk-led firms |
| LINDDUN | Privacy threats | Personal data systems |
| Kill Chain or ATT&CK | Adversary behaviour | Operations, detection |
| Persona non grata | Who'd attack us, and why? | Brainstorming with mixed teams |

### DREAD and what happened to it

DREAD rated threats on Damage, Reproducibility, Exploitability, Affected users and Discoverability, each from 1 to 10. It was easy to use, but ratings varied wildly between people. Microsoft stopped recommending it, and discoverability was criticised, as it rewards security through obscurity. Today, teams tend to rate with CVSS, simple risk matrices, or [FAIR](/modules/12-03-quantitative-risk/).

### Attack trees

Bruce Schneier [popularised](https://www.schneier.com/academic/archives/1999/12/attack_trees.html) them in 1999. Put the goal at the root, such as "read customer data", then break it down with AND and OR nodes. Tag leaves with cost, skill or detectability, and you can work out the cheapest path. It's a good way to think through something high-value, though trees get large quickly and they don't scale to every feature.

### PASTA

PASTA has seven stages: define objectives, define the technical scope, decompose the application, analyse threats, analyse vulnerabilities, model attacks, and analyse risk. It starts from business impact and ends in a prioritised risk view. It's heavy, and it suits large or regulated programmes.

### LINDDUN

[LINDDUN](https://linddun.org/) does for privacy what STRIDE does for security. It walks a data-flow diagram looking for **L**inking, **I**dentifying, **N**on-repudiation, **D**etecting, **D**ata disclosure, **U**nawareness and **N**on-compliance. See [Privacy engineering](/modules/16-03-privacy-engineering/).

### Advanced: threat modelling that lasts

A big annual workshop dies quickly. Modern practice makes it **continuous**: small models per feature, in the pull request, as a design review. Adam Shostack's "elevation of privilege" card game helps teams practise. **Threat models as code**, with tools like pytm, keep diagrams beside the code.

**Modelling AI systems** adds new trust boundaries: prompts, retrieved documents, tool calls. MITRE ATLAS and the OWASP LLM list extend the same thinking. Lesson 71 did exactly this.

**Evaluate honestly.** Was a real flaw found? Did it change a design? Count those, and not the number of documents written.

?? Why did Microsoft stop recommending DREAD?
+ Its scores were subjective and very inconsistent
- Its five letters were hard to remember
- It only worked on Windows desktop software
- It was withdrawn under a new law
=> Two reviewers could rate one threat very differently, so the numbers looked precise without being reliable.

## Threat model

Picking the wrong method is itself a risk: too heavy, and nobody does it; too light, and it misses what matters. Common blind spots are insiders, recovery flows, third-party services and abuse by legitimate users, which is why [abuse cases](/courses/0068-threat-modeling-and-secure-sdlc/) help.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| OWASP Threat Dragon | Free modelling tool | Small teams |
| Microsoft Threat Modeling Tool | STRIDE on diagrams | Windows and Azure teams |
| pytm | Threat models as code | Keeping models in Git |
| Elevation of Privilege | Card game | Teaching and workshops |
| draw.io | Diagrams | Most of the time, honestly |

## Defence

- **Start small.** A 30-minute session on one feature beats a stalled big project.
- **Include developers,** since they know where the bodies are buried.
- **Write down decisions,** including accepted risks and their owner.
- **Turn threats into tickets and tests.**
- **Revisit** when the design changes.
- **Choose one method** and get good at it, before adding others.

## Pitfalls

- **Modelling after launch.** It's cheapest during design.
- **A 60-page document nobody reads.**
- **Skipping the diagram.** Teams often disagree on what the system is, which is a finding in itself.
- **Listing threats with no action.** The third question matters.
- **Treating the tool as the method.** Tools produce lists, and people produce insight.

?? What do attack trees show that a STRIDE table doesn't?
+ Alternative paths to one attacker goal
- The cost of each firewall licence
- The names of each threat actor
- The patch level of each server
=> A tree starts from a goal and shows all the routes to it, including the cheapest one.

## Exercise

::: law Lab only
Model your own project or a fictional system. If you model a real employer's system, keep the output confidential.
:::

1. Take a project from this course, and draw its data-flow diagram.
2. Apply STRIDE to one trust boundary, and write five threats.
3. Build an attack tree for "read another user's data". Tag leaves with difficulty, and find the easiest path.
4. Apply LINDDUN to the same diagram. What's new?
5. Choose one threat, and turn it into a test case and a ticket.

?! Your startup has six engineers and no security team. Recommend a threat modelling practice that they'd really keep doing, and describe it in five lines.

## Further reading

- Adam Shostack, *Threat Modeling: Designing for Security*.
- [Threat Modeling Manifesto](https://www.threatmodelingmanifesto.org/).
- Bruce Schneier, [Attack Trees](https://www.schneier.com/academic/archives/1999/12/attack_trees.html).
- [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html).
- [LINDDUN](https://linddun.org/).
