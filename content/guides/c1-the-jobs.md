---
title: What the jobs really are
summary: Thirteen security careers described as the work actually is, with entry routes and how AI is changing each.
group: Choosing a path
minutes: 20
source: NIST NICE Framework, the official map of cybersecurity work roles | https://niccs.cisa.gov/workforce-development/nice-framework
---
@term NOC (network operations centre) = The team that keeps a network running. It's a common stepping stone into a SOC.
@term IR (incident response) = Taking over when an attack is confirmed: containing it, removing it, recovering and reporting.
Read this at the Month 12 midpoint and again before the Month 18 commitment. Nobody chooses a specialization from a description: they choose it from experience. Months 9–18 are deliberately a tasting menu.

- **Paths cluster.** Blue: SOC → IR → DFIR → detection → CTI. Red: pentest → red team → AppSec. Builder: security engineering → cloud → DevSecOps → architecture. Governance: GRC → risk → audit → AI governance. Moving inside a cluster is easy. Moving across takes about a year.
- **Entry difficulty isn't the career ceiling.** SOC and GRC are the widest doors. AppSec, cloud and security engineering usually pay more and face less automation pressure. Malware analysis and architecture are destinations, not starting points.

@term SOC (security operations centre) = The team that monitors an organisation's systems and responds to alerts.
@term DFIR = Digital forensics and incident response: investigating what happened and cleaning it up.
@term GRC = Governance, risk and compliance: the side of security that manages risk, policies and audits.
@term CTI (threat intelligence) = Analysis of who attacks organisations and how, used to guide defence.
@term AppSec (application security) = Preventing vulnerabilities in software, from design through code to release.
@term DevSecOps = Building security checks into how software is built and shipped.

## Blue team

| Path | The work | Entry roles | AI impact |
|---|---|---|---|
| **SOC analyst** | Triage alerts, investigate, escalate, document, improve detections. Often shift-based, high volume | SOC L1, security monitoring analyst, MDR analyst, NOC → SOC | Most automation pressure of any path. The seats that remain are analyst-engineers who validate AI verdicts. Fine as an entry, but plan to move up within 18–24 months |
| **Incident response** | Take over when something is confirmed bad: scope, contain, eradicate, recover, report | Usually via SOC L2 or junior DFIR consultant | Resilient. Humans own scoping, containment trade-offs and legal judgment |
| **Digital forensics** | Acquire and analyse evidence with conclusions that survive cross-examination | Junior DFIR analyst, forensic examiner; public sector and consultancy heavy | Parsing is automated; interpretation and testimony aren't. Deepfakes create new demand |
| **Detection engineering** | Design, test and tune detections; treat them as code | Usually after SOC, though a strong public repo can open the door | AI drafts rules easily, so validation and data engineering become the scarce skills |
| **Threat intelligence** | Collect and communicate intelligence on adversaries so others decide better | CTI analyst (fewer seats), often from SOC, journalism, languages or international relations | Summarising is automated; judgment and source criticism aren't. AI-generated "intelligence" makes rigorous analysts more valuable |
| **Malware analysis** | Extract capabilities and indicators from malicious code | Rare as a first job; reached from SOC/IR/CTI | LLM decompilation speeds routine work. A passion path, not a first-job plan |

## Red team

| Path | The work | Entry roles | AI impact |
|---|---|---|---|
| **Penetration testing / red team** | Authorised attacks with a report and debrief. Red teaming adds stealth and objectives over weeks | Junior pentester, vulnerability analyst, application security tester | Routine testing is being automated fast. Value shifts to complex environments, business logic and accountable reporting. Competitive: your portfolio must show depth, not tool runs |

## Builders

| Path | The work | Entry roles | AI impact |
|---|---|---|---|
| **Cloud security** | Design and defend cloud environments: identity, guardrails as code, detection | Cloud security analyst/engineer, DevOps with a security focus | Config review gets automated; identity design stays human. Strong demand |
| **Application security** | Threat modeling, code review, running scanning programmes, enabling developers | Junior AppSec engineer, product security analyst, security champion | AI writes more code, so verifying it gets more valuable. Strong for anyone who can code |
| **Security engineering** | Build the platform: SIEM pipelines, identity, PKI, automation | Junior security engineer, security-minded sysadmin or DevOps | Very resilient: someone must build and govern the agents |
| **DevSecOps** | Embed security in pipelines, containers, supply chain and policy as code | Junior DevSecOps or platform security engineer | Growth area: securing the AI agents that now open pull requests |
| **Security architecture** | Design secure systems and set standards | Not an entry role: typically 5+ years in | Accountability stays human. Start now by writing design documents |

## Governance

| Path | The work | Entry roles | AI impact |
|---|---|---|---|
| **GRC, risk and audit** | Risk assessments, policies, compliance, vendor risk, audits, reporting to management | GRC analyst, junior consultant, IT auditor, compliance analyst. Among the most accessible routes | Drafting is automated; judgment and AI governance create demand. The resilient version is technical GRC |

## The new frontier

**AI security** means securing AI systems and using AI to secure everything else: red-teaming LLM apps and agents, supply chain, guardrails, evaluations. It usually arrives as an AppSec, security engineering or detection role with an AI mandate. It's the growth frontier, but it hires people who are already competent elsewhere. Fundamentals first, AI security second.

?? Which path does the roadmap say faces the most automation pressure at entry level?
+ SOC analyst doing routine alert triage
- Security architect setting standards for organisations
- Incident responder scoping a confirmed compromise
- GRC analyst running a technical review
=> Enrichment and routine triage are moving to AI agents. Starting there is still fine, but plan to grow into detection or IR.

?? Why does the roadmap treat malware analysis as a destination, not a start?
+ Very few juniors get hired for it directly
- It has been fully automated by language models
- It legally requires a full government security clearance
- It uses tools only large companies can buy
=> It's rarely a first job. People usually reach it from SOC, IR or CTI with a public body of work.

?! Which two paths sound most like you today, and why? Keep your answer: you'll compare it with real experience at Month 12.
