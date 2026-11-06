---
title: Threat modeling and secure code
summary: The four questions, data-flow diagrams and STRIDE, ASVS requirements, and building security into development.
month: 17
minutes: 35
builds: a threat model traced to ASVS requirements
source: Threat Modeling Manifesto | https://www.threatmodelingmanifesto.org/
words: threat model, trust boundary, STRIDE
---
Finding bugs one at a time never ends. Threat modeling and secure development prevent whole classes of them, before a line is shipped.

@term threat model = A structured analysis of what could go wrong with a system and what to do about it.
@term data-flow diagram (DFD) = A diagram showing how data moves through a system.
@term trust boundary = A line where data passes between different levels of trust.
@term STRIDE = A checklist of threat types: spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege.
@term ASVS = OWASP's Application Security Verification Standard: a list of security requirements.
@term SAST = Static application security testing: scanning source code for flaws.
@term DAST = Dynamic application security testing: testing a running application.
@term SCA = Software composition analysis: checking dependencies for known flaws.
@term Semgrep = A code-scanning tool with rules you can write yourself.

## Four questions

The [Threat Modeling Manifesto](https://www.threatmodelingmanifesto.org/) boils it down:

1. What are we working on?
2. What can go wrong?
3. What are we going to do about it?
4. Did we do a good enough job?

## STRIDE on a diagram

Draw how data flows, mark where it crosses **trust boundaries**, then walk through STRIDE at each crossing.

@drill stride

?? Where do you focus first on a data-flow diagram?
+ Where data crosses a trust boundary
- The box with the most features
- The components with the newest code
- The part with the nicest diagram
=> Data crossing from less trusted to more trusted is where validation and checks belong.

## Requirements, not opinions

[ASVS 5.0](https://asvs.owasp.org/), released in May 2025, turns "be secure" into testable requirements. Trace each mitigation to one.

## Secure code review

Look for: authentication on each route, **authorization on each object**, how input reaches a query or command, secrets in code, and how errors are handled. Turn repeated findings into [Semgrep rules](https://semgrep.dev/docs/writing-rules/overview), so that a person only has to find each kind once.

## The pipeline of checks

| Check | Finds | When |
|---|---|---|
| SAST | Risky code patterns | On each commit |
| SCA | Known-vulnerable dependencies | On each commit |
| Secret scanning | Keys in code | Before commit |
| DAST | Issues in the running app | Before release |

No single tool is enough. The roadmap's [code-review duel](/guides/d3-using-ai-well/) makes that visible: you versus a scanner versus an LLM.

?! Draw a login feature as a data flow. Mark one trust boundary, and give one STRIDE threat for it.
